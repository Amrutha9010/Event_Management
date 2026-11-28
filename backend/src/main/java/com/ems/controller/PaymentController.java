package com.ems.controller;

import com.ems.dto.payment.PaymentInstructionsResponse;
import com.ems.service.PaymentService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    public PaymentController(PaymentService paymentService) { this.paymentService = paymentService; }

    @GetMapping("/{bookingId}/instructions")
    public ResponseEntity<PaymentInstructionsResponse> instructions(@PathVariable Long bookingId, Authentication authentication) {
        return ResponseEntity.ok(paymentService.getInstructions(authentication.getName(), bookingId));
    }

    @PostMapping(value = "/{bookingId}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> submit(
            @PathVariable Long bookingId,
            @RequestParam("transactionId") String transactionId,
            @RequestPart("screenshot") MultipartFile screenshot,
            Authentication authentication
    ) {
        paymentService.submitProof(authentication.getName(), bookingId, transactionId, screenshot);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Payment proof submitted for admin verification"));
    }
}
