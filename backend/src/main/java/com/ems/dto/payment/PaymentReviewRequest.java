package com.ems.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PaymentReviewRequest {
    @NotBlank(message = "Decision is required")
    private String decision;
    @Size(max = 500, message = "Review note must be 500 characters or fewer")
    private String note;
    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
