import { Link } from "react-router-dom";
import SmartImage from "./SmartImage";
import { formatCurrency } from "../utils/format";

function formatEventDate(value) {
  if (!value) return "Date to be announced";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function EventCard({ event, onAddToCart, onToggleFavorite, isFavorite = false, showActions = true }) {
  const location = [event.venue, event.city].filter(Boolean).join(", ");

  return (
    <article className="event-card">
      <div className="event-card-media">
        <SmartImage
          src={event.imageUrl}
          alt={event.name}
          className="event-image"
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
        />
        {event.category && <span className="event-category-badge">{event.category}</span>}
        {onToggleFavorite && (
          <button
            className={`event-favorite-button ${isFavorite ? "active" : ""}`}
            type="button"
            onClick={() => onToggleFavorite(event)}
            aria-label={isFavorite ? `Remove ${event.name} from favorites` : `Add ${event.name} to favorites`}
            aria-pressed={isFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.7 4.7 0 0 1 8.8-2.3 4.7 4.7 0 0 1 8.8 2.3Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="event-content">
        <h3 title={event.name}>{event.name}</h3>
        {event.description && <p className="event-description">{event.description}</p>}

        <div className="event-card-facts">
          <span className="event-card-fact">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3.25" y="4.75" width="13.5" height="12" rx="2" />
              <path d="M6.5 2.75v4M13.5 2.75v4M3.5 8.25h13" />
            </svg>
            {formatEventDate(event.date)}
          </span>
          {location && (
            <span className="event-card-fact" title={location}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M16 8.3c0 4.1-6 8.2-6 8.2S4 12.4 4 8.3a6 6 0 1 1 12 0Z" />
                <circle cx="10" cy="8" r="2" />
              </svg>
              <span className="event-card-location">{location}</span>
            </span>
          )}
        </div>

        <div className="event-card-bottom">
          <div className="event-card-price-rating">
            <strong className="event-card-price">{formatCurrency(event.price)}</strong>
            {event.reviewCount > 0 && (
              <span className="event-card-rating" aria-label={`${event.averageRating} out of 5, ${event.reviewCount} reviews`}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m8 1.5 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.3l-3.8 2 0.7-4.3-3.1-3 4.3-.6L8 1.5Z" />
                </svg>
                {event.averageRating}/5
              </span>
            )}
          </div>
          {(event.capacity != null || event.availableSeats != null) && (
            <span className={`event-card-seats ${event.availableSeats === 0 ? "sold-out" : event.availableSeats <= 20 ? "limited" : ""}`}>
              {event.availableSeats === 0 ? "Sold Out" : event.availableSeats <= 20 ? `Only ${event.availableSeats} left` : `${event.availableSeats}/${event.capacity} seats`}
            </span>
          )}
        </div>

        {showActions && (
          <div className="card-actions">
            <Link className="btn ghost" to={`/events/${event.id}`}>
              View Details
            </Link>
            {onAddToCart && (
              <button
                className="btn primary"
                type="button"
                onClick={() => onAddToCart(event)}
                disabled={event.availableSeats === 0}
              >
                Add to Cart
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default EventCard;
