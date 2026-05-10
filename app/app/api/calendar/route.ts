import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.composio.dev/slack/unread", {
      headers: { Authorization: `Bearer ${process.env.COMPOSIO_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json({ unreadMessages: data.count });
  } catch (error) {
    console.error("Slack API error:", error);
    return NextResponse.json({ unreadMessages: 0 }, { status: 500 });
  }
}
