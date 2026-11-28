ALTER TABLE events
    ADD COLUMN organizer_upi_id VARCHAR(100) NULL,
    ADD COLUMN organizer_payee_name VARCHAR(180) NULL,
    ADD COLUMN payment_instructions VARCHAR(1000) NULL;

ALTER TABLE bookings
    ADD COLUMN payment_upi_id_snapshot VARCHAR(100) NULL,
    ADD COLUMN payment_payee_name_snapshot VARCHAR(180) NULL;

-- Preserve access for existing organizer accounts while aligning the application to USER and ADMIN.
UPDATE users SET role = 'ADMIN' WHERE role = 'ORGANIZER';
