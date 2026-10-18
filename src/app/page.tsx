"use client";

import { FormEvent, useEffect, useState } from "react";

type Tour = {
  id: string;
  title: string;
  description: string;
  location: string;
  durationDays: number;
  price: number;
  category: string;
};

type Recommendation = {
  recommendations: Tour[];
  plan?: string;
  message?: string;
};

export default function HomePage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [preferences, setPreferences] = useState({
    interests: "",
    budget: "12000",
    durationDays: "3",
    preferredLocation: "",
  });
  const [result, setResult] = useState<Recommendation | null>(null);
  const [bookingTour, setBookingTour] = useState<Tour | null>(null);
  const [additionalGuests, setAdditionalGuests] = useState("1");
  const [travelDate, setTravelDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/tours")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load tours");
        setTours(await response.json());
      })
      .catch(() => setError("Could not load tours. Refresh to try again."));
  }, []);

  async function recommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preferences,
          budget: Number(preferences.budget),
          durationDays: Number(preferences.durationDays),
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

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingTour) return;

    setError("");

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
      if (!response.ok) {
        throw new Error(data.error ?? "Could not book this tour");
      }

      setBookingTour(null);
      setError("Booking created! View its status on your dashboard.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const recommendedIds = new Set(
    result?.recommendations.map((tour) => tour.id),
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
        <h2>Get a trip recommendation</h2>
        <p className="muted">
          Tell us what you enjoy and your per-person budget in BDT.
        </p>

        <form onSubmit={recommend}>
          <div className="form-grid">
            <label className="field-label">
              Interests
              <input
                className="input"
                required
                value={preferences.interests}
                placeholder="Tea gardens, beaches, food..."
                onChange={(e) =>
                  setPreferences({ ...preferences, interests: e.target.value })
                }
              />
            </label>

            <label className="field-label">
              Preferred location (optional)
              <input
                className="input"
                value={preferences.preferredLocation}
                placeholder="Sylhet"
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferredLocation: e.target.value,
                  })
                }
              />
            </label>

            <label className="field-label">
              Budget per person (BDT)
              <input
                className="input"
                type="number"
                min="1"
                required
                value={preferences.budget}
                onChange={(e) =>
                  setPreferences({ ...preferences, budget: e.target.value })
                }
              />
            </label>

            <label className="field-label">
              Maximum trip length (days)
              <input
                className="input"
                type="number"
                min="1"
                max="14"
                required
                value={preferences.durationDays}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    durationDays: e.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="button" disabled={busy}>
              {busy ? "Planning..." : "Recommend a trip"}
            </button>
          </div>
        </form>

        {result?.message && <p className="notice">{result.message}</p>}

        {result?.recommendations.length ? (
          <div className="section">
            <h3>Recommended for you</h3>
            <p>
              {result.recommendations.map((tour) => tour.title).join(" · ")}
            </p>
            {result.plan && <div className="panel plan">{result.plan}</div>}
          </div>
        ) : null}
      </section>

      {error && <p className="notice">{error}</p>}

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

              <div className="price-row">
                <strong>৳{tour.price.toLocaleString()} / person</strong>
                <button
                  className="button"
                  onClick={() => setBookingTour(tour)}
                >
                  Book
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
                max="19"
                required
                value={additionalGuests}
                onChange={(e) => setAdditionalGuests(e.target.value)}
              />
              <span className="muted">
                Total travelers including you:{" "}
                {1 + (Number(additionalGuests) || 0)}
              </span>
            </label>

            <p className="muted">
              Sign in first if the booking request is rejected.
            </p>

            <div className="form-actions">
              <button className="button">Confirm booking</button>
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
    </main>
  );
}