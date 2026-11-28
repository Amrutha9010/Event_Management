package com.ems.service;

import com.ems.dto.payment.PaymentInstructionsResponse;
import com.ems.dto.payment.PaymentReviewRequest;
import com.ems.dto.payment.PaymentReviewResponse;
import java.nio.file.Path;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface PaymentService {
    PaymentInstructionsResponse getInstructions(String currentUserEmail, Long bookingId);
    void submitProof(String currentUserEmail, Long bookingId, String transactionId, MultipartFile screenshot);
    List<PaymentReviewResponse> getPendingReviews();
    void reviewPayment(Long bookingId, PaymentReviewRequest request);
    Path getProofPath(Long bookingId);
}
