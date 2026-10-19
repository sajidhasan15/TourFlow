import type { Metadata } from "next";
import Navbar from "./Navbar";
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}