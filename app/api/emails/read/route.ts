import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { entityId, emailId, threadId, source, markAsRead } = await req.json();
    if (!entityId || entityId === "default") {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }
    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }

    if (source === "gmail") {
      const { OpenAIToolSet } = await import("composio-core");
      const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

      await toolset.executeAction({
        action: "GMAIL_MODIFY_THREAD_LABELS",
        params: {
          user_id: "me",
          thread_id: threadId ?? emailId,
          add_label_ids: markAsRead ? null : ["UNREAD"],
          remove_label_ids: markAsRead ? ["UNREAD"] : null,
        },
        entityId,
      });
    }
    // Outlook has no mark-as-read action in Composio — handled locally only

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update read status";
    console.error("Toggle read error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
