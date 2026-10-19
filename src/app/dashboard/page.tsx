"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Tour = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  durationDays: number;
  category: string;
};

type Booking = {
  id: string;
  guests: number;
  travelDate: string;
  totalPrice: number;
  status: string;
  tour: Tour;
  user?: { id: string; name: string; email: string };
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";

const emptyTourForm = {
  title: "",
  description: "",
  location: "",
  durationDays: "1",
  price: "",
  category: "",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [savingTour, setSavingTour] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyTourForm);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/auth/me");

        if (!meResponse.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const meData = await meResponse.json();
        if (cancelled) return;
        setUser(meData.user);

        const bookingResponse = await fetch("/api/bookings");
        if (!bookingResponse.ok) {
          throw new Error("Could not load bookings");
        }

        const bookingData = (await bookingResponse.json()) as Booking[];
        if (!cancelled) setBookings(bookingData);

        if (meData.user.role === "ADMIN") {
          const tourResponse = await fetch("/api/tours");
          if (!tourResponse.ok) {
            throw new Error("Could not load tours");
          }

          const tourData = (await tourResponse.json()) as Tour[];
          if (!cancelled) setTours(tourData);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load dashboard data. Please refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    setError("");

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not update booking");
      }

      setBookings((items) =>
        items.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update booking");
    }
  }

  async function saveTour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSavingTour(true);

    const id = editingTourId;

    try {
      const response = await fetch(
        id ? `/api/tours/${id}` : "/api/tours",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            durationDays: Number(form.durationDays),
            price: Number(form.price),
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save tour");
      }

      setTours((items) =>
        id
          ? items.map((tour) => (tour.id === id ? data : tour))
          : [data, ...items],
      );

      setEditingTourId(null);
      setForm(emptyTourForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save tour");
    } finally {
      setSavingTour(false);
    }
  }

  function beginEditTour(tour: Tour) {
    setEditingTourId(tour.id);
    setError("");
    setForm({
      title: tour.title,
      description: tour.description,
      location: tour.location,
      durationDays: String(tour.durationDays),
      price: String(tour.price),
      category: tour.category,
    });

    document
      .getElementById("tour-form")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEditTour() {
    setEditingTourId(null);
    setForm(emptyTourForm);
    setError("");
  }

  async function deleteTour(id: string) {
    if (!window.confirm("Delete this tour?")) return;
    setError("");

    try {
      const response = await fetch(`/api/tours/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete tour");
      }

      setTours((items) => items.filter((tour) => tour.id !== id));

      if (editingTourId === id) {
        cancelEditTour();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete tour");
    }
  }

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-loading">Loading your dashboard…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-empty">
          <span className="dashboard-eyebrow">TOURFLOW ACCOUNT</span>
          <h1>Your trips, all in one place.</h1>
          <p>Sign in to view bookings and manage your account.</p>
          <Link className="button" href="/login">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const filteredBookings =
    filter === "ALL"
      ? bookings
      : bookings.filter((booking) => booking.status === filter);

  const pendingCount = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "CONFIRMED",
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "CANCELLED",
  ).length;

  const isAdmin = user.role === "ADMIN";

  return (
    <main className="dashboard-shell">
      <section className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            {isAdmin ? "ADMIN WORKSPACE" : "YOUR TRAVEL SPACE"}
          </span>
          <h1>{isAdmin ? "Welcome back" : `Welcome back, ${user.name}`}</h1>
          <p>
            {isAdmin
              ? "Manage tour inventory and keep bookings moving."
              : "Review your trips and keep your travel plans on track."}
          </p>
        </div>
        <span className="dashboard-role">{user.role}</span>
      </section>

      {error && <p className="dashboard-alert">{error}</p>}

      <section className="dashboard-stats" aria-label="Booking summary">
        <article className="stat-card">
          <span>Total bookings</span>
          <strong>{bookings.length}</strong>
        </article>
        <article className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>
        <article className="stat-card">
          <span>Confirmed</span>
          <strong>{confirmedCount}</strong>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow">
              {isAdmin ? "BOOKING MANAGEMENT" : "YOUR TRIPS"}
            </span>
            <h2>{isAdmin ? "All bookings" : "Your bookings"}</h2>
          </div>
          <span className="dashboard-count">{bookings.length} total</span>
        </div>

        <div
          className="booking-filters"
          role="group"
          aria-label="Filter bookings"
        >
          {(["ALL", "PENDING", "CONFIRMED", "CANCELLED"] as Filter[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={`filter-button ${
                  filter === item ? "filter-active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item === "ALL" ? "All trips" : item.toLowerCase()}
                {item === "CANCELLED" && ` (${cancelledCount})`}
              </button>
            ),
          )}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="dashboard-empty">
            <h3>
              {filter === "ALL"
                ? "No bookings yet"
                : `No ${filter.toLowerCase()} bookings`}
            </h3>
            <p className="muted">
              {filter === "ALL"
                ? "Your next adventure will appear here after you book a tour."
                : "Try another status filter to see your bookings."}
            </p>
            {!isAdmin && (
              <Link className="button" href="/">
                Explore tours
              </Link>
            )}
          </div>
        ) : (
          <div className="booking-list">
            {filteredBookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-top">
                  <div>
                    <span className="booking-location">
                      {booking.tour.location}
                    </span>
                    <h3>{booking.tour.title}</h3>
                  </div>

                  <span
                    className={`status-pill status-${booking.status.toLowerCase()}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <div>
                    <span>Travel date</span>
                    <strong>
                      {new Date(booking.travelDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Travelers</span>
                    <strong>{booking.guests} people</strong>
                  </div>

                  <div>
                    <span>Total price</span>
                    <strong>৳{booking.totalPrice.toLocaleString()}</strong>
                  </div>

                  {isAdmin && booking.user && (
                    <div>
                      <span>Booked by</span>
                      <strong>{booking.user.name}</strong>
                    </div>
                  )}
                </div>

                {isAdmin && booking.status !== "CANCELLED" && (
                  <div className="booking-actions">
                    {booking.status !== "CONFIRMED" && (
                      <button
                        className="button"
                        onClick={() =>
                          updateStatus(booking.id, "CONFIRMED")
                        }
                      >
                        Confirm booking
                      </button>
                    )}
                    <button
                      className="button button-light"
                      onClick={() =>
                        updateStatus(booking.id, "CANCELLED")
                      }
                    >
                      Cancel booking
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="dashboard-section admin-management">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">INVENTORY</span>
              <h2>Manage tours</h2>
            </div>
            <span className="dashboard-count">{tours.length} tours</span>
          </div>

          <div className="admin-dashboard-grid">
            <form
              id="tour-form"
              className="admin-form"
              onSubmit={saveTour}
            >
              <h3>{editingTourId ? "Edit tour" : "Add a tour"}</h3>

              <label className="field-label">
                Tour title
                <input
                  className="input"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </label>

              <label className="field-label">
                Description
                <textarea
                  className="textarea"
                  required
                  minLength={10}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>

              <div className="form-grid">
                <label className="field-label">
                  Location
                  <input
                    className="input"
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </label>

                <label className="field-label">
                  Category
                  <input
                    className="input"
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </label>

                <label className="field-label">
                  Duration (days)
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={form.durationDays}
                    onChange={(e) =>
                      setForm({ ...form, durationDays: e.target.value })
                    }
                  />
                </label>

                <label className="field-label">
                  Price (BDT)
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="tour-row-actions">
                <button className="button" disabled={savingTour}>
                  {savingTour
                    ? "Saving..."
                    : editingTourId
                      ? "Save changes"
                      : "Add tour"}
                </button>

                {editingTourId && (
                  <button
                    type="button"
                    className="button button-light"
                    onClick={cancelEditTour}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div className="admin-tour-list">
              <h3>Current tours</h3>

              {tours.map((tour) => (
                <div className="admin-tour-row" key={tour.id}>
                  <div>
                    <strong>{tour.title}</strong>
                    <span>
                      {tour.location} · ৳{tour.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="tour-row-actions">
                    <button
                      type="button"
                      className="button button-light"
                      onClick={() => beginEditTour(tour)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button button-light"
                      onClick={() => deleteTour(tour.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}