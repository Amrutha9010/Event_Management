import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import { asArray } from "../utils/apiData";
import { formatCurrency, formatDate } from "../utils/format";

function UserDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get("/bookings/my");
        setBookings(asArray(res.data));
      } catch {
        toast.error("Unable to fetch your bookings");
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) return <Loader />;

  return (
    <section>
      <div className="section-head">
        <h2>My Bookings</h2>
      </div>
      {bookings.length === 0 ? (
        <EmptyState
          title="No Bookings Yet"
          message="Book an event to see tickets, status, and check-in details here."
          action={
            <Link className="btn primary" to="/events">
              Browse Events
            </Link>
          }
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Event Date</th>
                <th>Tickets</th>
                <th>Total Price</th>
                <th>Booked On</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Ticket / Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.eventName}</td>
                  <td>{formatDate(booking.eventDate)}</td>
                  <td>{booking.quantity || 1}</td>
                  <td>{formatCurrency(booking.finalPrice || booking.eventPrice)}</td>
                  <td>{formatDate(booking.bookingDate)}</td>
                  <td>
                    <span className={`status ${booking.status === "BOOKED" ? "ok" : booking.status === "PENDING" ? "pending" : "cancel"}`}>
                      {booking.checkedIn ? "CHECKED IN" : booking.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${booking.paymentStatus === "VERIFIED" || booking.paymentStatus === "NOT_REQUIRED" ? "ok" : booking.paymentStatus === "REJECTED" ? "cancel" : "pending"}`}>
                      {booking.paymentStatus || "NOT_REQUIRED"}
                    </span>
                    {booking.paymentTransactionId && <p className="muted">Txn: {booking.paymentTransactionId}</p>}
                    {booking.paymentReviewNote && <p className="muted">{booking.paymentReviewNote}</p>}
                  </td>
                  <td>
                    {booking.status === "PENDING" && booking.paymentMethod === "UPI" && booking.paymentStatus !== "UNDER_REVIEW" && booking.paymentStatus !== "VERIFIED" ? (
                      <Link className="btn tiny primary" to={`/payment/${booking.id}`}>Pay Now</Link>
                    ) : booking.paymentStatus === "UNDER_REVIEW" ? <span className="muted-action">Awaiting verification</span> : booking.paymentStatus === "REJECTED" || booking.status === "CANCELLED" ? <span className="muted-action">Booking cancelled</span> : (
                      <><strong>{booking.ticketCode}</strong><p className="qr-box">{booking.qrPayload}</p></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default UserDashboardPage;
