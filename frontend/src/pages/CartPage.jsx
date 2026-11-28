import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import Modal from "../components/Modal";
import { useCart } from "../context/CartContext";
import { formatCurrency, formatDate } from "../utils/format";

function CartPage() {
  const { items, removeFromCart, clearCart, updateQuantity, updateEventDetails } = useCart();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const hasUnavailableItems = items.some((item) => item.availableSeats != null && (item.availableSeats < Number(item.quantity || 1)));

  useEffect(() => {
    if (items.length === 0) return undefined;
    let active = true;
    const refreshAvailability = async () => {
      const results = await Promise.allSettled(items.map((item) => api.get(`/events/${item.id}`)));
      if (!active) return;
      results.forEach((result) => {
        if (result.status === "fulfilled") updateEventDetails(result.value.data);
      });
    };
    refreshAvailability();
    const timer = window.setInterval(refreshAvailability, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [items.map((item) => item.id).join(","), updateEventDetails]);

  const confirmBooking = async () => {
    if (booking) return;
    setBooking(true);
    try {
      await api.post("/bookings/batch", {
        items: items.map((item) => ({ eventId: item.id, quantity: item.quantity || 1, couponCode, paymentMethod: "UPI" })),
      });
      toast.success("Booking created. Complete UPI payment from My Bookings.");
      clearCart();
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Booking failed for one or more events");
    } finally {
      setBooking(false);
      setModalOpen(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="card empty-card">
        <h2>Your cart is empty</h2>
        <p>Add events from the events page to book your next experience.</p>
        <Link to="/events" className="btn primary">
          Browse Events
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="section-head">
        <h2>Your Cart</h2>
      </div>
      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div>
              <h3>{item.name}</h3>
              <p>{formatDate(item.date)}</p>
              <p>{item.availableSeats === 0 ? "Sold out" : `${item.availableSeats ?? "—"} seats currently available`}</p>
              <div className="quantity-control" aria-label={`Ticket quantity for ${item.name}`}>
                <button className="btn tiny ghost" type="button" onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} disabled={(item.quantity || 1) <= 1}>−</button>
                <strong>{item.quantity || 1} ticket(s)</strong>
                <button className="btn tiny ghost" type="button" onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} disabled={(item.quantity || 1) >= 20 || (item.availableSeats != null && (item.quantity || 1) >= item.availableSeats)}>+</button>
              </div>
            </div>
            <div className="cart-item-right">
              <strong>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
              <button className="btn ghost" onClick={() => removeFromCart(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div className="coupon-box">
          <input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <span>Try WELCOME10 or STUDENT20</span>
        </div>
        <h3>Total: {formatCurrency(total)}</h3>
        {hasUnavailableItems && <p className="form-error">One or more events do not have enough seats for the selected quantity. Reduce the quantity or remove the event.</p>}
        <button className="btn primary" onClick={() => setModalOpen(true)} disabled={hasUnavailableItems}>
          Submit Booking
        </button>
      </div>

      <Modal
        open={modalOpen}
        title="Confirm Booking"
        onClose={() => setModalOpen(false)}
        onConfirm={confirmBooking}
        confirmText={booking ? "Submitting..." : "Submit Request"}
        confirmDisabled={booking || hasUnavailableItems}
      >
        <p>You are booking {items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} ticket(s) across {items.length} event(s).</p>
        <p>Estimated total amount: {formatCurrency(total)}</p>
        <p>After submitting, open My Bookings to pay by UPI and upload your transaction ID and payment screenshot. Your ticket is confirmed only after admin verification.</p>
      </Modal>
    </section>
  );
}

export default CartPage;
