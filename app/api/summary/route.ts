import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { entityId } = await req.json();

    if (!entityId || entityId === "default") {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }
    if (!process.env.GROQ_API_KEY || !process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const tools = await toolset.getTools({
      apps: ["googlecalendar", "gmail", "outlook", "googledrive", "slack", "notion", "todoist"],
    });

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are fetching a weekly dashboard summary.
Today: ${today.toDateString()} (${today.toLocaleDateString("en-US", { weekday: "long" })}).
This week: ${monday.toDateString()} to ${sunday.toDateString()}.

Step 1 — fetch calendar events:
  - If Google Calendar is connected: list events from ${monday.toISOString()} to ${sunday.toISOString()}
  - If Outlook is connected: list calendar events for this week

Step 2 — fetch email counts:
  - If Gmail is connected: list unread emails (query: "is:unread")
  - If Outlook is connected: list unread emails

Step 3 — after you have the real data, respond with ONLY valid JSON, no extra text:
{
  "meetings_count": <integer, total this week across all calendars>,
  "meetings": [
    {"title": "...", "start": "YYYY-MM-DDTHH:MM", "source": "google" | "outlook"}
  ],
  "next_meeting": {"title": "...", "start": "YYYY-MM-DDTHH:MM", "source": "..."} | null,
  "gmail_unread": <integer> | null,
  "outlook_unread": <integer> | null,
  "connected": ["googlecalendar", "gmail", ...]
}

Sort meetings by start time. Only include events from this week.
If an app is not connected or returns an error, omit it from "connected" and set its field to null.`,
      },
      { role: "user", content: "Fetch my weekly summary." },
    ];

    for (let step = 0; step < 12; step++) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages, tools: tools as any, tool_choice: "auto", max_tokens: 2048,
      });

      const choice = response.choices[0];

      if (choice.finish_reason !== "tool_calls") {
        const text = (choice.message.content ?? "").trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return NextResponse.json({ error: "parse_failed", raw: text });
        try {
          return NextResponse.json(JSON.parse(match[0]));
        } catch {
          return NextResponse.json({ error: "parse_failed", raw: text });
        }
      }

      messages.push(choice.message);
      for (const call of choice.message.tool_calls ?? []) {
        const result = await toolset.executeToolCall(call, entityId);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return NextResponse.json({ error: "timeout" });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
