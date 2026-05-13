import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const COMPOSIO_APPS = ["gmail", "googlecalendar", "googledrive", "slack", "notion", "todoist", "discord", "outlook"];

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

    // ── Real execution via Composio (signed-in user with connected apps) ──────
    if (composioKey && composioKey.length > 20 && entityId !== "default") {
      const { OpenAIToolSet } = await import("composio-core");
      const toolset = new OpenAIToolSet({ apiKey: composioKey });

      const tools = await toolset.getTools({ apps: COMPOSIO_APPS });

      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are executing a FlowBoard automation workflow for a real user.
The workflow contains these nodes: ${nodeList}.

Your job is to fetch REAL data from the user's connected accounts using the available tools.
For each relevant app node in the workflow:
- Google Calendar or Outlook Calendar: list the user's upcoming events (next 3-5)
- Gmail or Outlook Mail: fetch the user's latest 3 unread emails (subject + sender)
- Slack: get recent messages from a channel
- Notion: list recent pages
- Google Drive: list recent files
- Todoist: list open tasks
- Webhook/Schedule triggers: just acknowledge what triggered the workflow

Call the tools, get real data, then write a concise summary of what the workflow found/did.
Format as bullet points, one per app. Be specific — use real subjects, names, times from the tool results.
Never invent data. If a tool fails or returns nothing, say so honestly.`,
        },
        {
          role: "user",
          content: "Run the workflow now and show me what's in my connected accounts.",
        },
      ];

      for (let step = 0; step < 10; step++) {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages, tools: tools as any, tool_choice: "auto", max_tokens: 2048,
        });

        const choice = response.choices[0];

        if (choice.finish_reason !== "tool_calls") {
          return NextResponse.json({ result: choice.message.content ?? "Workflow completed." });
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

      return NextResponse.json({ result: "Workflow completed (reached max steps)." });
    }

    // ── Simulation fallback (not signed in / no Composio) ────────────────────
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a workflow simulation engine. The user is not signed in or has not connected their apps yet.
Simulate the workflow with these nodes: ${nodeList}.
Return 3-5 bullet points of what would happen. Add a note at the end that says:
"⚠ This is a simulation. Sign in and connect your apps to see real data."`,
        },
        { role: "user", content: "Simulate the workflow." },
      ],
      max_tokens: 512,
    });

    return NextResponse.json({
      result: response.choices[0].message.content ?? "Workflow simulated.",
    });
  } catch (err) {
    console.error("Run error:", err);
    return NextResponse.json({ result: "Workflow run failed. Please try again." }, { status: 500 });
  }
}
