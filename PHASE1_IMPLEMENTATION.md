# Eventora Phase 1 – Ticket Quantity and Live Seat Availability

## What changed

- Added `quantity` to each booking, defaulting to 1 for compatibility with existing API clients and existing database rows.
- Added request validation: 1–20 tickets per event in a single booking.
- Booking totals now apply coupon discounts to the per-ticket price and multiply by the requested quantity.
- Seat reservation queries now sum ticket quantities for `PENDING` and `BOOKED` bookings instead of counting booking rows.
- Admin acceptance and event-capacity updates use quantity-aware seat calculations.
- Event API responses continue to expose `bookedSeats` and `availableSeats`; these now represent ticket counts rather than booking-record counts.
- Added a 15-second background refresh to the event listing, event details, and cart so availability updates without a manual page reload.
- Added ticket quantity controls to event details and the cart. Booking history and admin booking tables display ticket quantity.
- Added a regression test covering a multi-ticket booking, total price calculation, updated availability, and over-capacity rejection.

## Database update

For a new database, `database/ems_schema.sql` includes `bookings.quantity` with a default of 1.

For an existing database, run this once before starting the updated backend:

```sql
ALTER TABLE bookings
    ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER final_price;
```

The same statement is provided in `database/migrations/V2__add_booking_quantity.sql`.

## Booking rules

- Existing requests that omit `quantity` continue to book one ticket.
- A booking can contain 1–20 tickets for one event.
- A user's existing rule against creating another active booking for the same event remains unchanged.
- Both `PENDING` and `BOOKED` bookings reserve seats. `CANCELLED` bookings do not.
- The backend locks the event row while creating bookings and validates requested quantity against remaining capacity. The frontend refresh is for display only; the backend remains authoritative.
- This phase does not add payment processing or unpaid-reservation expiry; those belong to the payment workflow phase.

## Verification status

- Backend integration test added to `ProductionReadinessFlowTests`.
- Backend tests could not be executed in this environment because Maven (`mvn`/`mvnw`) is not installed.
- Frontend production build could not be executed because dependency installation was interrupted and the npm cache is missing at least one required package (`yallist`).
- Run `mvn test` from `backend/` and `npm ci && npm run build` from `frontend/` on a machine with Maven and npm registry access before merging/deploying.
