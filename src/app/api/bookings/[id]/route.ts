import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { bookingStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id } });

      if (!current) {
        return { error: "NOT_FOUND" } as const;
      }

      if (current.status === "CANCELLED" && parsed.data.status !== "CANCELLED") {
        return { error: "ALREADY_CANCELLED" } as const;
      }

      if (current.status === parsed.data.status) {
        const booking = await tx.booking.findUnique({
          where: { id },
          include: { tour: true },
        });
        return { booking } as const;
      }

      const changed = await tx.booking.updateMany({
        where: { id, status: current.status },
        data: { status: parsed.data.status },
      });

      if (changed.count !== 1) {
        return { error: "CONFLICT" } as const;
      }

      if (parsed.data.status === "CANCELLED") {
        await tx.tour.update({
          where: { id: current.tourId },
          data: { availableSeats: { increment: current.guests } },
        });
      }

      const booking = await tx.booking.findUnique({
        where: { id },
        include: { tour: true },
      });

      return { booking } as const;
    });

    if ("error" in result && result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if ("error" in result && result.error === "ALREADY_CANCELLED") {
      return NextResponse.json(
        { error: "A cancelled booking cannot be reactivated" },
        { status: 409 },
      );
    }

    if ("error" in result && result.error === "CONFLICT") {
      return NextResponse.json(
        { error: "Booking status changed; reload and try again" },
        { status: 409 },
      );
    }

    if ("booking" in result) {
      return NextResponse.json(result.booking);
    }

    return NextResponse.json({ error: "Could not update booking" }, { status: 500 });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Could not update booking" },
      { status: 500 },
    );
  }
}