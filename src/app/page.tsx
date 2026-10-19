"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tour = {
  id: string;
  title: string;
  description: string;
  location: string;
  durationDays: number;
  price: number;
  category: string;
  availableSeats?: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Recommendation = {
  recommendations: Tour[];
  plan?: string;
  message?: string;
};

type BookingFeedback = {
  type: "success" | "error";
  message: string;
};

const TRIP_VIBES = [
  { label: "🌊 Sea & beaches", value: "Sea and beaches" },
  { label: "⛰️ Hills & trekking", value: "Hills and trekking" },
  { label: "🍃 Tea gardens & nature", value: "Tea gardens and nature" },
  { label: "🛶 Rivers, haor & boat stays", value: "Rivers, haor and boat stays" },
  { label: "🏛️ History & heritage", value: "History and heritage" },
  { label: "🏨 Relaxing resort stay", value: "Relaxing resort stay" },
  { label: "🍲 Local food & culture", value: "Local food and culture" },
];

export default function HomePage() {
  const router = useRouter();

  const [tours, setTours] = useState<Tour[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    interests: "",
    budget: "12000",
    durationDays: "3",
    preferredLocation: "",
    travelCompanion: "solo",
    startingFrom: "Dhaka",
    travelPace: "standard",
  });

  const [result, setResult] = useState<Recommendation | null>(null);
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [additionalGuests, setAdditionalGuests] = useState("1");
  const [travelDate, setTravelDate] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [feedback, setFeedback] = useState<BookingFeedback | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const [tourResponse, meResponse] = await Promise.all([
          fetch("/api/tours"),
          fetch("/api/auth/me"),
        ]);

        if (!tourResponse.ok) {
          throw new Error("Could not load tours");
        }

        const loadedTours = (await tourResponse.json()) as Tour[];
        const meData = meResponse.ok ? await meResponse.json() : null;

        if (cancelled) return;

        setTours(loadedTours);
        setUser(meData?.user ?? null);

        // Sign-in শেষে return করলে আগের tour-এর booking modal আবার খুলবে।
        const params = new URLSearchParams(window.location.search);
        const tourId = params.get("bookTour");
        const selectedTour = loadedTours.find((tour) => tour.id === tourId);

        if (selectedTour) {
          setBookingTour(selectedTour);
          setTravelDate(params.get("travelDate") ?? "");
          setAdditionalGuests(params.get("additionalGuests") ?? "1");
        }
      } catch {
        if (!cancelled) {
          setError("Could not load tours. Refresh to try again.");
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleVibe(value: string) {
    setSelectedVibes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function recommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const interests = [...selectedVibes, preferences.interests.trim()]
      .filter(Boolean)
      .join(", ");

    if (!interests) {
      setError("Choose at least one trip vibe or describe what you enjoy.");
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          budget: Number(preferences.budget),
          durationDays: Number(preferences.durationDays),
          preferredLocation: preferences.preferredLocation,
          travelCompanion: preferences.travelCompanion,
          startingFrom: preferences.startingFrom,
          travelPace: preferences.travelPace,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not recommend a trip");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function goToSignIn() {
    if (!bookingTour) return;

    const returnTo =
      `/?bookTour=${encodeURIComponent(bookingTour.id)}` +
      `&travelDate=${encodeURIComponent(travelDate)}` +
      `&additionalGuests=${encodeURIComponent(additionalGuests)}`;

    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError("");

    if (!user) {
      setBookingError("Please sign in before completing this booking.");
      return;
    }

    if (!bookingTour) return;

    setBookingBusy(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: bookingTour.id,
          additionalGuests: Number(additionalGuests),
          travelDate,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setUser(null);
        setBookingError("Your session has expired. Sign in to continue.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Could not book this tour");
      }

      setBookingTour(null);
      setFeedback({
        type: "success",
        message:
          "Your booking was created. You can check its status on your dashboard.",
      });

      // Seat count সঙ্গে সঙ্গে refresh করো।
      const toursResponse = await fetch("/api/tours");
      if (toursResponse.ok) {
        setTours((await toursResponse.json()) as Tour[]);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setBookingBusy(false);
    }
  }

  const recommendedIds = new Set(
    result?.recommendations.map((tour) => tour.id) ?? [],
  );

  return (
    <main className="container">
      <section className="hero">
        <p>YOUR NEXT ADVENTURE STARTS HERE</p>
        <h1>Find a trip that feels like yours.</h1>
        <p>
          Explore local tours, get a Gemini-powered itinerary, and book in a
          few clicks.
        </p>
      </section>

      <section className="section panel">
        <p className="form-eyebrow">YOUR PERSONAL TRIP PLANNER</p>
        <h2>Plan your perfect getaway</h2>
        <p className="muted">
          Share your travel style, duration and estimated budget—we’ll find
          tours that fit and create a personalized itinerary.
        </p>

        <form onSubmit={recommend}>
          <div className="form-grid">
            <div className="field-label field-full">
              What kind of vibe or activities are you looking for?

              <div className="chip-list">
                {TRIP_VIBES.map((vibe) => {
                  const selected = selectedVibes.includes(vibe.value);

                  return (
                    <button
                      key={vibe.value}
                      type="button"
                      className={`chip ${selected ? "chip-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => toggleVibe(vibe.value)}
                    >
                      {vibe.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                className="textarea"
                maxLength={120}
                value={preferences.interests}
                placeholder="Or add your own: quiet mornings, photography, local food..."
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    interests: e.target.value,
                  })
                }
              />

              <span className="form-helper">
                Pick any that fit, then add a detail if you like.
              </span>
            </div>

            <label className="field-label">
              Any destination in mind? <span className="muted">Optional</span>
              <input
                className="input"
                value={preferences.preferredLocation}
                placeholder="e.g., Sylhet, Cox’s Bazar, Bandarban"
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferredLocation: e.target.value,
                  })
                }
              />
              <span className="form-helper">
                Leave blank if you’re open to surprises.
              </span>
            </label>

            <label className="field-label">
              Estimated budget per person (BDT)
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                required
                value={preferences.budget}
                placeholder="e.g., 12,000"
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    budget: e.target.value,
                  })
                }
              />
              <span className="form-helper">
                Set your approximate maximum budget.
              </span>
            </label>

            <label className="field-label">
              How many days do you have?
              <input
                className="input"
                type="number"
                min="1"
                max="14"
                required
                value={preferences.durationDays}
                placeholder="e.g., 3"
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    durationDays: e.target.value,
                  })
                }
              />
            </label>

            <label className="field-label">
              Who are you traveling with?
              <select
                className="select"
                value={preferences.travelCompanion}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    travelCompanion: e.target.value,
                  })
                }
              >
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family with kids</option>
                <option value="friends">Friends group</option>
              </select>
            </label>

            <label className="field-label">
              Where will you start from?
              <select
                className="select"
                value={preferences.startingFrom}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    startingFrom: e.target.value,
                  })
                }
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Other">Somewhere else</option>
              </select>
            </label>

            <label className="field-label">
              What travel pace feels right?
              <select
                className="select"
                value={preferences.travelPace}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    travelPace: e.target.value,
                  })
                }
              >
                <option value="budget">Budget / backpacking</option>
                <option value="standard">Comfortable / standard</option>
                <option value="luxury">Luxury / relaxed</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button className="button" disabled={busy}>
              {busy ? "Creating your plan..." : "Generate my trip plan ✨"}
            </button>
          </div>
        </form>

        {result?.message && <p className="notice">{result.message}</p>}

        {result?.recommendations.length ? (
          <div className="section">
            <h3>Your best matches</h3>
            <p>
              {result.recommendations.map((tour) => tour.title).join(" · ")}
            </p>
            {result.plan && <div className="panel plan">{result.plan}</div>}
          </div>
        ) : null}
      </section>

      {error && <p className="notice notice-error">{error}</p>}

      <section className="section">
        <h2>Explore tours</h2>
        <div className="grid">
          {tours.map((tour) => (
            <article className="card" key={tour.id}>
              <div className="card-art">
                {tour.category} · {tour.location}
              </div>

              {recommendedIds.has(tour.id) && (
                <span className="badge">Recommended</span>
              )}

              <h3>{tour.title}</h3>
              <p className="muted">{tour.description}</p>
              <p className="muted">
                {tour.durationDays} day{tour.durationDays === 1 ? "" : "s"}
              </p>

              {typeof tour.availableSeats === "number" && (
                <p className="muted">
                  {tour.availableSeats > 0
                    ? `${tour.availableSeats} seats available`
                    : "Sold out"}
                </p>
              )}

              <div className="price-row">
                <strong>৳{tour.price.toLocaleString()} / person</strong>
                <button
                  className="button"
                  type="button"
                  disabled={tour.availableSeats === 0}
                  onClick={() => {
                    setBookingError("");
                    setBookingTour(tour);
                  }}
                >
                  {tour.availableSeats === 0 ? "Sold out" : "Book"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {bookingTour && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={book}>
            <h2>Book {bookingTour.title}</h2>

            {!authChecked ? (
              <p className="notice">Checking your sign-in status...</p>
            ) : !user ? (
              <p className="notice notice-error" role="alert">
                You need to sign in before you can book this tour.
              </p>
            ) : null}

            <label className="field-label">
              Travel date
              <input
                className="input"
                type="date"
                required
                value={travelDate}
                min={new Date(Date.now() + 86400000)
                  .toISOString()
                  .slice(0, 10)}
                onChange={(e) => setTravelDate(e.target.value)}
              />
            </label>

            <label className="field-label">
              Additional guests (you are included separately)
              <input
                className="input"
                type="number"
                min="0"
                max={Math.max(
                  0,
                  Math.min(19, (bookingTour.availableSeats ?? 20) - 1),
                )}
                required
                value={additionalGuests}
                onChange={(e) => setAdditionalGuests(e.target.value)}
              />
              <span className="muted">
                Total travelers including you:{" "}
                {1 + (Number(additionalGuests) || 0)}
              </span>
            </label>

            {bookingError && (
              <p className="notice notice-error" role="alert">
                {bookingError}
              </p>
            )}

            <div className="form-actions">
              {authChecked && !user ? (
                <button
                  type="button"
                  className="button"
                  onClick={goToSignIn}
                >
                  Sign in to book
                </button>
              ) : (
                <button
                  className="button"
                  disabled={!authChecked || bookingBusy}
                >
                  {bookingBusy ? "Booking..." : "Confirm booking"}
                </button>
              )}

              <button
                type="button"
                className="button secondary"
                onClick={() => setBookingTour(null)}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {feedback && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="alertdialog"
            aria-labelledby="booking-feedback-title"
          >
            <h2 id="booking-feedback-title">
              {feedback.type === "success"
                ? "Booking successful"
                : "Booking error"}
            </h2>

            <p
              className={`notice ${
                feedback.type === "success"
                  ? "notice-success"
                  : "notice-error"
              }`}
            >
              {feedback.message}
            </p>

            <button className="button" onClick={() => setFeedback(null)}>
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}