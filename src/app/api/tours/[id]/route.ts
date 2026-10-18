import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { tourUpdateSchema } from "@/lib/validations";

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

  const parsed = tourUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tour data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const existing = await prisma.tour.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    if (parsed.data.title) {
      const duplicate = await prisma.tour.findFirst({
        where: { title: parsed.data.title, id: { not: id } },
      });

      if (duplicate) {
        return NextResponse.json({ error: "A tour with that title already exists" }, { status: 409 });
      }
    }

    const tour = await prisma.tour.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Update tour error:", error);
    return NextResponse.json({ error: "Could not update tour" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.tour.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    await prisma.tour.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete tour error:", error);
    return NextResponse.json({ error: "Could not delete tour" }, { status: 500 });
  }
}