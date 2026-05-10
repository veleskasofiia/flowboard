import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.composio.dev/notion/pages", {
      headers: { Authorization: `Bearer ${process.env.COMPOSIO_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ pages: data.count });
  } catch (error) {
    console.error("Notion API error:", error);
    return NextResponse.json({ pages: 0 }, { status: 500 });
  }
}
