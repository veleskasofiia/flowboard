import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nodes, result, entityId = "default" } = await req.json();

    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "COMPOSIO_API_KEY not configured" }, { status: 500 });
    }

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

    const nodeList = (nodes as { label: string }[]).map((n) => `• ${n.label}`).join("\n");
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const title = `FlowBoard Run — ${date} ${time}`;
    const content = `Workflow steps:\n${nodeList}\n\nResult:\n${result}`;

    // Execute directly — no Groq, no schema issues
    const entity = toolset.client.getEntity(entityId);
    const response = await entity.execute({
      actionName: "NOTION_CREATE_NOTION_PAGE",
      params: { title, content },
    });

    console.log("Notion create response:", JSON.stringify(response).slice(0, 500));

    return NextResponse.json({ ok: true, message: "Saved to Notion." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Notion log error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
