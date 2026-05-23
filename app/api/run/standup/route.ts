import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// Groq rejects Composio schemas that contain `pattern` fields with non-standard regex
function stripPatterns(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripPatterns);
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === "pattern") continue;
      out[k] = stripPatterns(v);
    }
    return out;
  }
  return obj;
}

export async function POST(req: Request) {
  try {
    const { entityId = "default" } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }
    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "COMPOSIO_API_KEY not configured" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

    const rawTools = await toolset.getTools({ apps: ["gmail", "googlecalendar", "notion", "slack"] });
    const tools = stripPatterns(rawTools.slice(0, 64)) as typeof rawTools;

    const today = new Date();
    const todayStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const todayISO = today.toISOString().split("T")[0];
    const tomorrowISO = new Date(today.getTime() + 86_400_000).toISOString().split("T")[0];

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are generating a daily standup briefing for ${todayStr}.

Step by step, use the tools to gather real data:
1. Google Calendar: fetch today's events between ${todayISO} and ${tomorrowISO}
2. Gmail: fetch the latest unread emails (up to 5) — focus on anything urgent
3. Notion: search for recent pages or tasks updated in the last 24 hours

Then write the standup in this exact format:

📅 TODAY'S SCHEDULE
[list each event with time and title, or "No events today"]

📬 EMAIL HIGHLIGHTS
[2-3 most important unread emails: sender — subject]

📝 NOTION UPDATES
[recent pages or tasks, or "No recent updates"]

⚡ ACTION ITEMS
[anything that clearly needs attention today based on the above data]

Rules:
- Use only real data from the tools. Never invent anything.
- If a tool returns nothing or fails, write "Nothing found" for that section.
- Keep each section to 3-5 lines max. Be concise and scannable.`,
      },
      {
        role: "user",
        content: "Generate my daily standup briefing now.",
      },
    ];

    for (let step = 0; step < 8; step++) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages, tools: tools as any, tool_choice: "auto", max_tokens: 1024,
      });

      const choice = response.choices[0];

      if (choice.finish_reason !== "tool_calls") {
        return NextResponse.json({ standup: choice.message.content ?? "Standup generated." });
      }

      messages.push(choice.message);

      for (const call of choice.message.tool_calls ?? []) {
        const result = await toolset.executeToolCall(call, entityId);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return NextResponse.json({ standup: "Standup generated (max steps reached)." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Standup failed";
    console.error("Standup error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
