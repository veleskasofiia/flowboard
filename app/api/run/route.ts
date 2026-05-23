import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const COMPOSIO_APPS = ["gmail", "googlecalendar", "googledrive", "slack", "notion", "discord", "outlook"];

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
    const { nodes, entityId = "default" } = await req.json();

    const nodeList = (nodes as { label: string; category: string }[])
      .map((n) => `${n.category === "trigger" ? "[Trigger]" : "[Action]"} ${n.label}`)
      .join(", ");

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ result: "AI not configured — add GROQ_API_KEY." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const composioKey = process.env.COMPOSIO_API_KEY;

    // ── Real execution via Composio ──────────────────────────────────────────
    if (composioKey && composioKey.length > 20 && entityId !== "default") {
      const { OpenAIToolSet } = await import("composio-core");
      const toolset = new OpenAIToolSet({ apiKey: composioKey });

      const rawTools = await toolset.getTools({ apps: COMPOSIO_APPS });
      const tools = stripPatterns(rawTools.slice(0, 64)) as typeof rawTools;

      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are executing a FlowBoard automation workflow for a real user.
The workflow contains these nodes: ${nodeList}.

Fetch REAL data from the user's connected accounts using the available tools.
For each relevant app node:
- Google Calendar or Outlook Calendar: list upcoming events (next 3-5)
- Gmail or Outlook Mail: fetch latest 3 unread emails (subject + sender)
- Slack: get recent messages
- Notion: list recent pages
- Google Drive: list recent files
- Webhook triggers: acknowledge the trigger

Call the tools, then write a concise bullet-point summary of what was found.
Use real data — never invent anything. If a tool fails, say so.`,
        },
        {
          role: "user",
          content: "Run the workflow now and show me what's in my connected accounts.",
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
          return NextResponse.json({ result: choice.message.content ?? "Workflow completed." });
        }

        messages.push(choice.message);

        for (const call of choice.message.tool_calls ?? []) {
          const result = await toolset.executeToolCall(call, entityId);
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        }
      }

      return NextResponse.json({ result: "Workflow completed (reached max steps)." });
    }

    // ── Simulation fallback ──────────────────────────────────────────────────
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a workflow simulation engine. The user is not signed in or has not connected their apps yet.
Simulate the workflow with these nodes: ${nodeList}.
Return 3-5 bullet points of what would happen. Add a note:
"⚠ This is a simulation. Sign in and connect your apps to see real data."`,
        },
        { role: "user", content: "Simulate the workflow." },
      ],
      max_tokens: 512,
    });

    return NextResponse.json({ result: response.choices[0].message.content ?? "Workflow simulated." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Run error:", msg);
    return NextResponse.json({ result: `Run failed: ${msg}` }, { status: 500 });
  }
}
