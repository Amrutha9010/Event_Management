# Eventora Phase 2 – UPI Payment and Admin Verification

## Implemented workflow

1. Cart checkout creates a pending booking using `paymentMethod=UPI` and `paymentStatus=NOT_SUBMITTED`.
2. My Bookings displays a Pay Now link for a pending UPI booking.
3. The payment page requests booking-specific UPI instructions from the backend. The backend constructs a UPI intent URI with payee, amount, currency and booking reference, then generates a QR image locally with ZXing.
4. The user submits a UPI transaction/reference ID and JPG/PNG/WEBP screenshot (maximum 5 MB).
5. The payment moves to `UNDER_REVIEW`; booking remains `PENDING` and continues reserving seats.
6. Admin reviews the transaction ID and screenshot. Admin must independently verify cleared funds in the receiving UPI app/bank account.
7. Approve sets payment `VERIFIED` and booking `BOOKED`; reject sets payment `REJECTED` and booking `CANCELLED`, releasing its seats.
8. The existing booking notification event is published after the review transaction commits, so the existing email notification mechanism can notify the user when SMTP is configured.

## New configuration

Set these environment variables before running the backend:

- `EVENTORA_UPI_ID` – receiving UPI ID, for example `merchantname@bank`.
- `EVENTORA_UPI_PAYEE_NAME` – payee name shown in the UPI intent (optional; defaults to Eventora).
- `PAYMENT_PROOF_STORAGE_DIR` – private writable folder for uploaded screenshots (optional; defaults to `./uploads/payment-proofs`).

The UPI ID must belong to the event organizer/merchant account. Do not use a personal UPI ID in a public deployment without considering reconciliation and refund responsibilities.

## Database migration

For an existing database, execute `database/migrations/V3__add_upi_payment_verification.sql` once. It adds transaction ID, screenshot path, submitted/reviewed timestamps and review note. Existing rows remain unchanged. The transaction ID column has a unique index.

The application also uses Hibernate `ddl-auto=update`, but the migration is supplied for explicit database versioning.

## API additions

- `GET /api/payments/{bookingId}/instructions` – authenticated booking owner receives UPI details and QR data URL.
- `POST /api/payments/{bookingId}/submit` – authenticated owner submits multipart `transactionId` and `screenshot`.
- `GET /api/admin/payments/pending` – admin list of submissions awaiting verification.
- `GET /api/admin/payments/{bookingId}/proof` – admin-only screenshot endpoint.
- `PUT /api/admin/payments/{bookingId}/review` – admin sends `{ "decision": "APPROVE" | "REJECT", "note": "..." }`.

## Status values

Payment status: `NOT_SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`.
Booking status remains the existing `PENDING`, `BOOKED`, `CANCELLED`.
The old admin booking-status endpoint cannot confirm a UPI booking unless its payment is already `VERIFIED`.

## Security and limitations

- Payment screenshots are stored outside the public static web directory and are only served by an admin-protected endpoint.
- File size and image MIME type are checked; the server generates the stored filename.
- A submitted screenshot/transaction ID is not automatically trusted. Admin must check the actual bank/UPI credit before approval.
- This is manual UPI verification, not a payment gateway. The site does not receive automatic payment confirmation and does not debit/collect funds itself.
- Rejected payments cancel the booking and release the seat reservation. This phase does not implement refunds for payments that were actually received; handle any refund manually outside Eventora.
- Existing non-UPI bookings (`paymentMethod` other than UPI) retain the previous admin approval workflow.
- Email notifications still require SMTP configuration and `app.notifications.email.enabled=true`.
