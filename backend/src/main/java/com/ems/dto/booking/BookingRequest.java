package com.ems.dto.booking;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class BookingRequest {

    @NotNull(message = "Event id is required")
    private Long eventId;

    @Min(value = 1, message = "At least one ticket must be selected")
    @Max(value = 20, message = "A maximum of 20 tickets can be booked per event")
    private Integer quantity = 1;

    private String couponCode;
    private String paymentMethod;

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public Integer getQuantity() {
        return quantity == null ? 1 : quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
