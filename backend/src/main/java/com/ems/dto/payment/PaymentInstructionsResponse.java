package com.ems.dto.payment;

import java.math.BigDecimal;

public class PaymentInstructionsResponse {
    private Long bookingId;
    private String eventName;
    private String instructions;
    private String upiId;
    private String payeeName;
    private BigDecimal amount;
    private String upiUri;
    private String qrCodeDataUrl;
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
    public String getPayeeName() { return payeeName; }
    public void setPayeeName(String payeeName) { this.payeeName = payeeName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getUpiUri() { return upiUri; }
    public void setUpiUri(String upiUri) { this.upiUri = upiUri; }
    public String getQrCodeDataUrl() { return qrCodeDataUrl; }
    public void setQrCodeDataUrl(String qrCodeDataUrl) { this.qrCodeDataUrl = qrCodeDataUrl; }
}
