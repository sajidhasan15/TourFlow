import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Could not check session" }, { status: 500 });
  }
}