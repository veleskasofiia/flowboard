import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the FlowBoard AI assistant. FlowBoard is a visual workflow builder.

THE EXACT UI THE USER SEES:
- Left panel has two sections: "Triggers" and "Actions"
- Triggers: "Webhook" (⚡) and "Schedule" (⏰)
- Actions: Gmail, Outlook Mail, Outlook Calendar, Google Calendar, iCal, Google Drive, Slack, Discord, Notion, Todoist, and "IF Condition" (🔀)
- The main area is a canvas where users drag nodes and connect them with arrows
- On the right side there is this AI chat panel

HOW TO BUILD A WORKFLOW (always give these exact steps):
1. Drag a Trigger node (Webhook or Schedule) from the left panel onto the canvas
2. Drag one or more Action nodes (apps) from the left panel onto the canvas
3. Connect them by clicking and dragging from the right side of one node to the left side of the next
4. To add a condition: drag "IF Condition" from the Actions section, connect your trigger to it, then connect two app nodes to it — one for the true path, one for the false path

RULES:
- Always refer to "left panel" not "sidebar" or "palette"
- The IF Condition node is in the Actions section of the left panel, labeled "IF Condition"
- Never mention features that don't exist in the UI (no node configuration popups, no settings panels)
- Keep answers short — 3 to 5 lines maximum
- Be friendly and specific`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "The AI assistant is not configured. Add GROQ_API_KEY to your Vercel environment variables." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      max_tokens: 1024,
    });

    return NextResponse.json({
      reply: response.choices[0].message.content ?? "Sorry, I couldn't generate a reply.",
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Agent error:", msg);
    return NextResponse.json({ reply: `Error: ${msg}` }, { status: 500 });
  }
}
