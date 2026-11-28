ALTER TABLE bookings
    ADD COLUMN payment_transaction_id VARCHAR(100) NULL,
    ADD COLUMN payment_proof_path VARCHAR(500) NULL,
    ADD COLUMN payment_submitted_at DATETIME NULL,
    ADD COLUMN payment_reviewed_at DATETIME NULL,
    ADD COLUMN payment_review_note VARCHAR(500) NULL;

CREATE UNIQUE INDEX uk_bookings_payment_transaction_id
    ON bookings (payment_transaction_id);
