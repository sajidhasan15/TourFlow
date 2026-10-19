import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { bookingSchema } from "@/lib/validations";
import { calculateBookingPrice } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: session.role === "ADMIN" ? {} : { userId: session.id },
      include: {
        tour: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Could not load bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { tourId, additionalGuests, travelDate } = parsed.data;
    const totalTravelers = additionalGuests + 1;

    const result = await prisma.$transaction(async (tx) => {
      const tour = await tx.tour.findUnique({ where: { id: tourId } });

      if (!tour) {
        return { error: "NOT_FOUND" } as const;
      }

      const reserved = await tx.tour.updateMany({
        where: {
          id: tourId,
          availableSeats: { gte: totalTravelers },
        },
        data: {
          availableSeats: { decrement: totalTravelers },
        },
      });

      if (reserved.count !== 1) {
        return { error: "NO_SEATS" } as const;
      }

      const booking = await tx.booking.create({
        data: {
          userId: session.id,
          tourId,
          guests: totalTravelers,
          travelDate,
          totalPrice: calculateBookingPrice(tour.price, totalTravelers),
        },
        include: { tour: true },
      });

      return { booking } as const;
    });

    if ("error" in result && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    if ("error" in result && result.error === "NO_SEATS") {
      return NextResponse.json(
        { error: "Not enough seats available" },
        { status: 409 },
      );
    }

    if ("booking" in result) {
      return NextResponse.json(result.booking, { status: 201 });
    }

    return NextResponse.json(
      { error: "Could not create booking" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Could not create booking" },
      { status: 500 },
    );
  }
}