import Groq from "groq-sdk";
import { NextResponse } from "next/server";

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
    const { nodes, result, entityId = "default" } = await req.json();

    if (!process.env.GROQ_API_KEY || !process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "Missing API keys" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

    const rawTools = await toolset.getTools({ apps: ["notion"] });
    const tools = stripPatterns(rawTools.slice(0, 40)) as typeof rawTools;

    const nodeList = (nodes as { label: string }[]).map((n) => `• ${n.label}`).join("\n");
    const date = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const pageContent = `FlowBoard workflow run on ${date} at ${time}.

Workflow steps:
${nodeList}

Result:
${result}`;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are saving a workflow run log to Notion. Use the available Notion tools to create a new page with:
- Title: "FlowBoard Run — ${date} ${time}"
- Content: the text provided by the user

Create the page now. Do not ask questions — just create it.`,
      },
      {
        role: "user",
        content: `Create a Notion page with this content:\n\n${pageContent}`,
      },
    ];

    for (let step = 0; step < 5; step++) {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages, tools: tools as any, tool_choice: "auto", max_tokens: 512,
      });

      const choice = response.choices[0];

      if (choice.finish_reason !== "tool_calls") {
        return NextResponse.json({ ok: true, message: choice.message.content ?? "Saved to Notion." });
      }

      messages.push(choice.message);

      for (const call of choice.message.tool_calls ?? []) {
        const res = await toolset.executeToolCall(call, entityId);
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(res) });
      }
    }

    return NextResponse.json({ ok: true, message: "Saved to Notion." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save to Notion";
    console.error("Notion log error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
