import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import Loader from "../components/Loader";
import SmartImage from "../components/SmartImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { asArray } from "../utils/apiData";
import { formatCurrency, formatDate } from "../utils/format";

function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const [eventItem, setEventItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [loading, setLoading] = useState(true);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/events/${id}`);
        setEventItem(typeof res.data === "object" && !Array.isArray(res.data) ? res.data : null);
        const reviewsRes = await api.get(`/events/${id}/reviews`);
        setReviews(asArray(reviewsRes.data));
      } catch {
        toast.error("Unable to load event");
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  useEffect(() => {
    const refreshAvailability = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEventItem((current) => current ? { ...current, ...res.data } : res.data);
      } catch {
        // Keep the last successfully loaded event data visible during temporary network errors.
      }
    };
    const timer = window.setInterval(refreshAvailability, 15000);
    return () => window.clearInterval(timer);
  }, [id]);

  const handleBook = () => {
    if (!isAuthenticated) {
      toast.info("Please login first");
      navigate("/login");
      return;
    }
    const added = addToCart(eventItem, ticketQuantity);
    if (added) {
      toast.success("Event added to cart");
      navigate("/cart");
    } else {
      toast.info("Event already in cart");
      navigate("/cart");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please login to review events");
      return;
    }
    try {
      await api.post(`/events/${id}/reviews`, {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      const [eventRes, reviewsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/reviews`),
      ]);
      setEventItem(typeof eventRes.data === "object" && !Array.isArray(eventRes.data) ? eventRes.data : null);
      setReviews(asArray(reviewsRes.data));
      setReviewForm({ rating: "5", comment: "" });
      toast.success("Review saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save review");
    }
  };

  if (loading) return <Loader />;
  if (!eventItem) return <div className="empty">Event not found.</div>;

  return (
    <section className="details-page">
      <SmartImage
        className="details-image"
        src={eventItem.imageUrl}
        alt={eventItem.name}
        width={1100}
        height={700}
        decoding="async"
      />
      <div className="details-content">
        <div className="chip">{eventItem.category}</div>
        <h2>{eventItem.name}</h2>
        <p>{eventItem.description}</p>
        <div className="detail-row">
          <span>Date</span>
          <strong>{formatDate(eventItem.date)}</strong>
        </div>
        <div className="detail-row">
          <span>Ticket Price</span>
          <strong>{formatCurrency(eventItem.price)}</strong>
        </div>
        <div className="detail-row">
          <span>Seats</span>
          <strong>{eventItem.availableSeats === 0 ? "Sold Out" : eventItem.availableSeats <= 20 ? `Only ${eventItem.availableSeats} seats left` : `${eventItem.availableSeats}/${eventItem.capacity} available`}</strong>
        </div>
        {eventItem.capacity > 0 && (
          <div className="availability-progress" aria-label={`${eventItem.capacity - eventItem.availableSeats} of ${eventItem.capacity} seats reserved`}>
            <div className="availability-progress-track">
              <div className="availability-progress-fill" style={{ width: `${Math.min(100, ((eventItem.capacity - eventItem.availableSeats) / eventItem.capacity) * 100)}%` }} />
            </div>
            <small>{eventItem.capacity - eventItem.availableSeats} of {eventItem.capacity} seats reserved</small>
          </div>
        )}
        {!isAdmin && eventItem.availableSeats > 0 && (
          <div className="detail-row ticket-quantity-row">
            <span>Tickets</span>
            <div className="quantity-control">
              <button className="btn tiny ghost" type="button" onClick={() => setTicketQuantity((value) => Math.max(1, value - 1))} disabled={ticketQuantity <= 1}>−</button>
              <strong>{ticketQuantity}</strong>
              <button className="btn tiny ghost" type="button" onClick={() => setTicketQuantity((value) => Math.min(20, eventItem.availableSeats, value + 1))} disabled={ticketQuantity >= 20 || ticketQuantity >= eventItem.availableSeats}>+</button>
            </div>
            {ticketQuantity > eventItem.availableSeats && <small className="form-error">Only {eventItem.availableSeats} seat(s) remain. Reduce your ticket quantity.</small>}
          </div>
        )}
        <div className="detail-row">
          <span>Location</span>
          <strong>{[eventItem.venue, eventItem.city].filter(Boolean).join(", ") || "TBA"}</strong>
        </div>
        {eventItem.address && <p>{eventItem.address}</p>}
        {eventItem.mapUrl && (
          <a className="btn ghost" href={eventItem.mapUrl} target="_blank" rel="noreferrer">
            Open Map
          </a>
        )}
        <div className="detail-row">
          <span>Organizer</span>
          <strong>{eventItem.organizerName || "Eventora"}</strong>
        </div>
        {eventItem.organizerContact && <p>{eventItem.organizerContact}</p>}
        <div className="detail-row">
          <span>Rating</span>
          <strong>{eventItem.reviewCount ? `${eventItem.averageRating}/5 (${eventItem.reviewCount})` : "No reviews yet"}</strong>
        </div>
        <div className="detail-actions">
          {!isAdmin && (
            <button className="btn primary" onClick={handleBook} disabled={eventItem.availableSeats === 0 || ticketQuantity > eventItem.availableSeats}>
              Book This Event
            </button>
          )}
          <Link to="/events" className="btn ghost">
            Back to Events
          </Link>
        </div>
      </div>
      <div className="card details-reviews">
        <h3>Reviews</h3>
        {!isAdmin && (
          <form className="modal-form" onSubmit={submitReview}>
            <select value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} stars
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              placeholder="Write a review"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
            />
            <button className="btn primary" type="submit">
              Save Review
            </button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="list-row">
              <div>
                <strong>{review.userName} - {review.rating}/5</strong>
                <p>{review.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default EventDetailsPage;
