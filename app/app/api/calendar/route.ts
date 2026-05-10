import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.composio.dev/calendar/today", {
      headers: { Authorization: `Bearer ${process.env.COMPOSIO_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ meetingsToday: data.count });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json({ meetingsToday: 0 }, { status: 500 });
  }
}
