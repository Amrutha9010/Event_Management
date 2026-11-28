package com.ems.entity;

import com.ems.entity.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BookingStatus status = BookingStatus.BOOKED;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 40)
    private String couponCode;

    @Column(name = "payment_method", length = 40)
    private String paymentMethod;

    @Column(name = "payment_status", length = 24)
    private String paymentStatus = "NOT_REQUIRED";

    @Column(name = "payment_upi_id_snapshot", length = 100)
    private String paymentUpiIdSnapshot;

    @Column(name = "payment_payee_name_snapshot", length = 180)
    private String paymentPayeeNameSnapshot;

    @Column(name = "payment_transaction_id", unique = true, length = 100)
    private String paymentTransactionId;

    @Column(name = "payment_proof_path", length = 500)
    private String paymentProofPath;

    @Column(name = "payment_submitted_at")
    private LocalDateTime paymentSubmittedAt;

    @Column(name = "payment_reviewed_at")
    private LocalDateTime paymentReviewedAt;

    @Column(name = "payment_review_note", length = 500)
    private String paymentReviewNote;

    @Column(name = "ticket_code", unique = true, length = 80)
    private String ticketCode;

    @Column(name = "checked_in", nullable = false)
    private boolean checkedIn = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public Integer getQuantity() {
        return quantity == null ? 1 : quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity == null ? 1 : quantity;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
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

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentUpiIdSnapshot() { return paymentUpiIdSnapshot; }
    public void setPaymentUpiIdSnapshot(String value) { paymentUpiIdSnapshot = value; }
    public String getPaymentPayeeNameSnapshot() { return paymentPayeeNameSnapshot; }
    public void setPaymentPayeeNameSnapshot(String value) { paymentPayeeNameSnapshot = value; }
    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }
    public String getPaymentProofPath() { return paymentProofPath; }
    public void setPaymentProofPath(String paymentProofPath) { this.paymentProofPath = paymentProofPath; }
    public LocalDateTime getPaymentSubmittedAt() { return paymentSubmittedAt; }
    public void setPaymentSubmittedAt(LocalDateTime paymentSubmittedAt) { this.paymentSubmittedAt = paymentSubmittedAt; }
    public LocalDateTime getPaymentReviewedAt() { return paymentReviewedAt; }
    public void setPaymentReviewedAt(LocalDateTime paymentReviewedAt) { this.paymentReviewedAt = paymentReviewedAt; }
    public String getPaymentReviewNote() { return paymentReviewNote; }
    public void setPaymentReviewNote(String paymentReviewNote) { this.paymentReviewNote = paymentReviewNote; }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public boolean isCheckedIn() {
        return checkedIn;
    }

    public void setCheckedIn(boolean checkedIn) {
        this.checkedIn = checkedIn;
    }
}
