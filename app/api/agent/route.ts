import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the FlowBoard AI assistant. You help users build workflows that connect their apps: Gmail, Outlook Mail, Outlook Calendar, Google Calendar, iCal, Google Drive, Slack, Discord, Notion, and Todoist.

When a user asks how to connect apps or set up a workflow, give clear and friendly guidance:
- Explain which nodes to drag onto the canvas
- Explain how to connect them with arrows
- Give a short example of what will happen when the workflow runs

Be concise and helpful.`;

export async function POST(req: Request) {
  try {
    const { message, entityId = "default" } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "The AI assistant is not configured yet. Add GROQ_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // ── With Composio tools (only if a real key is set) ──────────────────────
    const composioKey = process.env.COMPOSIO_API_KEY;
    if (composioKey && composioKey.length > 20) {
      const { OpenAIToolSet } = await import("composio-core");
      const toolset = new OpenAIToolSet({ apiKey: composioKey });

      const tools = await toolset.getTools({
        apps: ["gmail", "googlecalendar", "slack", "notion"],
      });

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

        const toolCalls = choice.message.tool_calls ?? [];
        for (const call of toolCalls) {
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

    // ── Plain chat (no Composio — fully free) ────────────────────────────────
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
    console.error("Agent error:", err);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
