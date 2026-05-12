import Anthropic from "@anthropic-ai/sdk";
import { ComposioToolSet } from "composio-core";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the FlowBoard AI assistant. You help users manage their connected apps: Gmail, Google Calendar, Slack, Notion, and GitHub.
When a user asks you to do something with their apps, use the available tools to take action.
Be concise and tell the user what you did.`;

export async function POST(req: Request) {
  const { message, entityId = "default" } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY || !process.env.COMPOSIO_API_KEY) {
    return NextResponse.json(
      { reply: "Server is missing API keys. Add ANTHROPIC_API_KEY and COMPOSIO_API_KEY to .env.local." },
      { status: 500 }
    );
  }

  const toolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

  const rawTools = await toolset.getToolsSchema({
    apps: ["gmail", "googlecalendar", "slack", "notion", "github"],
  });

  const tools: Anthropic.Tool[] = rawTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object",
      properties: tool.parameters.properties as Record<string, unknown>,
      required: tool.parameters.required,
    },
  }));

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: message }];

  // Agentic loop — runs until Claude stops requesting tool use
  for (let step = 0; step < 10; step++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const text = textBlock?.text;

    if (response.stop_reason !== "tool_use") {
      return NextResponse.json({ reply: text ?? "Done." });
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await toolset.executeAction({
          action: block.name,
          params: block.input as Record<string, unknown>,
          entityId,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({ reply: "Reached maximum steps without a final answer." });
}
