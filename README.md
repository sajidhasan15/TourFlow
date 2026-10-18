# TourFlow

Tour package and booking management app for Bangladesh, built with Next.js, Prisma, PostgreSQL, and Gemini.

## Features

- Register/login with HTTP-only JWT session cookies
- Browse tours and create bookings
- Group pricing: 10% off for 5–9 guests; 15% off for 10–20
- Gemini recommendations with a generated 3-day plan
- Admin tour and booking management
- Unit tests for booking price calculations

## Setup

Requirements: Node.js 20.9+ and PostgreSQL.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Set `DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY` in `.env`
4. Prepare the database:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed