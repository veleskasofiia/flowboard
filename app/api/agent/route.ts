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
    const { message, entityId = "default" } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "The AI assistant is not configured. Add GROQ_API_KEY to your Vercel environment variables." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // ── With Composio tools ──────────────────────────────────────────────────
    const composioKey = process.env.COMPOSIO_API_KEY;
    if (composioKey && composioKey.length > 20) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tools: any[] = [];
      try {
        const { OpenAIToolSet } = await import("composio-core");
        const toolset = new OpenAIToolSet({ apiKey: composioKey });
        const rawTools = await toolset.getTools({
          apps: ["gmail", "googlecalendar", "slack", "notion"],
        });
        // Groq allows max 128 tools — take the first 128
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools = (rawTools as any[]).slice(0, 128);
      } catch (e) {
        console.error("Composio tools load error:", e);
      }

      if (tools.length > 0) {
        const { OpenAIToolSet } = await import("composio-core");
        const toolset = new OpenAIToolSet({ apiKey: composioKey });

        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ];

        for (let step = 0; step < 10; step++) {
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tools: tools as any,
            tool_choice: "auto",
            max_tokens: 4096,
          });

          const choice = response.choices[0];
          if (choice.finish_reason !== "tool_calls") {
            return NextResponse.json({ reply: choice.message.content ?? "Done." });
          }

          messages.push(choice.message);
          for (const call of choice.message.tool_calls ?? []) {
            const result = await toolset.executeToolCall(call, entityId);
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          }
        }
        return NextResponse.json({ reply: "Reached maximum steps without a final answer." });
      }
    }

    // ── Plain chat (no tools) ────────────────────────────────────────────────
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
