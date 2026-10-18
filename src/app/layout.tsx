import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TourFlow",
  description: "Find and book your next Bangladesh trip.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="nav-inner">
            <Link className="logo" href="/">TourFlow</Link>
            <div className="nav-links">
              <Link href="/">Explore</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link className="nav-cta" href="/login">Sign in</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}