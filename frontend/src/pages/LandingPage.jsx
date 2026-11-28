import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import SkeletonGrid from "../components/SkeletonGrid";
import SmartImage from "../components/SmartImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { asArray } from "../utils/apiData";
import { formatCurrency, formatDate } from "../utils/format";

function LandingPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const { addToCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(asArray(res.data));
      } catch {
        toast.error("Unable to load featured events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let active = true;
    const refreshAvailability = async () => {
      try {
        const res = await api.get("/events");
        if (active) setEvents(asArray(res.data));
      } catch {
        // Preserve the currently rendered homepage events if a background refresh fails.
      }
    };
    const timer = window.setInterval(refreshAvailability, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(events.map((eventItem) => eventItem.category).filter(Boolean))).sort(),
    [events]
  );

  const matchingEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((eventItem) => {
      const matchesCategory = !category || eventItem.category === category;
      const searchableText = [
        eventItem.name,
        eventItem.category,
        eventItem.city,
        eventItem.venue,
        eventItem.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [category, events, search]);

  const featuredEvents = matchingEvents.slice(0, 3);
  const featuredIds = new Set(featuredEvents.map((eventItem) => eventItem.id));
  const upcomingEvents = matchingEvents
    .filter((eventItem) => {
      const isUpcoming = !eventItem.date || new Date(eventItem.date).getTime() >= Date.now();
      return isUpcoming && !featuredIds.has(eventItem.id);
    })
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .slice(0, 4);
  const spotlightEvent = events.find(
    (eventItem) => !eventItem.date || new Date(eventItem.date).getTime() >= Date.now()
  ) || events[0];

  const handleAddToCart = (eventItem) => {
    if (!isAuthenticated) {
      toast.info("Login to add events to cart");
      return;
    }
    const added = addToCart(eventItem);
    if (added) toast.success("Event added to cart");
    else toast.info("Event already in cart");
  };

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">
            <span className="landing-eyebrow-dot" aria-hidden="true" />
            Make plans worth remembering
          </span>
          <h1>
            Find your next
            <br />
            <span>great experience.</span>
          </h1>
          <p>
            From live music to new ideas, discover events happening around you and book your next
            favorite day out.
          </p>

          <form
            className="landing-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("home-events")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.2 4.2" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events, cities, or venues"
              aria-label="Search events, cities, or venues"
            />
            <button type="submit">Find events</button>
          </form>

          <div className="landing-hero-links">
            <Link className="landing-text-link" to="/events">
              Explore all events <span aria-hidden="true">→</span>
            </Link>
            <span className="landing-hero-separator" aria-hidden="true" />
            <Link className="landing-text-link muted" to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "My bookings" : "Join Eventora"}
            </Link>
          </div>
        </div>

        <div className="landing-spotlight">
          {spotlightEvent ? (
            <>
              <SmartImage
                className="landing-spotlight-image"
                src={spotlightEvent.imageUrl}
                alt={spotlightEvent.name}
                width={960}
                height={1100}
                decoding="async"
              />
              <div className="landing-spotlight-shade" />
              <div className="landing-spotlight-badge">
                <span className="landing-live-dot" aria-hidden="true" />
                Discover something new
              </div>
              <div className="landing-spotlight-content">
                <span>{spotlightEvent.category || "Featured event"}</span>
                <h2>{spotlightEvent.name}</h2>
                <p>
                  {spotlightEvent.city || spotlightEvent.venue || "Location to be announced"}
                  {spotlightEvent.date ? ` · ${formatDate(spotlightEvent.date)}` : ""}
                </p>
                <div className="landing-spotlight-bottom">
                  <strong>{formatCurrency(spotlightEvent.price)}</strong>
                  <Link to={`/events/${spotlightEvent.id}`} aria-label={`View ${spotlightEvent.name}`}>
                    View event <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="landing-spotlight-empty">
              <span className="landing-spotlight-orbit" aria-hidden="true" />
              <p>Your next great experience is waiting.</p>
            </div>
          )}
        </div>
      </section>

      <section className="landing-categories" aria-labelledby="categories-title">
        <div className="landing-section-heading compact">
          <div>
            <span className="landing-section-kicker">Explore your interests</span>
            <h2 id="categories-title">Find your kind of event</h2>
          </div>
          <Link className="landing-text-link" to="/events">
            Browse all <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="landing-category-list" aria-label="Filter by event category">
          <button
            className={`landing-category ${category === "" ? "active" : ""}`}
            type="button"
            onClick={() => setCategory("")}
            aria-pressed={category === ""}
          >
            <span className="landing-category-icon all" aria-hidden="true">✦</span>
            <span>All events</span>
          </button>
          {categories.map((categoryName) => (
            <button
              className={`landing-category ${category === categoryName ? "active" : ""}`}
              type="button"
              key={categoryName}
              onClick={() => setCategory(category === categoryName ? "" : categoryName)}
              aria-pressed={category === categoryName}
            >
              <span className="landing-category-icon" aria-hidden="true">
                {categoryName.slice(0, 1).toUpperCase()}
              </span>
              <span>{categoryName}</span>
            </button>
          ))}
          {!loading && categories.length === 0 && (
            <p className="landing-category-empty">Event categories will appear here as events are added.</p>
          )}
        </div>
      </section>

      <section className="landing-events" id="home-events" aria-labelledby="featured-title">
        <div className="landing-section-heading">
          <div>
            <span className="landing-section-kicker">Handpicked for you</span>
            <h2 id="featured-title">{search || category ? "Events you might love" : "Featured events"}</h2>
            <p>Good plans start with one great event.</p>
          </div>
          <Link className="landing-outline-link" to="/events">
            View all events <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={3} />
        ) : featuredEvents.length === 0 ? (
          <EmptyState
            title={search || category ? "No matching events" : "No events available yet"}
            message={
              search || category
                ? "Try another search or choose a different category."
                : "New events will appear here as soon as they are published."
            }
            action={
              search || category ? (
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                  }}
                >
                  Clear search
                </button>
              ) : null
            }
          />
        ) : (
          <div className="event-grid landing-event-grid">
            {featuredEvents.map((eventItem) => (
              <EventCard
                key={eventItem.id}
                event={eventItem}
                onAddToCart={isAdmin ? null : handleAddToCart}
                showActions
              />
            ))}
          </div>
        )}
      </section>

      {!loading && upcomingEvents.length > 0 && (
        <section className="landing-upcoming" aria-labelledby="upcoming-title">
          <div className="landing-upcoming-intro">
            <span className="landing-section-kicker">Coming up</span>
            <h2 id="upcoming-title">Make a date with something new.</h2>
            <p>There’s always something happening. Find your next reason to get out there.</p>
            <Link className="landing-text-link" to="/events">
              Discover more events <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="landing-upcoming-list">
            {upcomingEvents.map((eventItem) => (
              <Link className="landing-upcoming-row" to={`/events/${eventItem.id}`} key={eventItem.id}>
                <div className="landing-upcoming-date">
                  <span>{eventItem.date ? new Date(eventItem.date).toLocaleString("en-IN", { month: "short" }) : "TBA"}</span>
                  <strong>{eventItem.date ? new Date(eventItem.date).getDate() : "—"}</strong>
                </div>
                <div className="landing-upcoming-info">
                  <span>{eventItem.category || "Event"}</span>
                  <strong>{eventItem.name}</strong>
                  <small>{eventItem.city || eventItem.venue || "Location to be announced"}</small>
                </div>
                <span className="landing-upcoming-price">{formatCurrency(eventItem.price)}</span>
                <span className="landing-upcoming-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default LandingPage;
