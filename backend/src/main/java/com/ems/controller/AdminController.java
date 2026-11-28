package com.ems.controller;

import com.ems.dto.admin.AdminAnalyticsResponse;
import com.ems.dto.auth.UserSummaryResponse;
import com.ems.dto.booking.BookingResponse;
import com.ems.dto.booking.BookingStatusUpdateRequest;
import com.ems.dto.payment.PaymentReviewRequest;
import com.ems.dto.payment.PaymentReviewResponse;
import com.ems.service.PaymentService;
import com.ems.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final PaymentService paymentService;

    public AdminController(AdminService adminService, PaymentService paymentService) {
        this.adminService = adminService;
        this.paymentService = paymentService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(adminService.getAllBookings());
    }

    @GetMapping("/payments/pending")
    public ResponseEntity<List<PaymentReviewResponse>> getPendingPayments() {
        return ResponseEntity.ok(paymentService.getPendingReviews());
    }

    @PutMapping("/payments/{bookingId}/review")
    public ResponseEntity<Void> reviewPayment(@PathVariable Long bookingId, @Valid @RequestBody PaymentReviewRequest request) {
        paymentService.reviewPayment(bookingId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/payments/{bookingId}/proof")
    public ResponseEntity<Resource> getPaymentProof(@PathVariable Long bookingId) throws java.io.IOException {
        Path path = paymentService.getProofPath(bookingId);
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok().contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"payment-proof" + path.getFileName().toString().substring(path.getFileName().toString().lastIndexOf('.')) + "\"")
                .body(new FileSystemResource(path));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateBookingStatus(bookingId, request));
    }

    @PutMapping("/bookings/{bookingId}/check-in")
    public ResponseEntity<BookingResponse> checkInBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(adminService.checkInBooking(bookingId));
    }

}
