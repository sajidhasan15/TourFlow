"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  name: string;
  role: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      setChecking(true);

      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = response.ok ? await response.json() : null;

        if (active) setUser(data?.user ?? null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [pathname]);

  async function signOut() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (response.ok) {
        setUser(null);
        router.replace("/");
        router.refresh();
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <nav className="nav-inner">
        <Link className="logo" href="/">TourFlow</Link>

        <div className="nav-links">
          <Link href="/">Explore</Link>
          {/* <Link href="/dashboard">Dashboard</Link> */}

          {checking ? (
            <span className="nav-account">Checking…</span>
          ) : user ? (
            <>
              <Link className="nav-cta" href="/dashboard">
                {user.name} <small>({user.role})</small>
              </Link>
              <button
                className="nav-signout"
                type="button"
                onClick={signOut}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <Link className="nav-cta" href="/login">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}