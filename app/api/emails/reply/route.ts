import { NextResponse } from "next/server";
import { Composio } from "@composio/core";

export async function POST(req: Request) {
  try {
    const { entityId, emailId, threadId, source, body, recipientEmail } = await req.json();

    if (!entityId || entityId === "default") {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }
    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }
    if (!body?.trim()) {
      return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });
    }

    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    const exec = (slug: string, args: Record<string, unknown>) =>
      composio.tools.execute(slug, {
        userId: entityId,
        dangerouslySkipVersionCheck: true,
        arguments: args,
      });

    if (source === "gmail") {
      // Extract plain email from "Display Name <email@domain.com>" format
      const emailMatch = /<([^>]+)>/.exec(recipientEmail ?? "");
      const plainEmail = emailMatch ? emailMatch[1] : recipientEmail;

      const result = await exec("GMAIL_REPLY_TO_THREAD", {
        thread_id: threadId ?? emailId,
        message_body: body,
        recipient_email: plainEmail,
        user_id: "me",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = result as any;
      if (r?.error || r?.successful === false) {
        const detail = r?.data?.message ?? r?.error ?? "Unknown error";
        return NextResponse.json({ error: `Failed to send Gmail reply: ${detail}` }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (source === "outlook") {
      // Step 1: create draft reply with the reply text
      const draft = await exec("OUTLOOK_CREATE_DRAFT_REPLY", {
        message_id: emailId,
        comment: body,
        user_id: "me",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = draft as any;
      const draftId = d?.data?.id ?? d?.data?.response_data?.id;
      if (!draftId) {
        return NextResponse.json({ error: "Failed to create Outlook draft reply" }, { status: 500 });
      }
      // Step 2: send the draft
      await exec("OUTLOOK_SEND_DRAFT", {
        message_id: draftId,
        user_id: "me",
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown email source" }, { status: 400 });
  } catch (err) {
    console.error("Reply error:", err);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
