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
    return NextResponse.json({ error: "Could not load bookings" }, { status: 500 });
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
    const { tourId, guests, travelDate } = parsed.data;
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session.id,
        tourId,
        guests,
        travelDate,
        totalPrice: calculateBookingPrice(tour.price, guests),
      },
      include: { tour: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
  }
}