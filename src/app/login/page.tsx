"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");

        if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
          router.push(returnTo);
        } else {
          router.push("/dashboard");
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <section className="panel" style={{ maxWidth: 480, margin: "30px auto" }}>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">Sign in to manage bookings or create a traveler account.</p>
        <form onSubmit={submit} className="list">
          {mode === "register" && (
            <label className="field-label">Name
              <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="field-label">Email
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field-label">Password
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="button" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}</button>
        </form>
        <p className="muted">
          {mode === "login" ? "New to TourFlow?" : "Already registered?"}{" "}
          <button className="button secondary" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </section>
    </main>
  );
}