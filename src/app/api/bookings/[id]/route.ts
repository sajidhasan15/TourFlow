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
    const existing = await prisma.booking.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { tour: true },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Could not update booking" }, { status: 500 });
  }
}