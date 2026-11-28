-- Run once against an existing Eventora database before starting the updated backend.
ALTER TABLE bookings
    ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER final_price;
