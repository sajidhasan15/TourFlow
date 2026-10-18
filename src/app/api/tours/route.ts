import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { tourSchema } from "@/lib/validations";

export async function GET() {
  try {
    const tours = await prisma.tour.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tours);
  } catch (error) {
    console.error("Get tours error:", error);
    return NextResponse.json({ error: "Could not load tours" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  const parsed = tourSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tour data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.tour.findUnique({
      where: { title: parsed.data.title },
    });

    if (existing) {
      return NextResponse.json({ error: "A tour with that title already exists" }, { status: 409 });
    }

    const tour = await prisma.tour.create({ data: parsed.data });
    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error("Create tour error:", error);
    return NextResponse.json({ error: "Could not create tour" }, { status: 500 });
  }
}