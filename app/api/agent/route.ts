import Anthropic from "@anthropic-ai/sdk";
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { reply: "The AI assistant is not configured yet. Add ANTHROPIC_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ── Try with Composio tools, fall back to plain chat on any error ────────
    const composioKey = process.env.COMPOSIO_API_KEY;
    let tools: Anthropic.Tool[] = [];

    if (composioKey && composioKey.length > 20) {
      try {
        const { OpenAIToolSet } = await import("composio-core");
        const toolset = new OpenAIToolSet({ apiKey: composioKey });
        const rawTools = await toolset.getTools({
          apps: ["gmail", "googlecalendar", "slack", "notion"],
        });
        // Convert OpenAI-style tools to Anthropic format; skip any with invalid schemas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools = (rawTools as any[]).flatMap((t) => {
          try {
            const schema = t.function.parameters;
            if (!schema || schema.type !== "object") return [];
            return [{
              name: t.function.name,
              description: t.function.description ?? "",
              input_schema: schema as Anthropic.Tool["input_schema"],
            }];
          } catch { return []; }
        });
      } catch (e) {
        console.error("Composio tools load error:", e);
        // Continue without tools
      }
    }

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: message },
    ];

    const composioKey2 = process.env.COMPOSIO_API_KEY;
    for (let step = 0; step < 10; step++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        ...(tools.length > 0 ? { tools } : {}),
        messages,
      });

      if (response.stop_reason !== "tool_use") {
        const textBlock = response.content.find((b) => b.type === "text");
        return NextResponse.json({ reply: (textBlock as Anthropic.TextBlock)?.text ?? "Done." });
      }

      messages.push({ role: "assistant", content: response.content });

      if (composioKey2 && composioKey2.length > 20) {
        const { OpenAIToolSet } = await import("composio-core");
        const toolset = new OpenAIToolSet({ apiKey: composioKey2 });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type !== "tool_use") continue;
          const result = await toolset.executeAction({
            action: block.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params: block.input as Record<string, any>,
            entityId,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
        messages.push({ role: "user", content: toolResults });
      }
    }

    return NextResponse.json({ reply: "Reached maximum steps without a final answer." });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Agent error:", msg);
    return NextResponse.json(
      { reply: `Error: ${msg}` },
      { status: 500 }
    );
  }
}
