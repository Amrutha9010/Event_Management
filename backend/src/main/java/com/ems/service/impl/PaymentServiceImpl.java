package com.ems.service.impl;

import com.ems.dto.payment.PaymentInstructionsResponse;
import com.ems.dto.payment.PaymentReviewRequest;
import com.ems.dto.payment.PaymentReviewResponse;
import com.ems.entity.Booking;
import com.ems.entity.enums.BookingStatus;
import com.ems.exception.BadRequestException;
import com.ems.exception.ResourceNotFoundException;
import com.ems.notification.BookingNotification;
import com.ems.repository.BookingRepository;
import com.ems.service.PaymentService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PaymentServiceImpl implements PaymentService {
    private static final long MAX_PROOF_BYTES = 5L * 1024L * 1024L;
    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Path proofDirectory;

    public PaymentServiceImpl(
            BookingRepository bookingRepository,
            ApplicationEventPublisher eventPublisher,
            @Value("${app.payment.proof-storage-dir:./uploads/payment-proofs}") String proofDirectory
    ) {
        this.bookingRepository = bookingRepository;
        this.eventPublisher = eventPublisher;
        this.proofDirectory = Path.of(proofDirectory).toAbsolutePath().normalize();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentInstructionsResponse getInstructions(String currentUserEmail, Long bookingId) {
        Booking booking = findBooking(bookingId);
        assertOwner(booking, currentUserEmail);
        if (!"UPI".equalsIgnoreCase(booking.getPaymentMethod())) throw new BadRequestException("This booking does not use UPI payment");
        if (booking.getStatus() != BookingStatus.PENDING
                || "VERIFIED".equalsIgnoreCase(booking.getPaymentStatus())
                || "UNDER_REVIEW".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new BadRequestException("Payment instructions are not available for this booking");
        }
        String upiId = booking.getPaymentUpiIdSnapshot();
        String payeeName = booking.getPaymentPayeeNameSnapshot();
        if (upiId == null || upiId.isBlank() || payeeName == null || payeeName.isBlank()) {
            throw new BadRequestException("UPI details are unavailable for this booking. Contact the administrator.");
        }
        String amount = booking.getFinalPrice().setScale(2, RoundingMode.HALF_UP).toPlainString();
        String note = "Eventora booking " + booking.getId();
        String uri = "upi://pay?pa=" + encode(upiId) + "&pn=" + encode(payeeName)
                + "&am=" + encode(amount) + "&cu=INR&tn=" + encode(note);
        PaymentInstructionsResponse response = new PaymentInstructionsResponse();
        response.setBookingId(booking.getId());
        response.setEventName(booking.getEvent().getName());
        response.setInstructions(booking.getEvent().getPaymentInstructions());
        response.setUpiId(upiId);
        response.setPayeeName(payeeName);
        response.setAmount(booking.getFinalPrice());
        response.setUpiUri(uri);
        response.setQrCodeDataUrl(generateQrDataUrl(uri));
        return response;
    }

    @Override
    @Transactional
    public void submitProof(String currentUserEmail, Long bookingId, String transactionId, MultipartFile screenshot) {
        Booking booking = findBooking(bookingId);
        assertOwner(booking, currentUserEmail);
        if (!"UPI".equalsIgnoreCase(booking.getPaymentMethod())) throw new BadRequestException("This booking does not use UPI payment");
        if (booking.getStatus() != BookingStatus.PENDING) throw new BadRequestException("Only pending bookings can submit payment proof");
        if ("VERIFIED".equalsIgnoreCase(booking.getPaymentStatus())) throw new BadRequestException("Payment has already been verified");
        if ("UNDER_REVIEW".equalsIgnoreCase(booking.getPaymentStatus())) throw new BadRequestException("Your payment proof is already under admin review");
        String cleanedTransactionId = transactionId == null ? "" : transactionId.trim();
        if (cleanedTransactionId.length() < 6 || cleanedTransactionId.length() > 100) {
            throw new BadRequestException("Enter a valid UPI transaction/reference ID (6–100 characters)");
        }
        if (bookingRepository.existsByPaymentTransactionId(cleanedTransactionId)
                && !cleanedTransactionId.equals(booking.getPaymentTransactionId())) {
            throw new BadRequestException("This transaction ID has already been submitted");
        }
        if (screenshot == null || screenshot.isEmpty()) throw new BadRequestException("Payment screenshot is required");
        if (screenshot.getSize() > MAX_PROOF_BYTES) throw new BadRequestException("Screenshot must be 5 MB or smaller");
        String contentType = screenshot.getContentType() == null ? "" : screenshot.getContentType().toLowerCase(Locale.ROOT);
        String extension = switch (contentType) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new BadRequestException("Upload a JPG, PNG or WEBP screenshot");
        };
        try {
            if (!hasValidImageSignature(screenshot, extension)) {
                throw new BadRequestException("The uploaded file is not a valid image of the selected type");
            }
            Files.createDirectories(proofDirectory);
            String fileName = "booking-" + bookingId + "-" + UUID.randomUUID() + extension;
            Path target = proofDirectory.resolve(fileName).normalize();
            if (!target.startsWith(proofDirectory)) throw new BadRequestException("Invalid upload path");
            screenshot.transferTo(target);
            if (booking.getPaymentProofPath() != null) {
                try { Files.deleteIfExists(Path.of(booking.getPaymentProofPath())); } catch (IOException ignored) { }
            }
            booking.setPaymentTransactionId(cleanedTransactionId);
            booking.setPaymentProofPath(target.toString());
            booking.setPaymentSubmittedAt(LocalDateTime.now());
            booking.setPaymentReviewedAt(null);
            booking.setPaymentReviewNote(null);
            booking.setPaymentStatus("UNDER_REVIEW");
            bookingRepository.save(booking);
        } catch (IOException ex) {
            throw new BadRequestException("Unable to save payment screenshot. Please try again");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentReviewResponse> getPendingReviews() {
        return bookingRepository.findByPaymentStatusOrderByPaymentSubmittedAtAsc("UNDER_REVIEW")
                .stream().map(this::mapReview).toList();
    }

    @Override
    @Transactional
    public void reviewPayment(Long bookingId, PaymentReviewRequest request) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.PENDING || !"UNDER_REVIEW".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new BadRequestException("This payment is not waiting for review");
        }
        String decision = request.getDecision().trim().toUpperCase(Locale.ROOT);
        if (!decision.equals("APPROVE") && !decision.equals("REJECT")) throw new BadRequestException("Decision must be APPROVE or REJECT");
        booking.setPaymentReviewedAt(LocalDateTime.now());
        booking.setPaymentReviewNote(request.getNote() == null ? null : request.getNote().trim());
        if (decision.equals("APPROVE")) {
            booking.setPaymentStatus("VERIFIED");
            booking.setStatus(BookingStatus.BOOKED);
        } else {
            booking.setPaymentStatus("REJECTED");
            booking.setStatus(BookingStatus.CANCELLED);
        }
        Booking saved = bookingRepository.save(booking);
        String message = decision.equals("APPROVE")
                ? "Your UPI payment has been verified and your booking is confirmed. Your ticket is available in My Bookings."
                : "Your UPI payment could not be verified and the booking was cancelled. " + (booking.getPaymentReviewNote() == null ? "Please contact the organizer." : booking.getPaymentReviewNote());
        eventPublisher.publishEvent(new BookingNotification(
                saved.getUser().getEmail(), saved.getUser().getName(), saved.getEvent().getName(),
                saved.getEvent().getDate(), saved.getStatus(), saved.getTicketCode(), saved.getFinalPrice(), message));
    }

    @Override
    @Transactional(readOnly = true)
    public Path getProofPath(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getPaymentProofPath() == null) throw new ResourceNotFoundException("Payment screenshot not found");
        Path path = Path.of(booking.getPaymentProofPath()).toAbsolutePath().normalize();
        if (!path.startsWith(proofDirectory) || !Files.isRegularFile(path)) throw new ResourceNotFoundException("Payment screenshot not found");
        return path;
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }
    private void assertOwner(Booking booking, String email) {
        if (!booking.getUser().getEmail().equalsIgnoreCase(email)) throw new org.springframework.security.access.AccessDeniedException("You cannot access this booking");
    }
    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private boolean hasValidImageSignature(MultipartFile file, String extension) throws IOException {
        byte[] header = file.getInputStream().readNBytes(12);
        if (extension.equals(".png")) {
            return header.length >= 8 && (header[0] & 0xff) == 0x89 && header[1] == 0x50
                    && header[2] == 0x4e && header[3] == 0x47 && header[4] == 0x0d
                    && header[5] == 0x0a && header[6] == 0x1a && header[7] == 0x0a;
        }
        if (extension.equals(".jpg")) {
            return header.length >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8
                    && (header[2] & 0xff) == 0xff;
        }
        return extension.equals(".webp") && header.length >= 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
    }
    private String generateQrDataUrl(String value) {
        try {
            var matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 320, 320);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception ex) {
            throw new BadRequestException("Unable to generate UPI QR code");
        }
    }
    private PaymentReviewResponse mapReview(Booking booking) {
        PaymentReviewResponse response = new PaymentReviewResponse();
        response.setBookingId(booking.getId());
        response.setCustomerName(booking.getUser().getName());
        response.setCustomerEmail(booking.getUser().getEmail());
        response.setEventName(booking.getEvent().getName());
        response.setEventDate(booking.getEvent().getDate());
        response.setQuantity(booking.getQuantity());
        response.setAmount(booking.getFinalPrice());
        response.setTransactionId(booking.getPaymentTransactionId());
        response.setPaymentStatus(booking.getPaymentStatus());
        response.setSubmittedAt(booking.getPaymentSubmittedAt());
        response.setProofUrl("/api/admin/payments/" + booking.getId() + "/proof");
        return response;
    }
}
