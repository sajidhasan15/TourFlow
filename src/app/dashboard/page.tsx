"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tour = {
  id: string;
  title: string;
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
  user?: { name: string; email: string };
};

type User = { id: string; name: string; email: string; role: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", location: "", durationDays: "1", price: "", category: "",
  });

  useEffect(() => {
    async function load() {
      const meResponse = await fetch("/api/auth/me");
      if (!meResponse.ok) return;
      const meData = await meResponse.json();
      setUser(meData.user);

      const bookingResponse = await fetch("/api/bookings");
      if (bookingResponse.ok) setBookings(await bookingResponse.json());

      if (meData.user.role === "ADMIN") {
        const tourResponse = await fetch("/api/tours");
        if (tourResponse.ok) setTours(await tourResponse.json());
      }
    }
    load().catch(() => setError("Could not load dashboard data"));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return setError("Could not update booking");
    setBookings((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  async function createTour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
      }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Could not create tour");
    setTours((items) => [data, ...items]);
    setForm({ title: "", description: "", location: "", durationDays: "1", price: "", category: "" });
    setError("");
  }

  async function deleteTour(id: string) {
    if (!window.confirm("Delete this tour?")) return;
    const response = await fetch(`/api/tours/${id}`, { method: "DELETE" });
    if (!response.ok) return setError("Could not delete tour");
    setTours((items) => items.filter((tour) => tour.id !== id));
  }

  if (!user) {
    return (
      <main className="container">
        <section className="panel">
          <h1>Dashboard</h1>
          <p className="muted">Sign in to view your bookings and account.</p>
          <a className="button" href="/login">Go to sign in</a>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="price-row">
        <div><p className="muted">SIGNED IN AS</p><h1>{user.name}</h1><span className="badge">{user.role}</span></div>
        <button className="button secondary" onClick={logout}>Sign out</button>
      </div>

      {error && <p className="notice">{error}</p>}

      <section className="section">
        <h2>{user.role === "ADMIN" ? "All bookings" : "Your bookings"}</h2>
        {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
        <div className="list">
          {bookings.map((booking) => (
            <article className="list-row" key={booking.id}>
              <div>
                <strong>{booking.tour.title}</strong>
                <p className="muted">
                  {booking.user?.name ? `${booking.user.name} · ` : ""}
                  {new Date(booking.travelDate).toLocaleDateString()} · {booking.guests} guest(s) · ৳{booking.totalPrice.toLocaleString()}
                </p>
                <span className="badge">{booking.status}</span>
              </div>
              {user.role === "ADMIN" && (
                <div className="form-actions">
                  <button className="button" onClick={() => updateStatus(booking.id, "CONFIRMED")}>Confirm</button>
                  <button className="button secondary" onClick={() => updateStatus(booking.id, "CANCELLED")}>Cancel</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {user.role === "ADMIN" && (
        <section className="section admin-grid">
          <form className="panel" onSubmit={createTour}>
            <h2>Add a tour</h2>
            <div className="list">
              <input className="input" required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="textarea" required minLength={10} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="input" required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input className="input" required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <div className="form-grid">
                <input className="input" type="number" min="1" max="30" required aria-label="Duration in days" placeholder="Days" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
                <input className="input" type="number" min="1" required aria-label="Price in BDT" placeholder="Price (BDT)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <button className="button">Add tour</button>
            </div>
          </form>

          <div className="panel">
            <h2>Manage tours</h2>
            <div className="list">
              {tours.map((tour) => (
                <div className="list-row" key={tour.id}>
                  <div><strong>{tour.title}</strong><p className="muted">{tour.location} · ৳{tour.price.toLocaleString()}</p></div>
                  <button className="button secondary" onClick={() => deleteTour(tour.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}