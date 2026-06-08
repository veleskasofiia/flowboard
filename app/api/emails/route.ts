import { NextResponse } from "next/server";

export type EmailItem = {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  source: "gmail" | "outlook";
  isRead: boolean;
};

export async function POST(req: Request) {
  try {
    const { entityId } = await req.json();
    if (!entityId || entityId === "default") {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }
    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }

    const { Composio } = await import("@composio/core");
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    const exec = (slug: string, args: Record<string, unknown>) =>
      composio.tools.execute(slug, { userId: entityId, dangerouslySkipVersionCheck: true, arguments: args });

    const emails: EmailItem[] = [];
    const sources = { gmail: false, outlook: false };

    const [gmailResult, outlookResult] = await Promise.allSettled([
      exec("GMAIL_FETCH_EMAILS", {
        max_results: 15,
        label_ids: ["INBOX"],
        verbose: false,
        user_id: "me",
      }),
      exec("OUTLOOK_GET_MAIL_DELTA", {
        folder_id: "inbox",
        top: 15,
        user_id: "me",
        select: ["id", "subject", "from", "receivedDateTime", "isRead", "bodyPreview"],
      }),
    ]);

    // ── Gmail ───────────────────────────────────────────────────────────
    if (gmailResult.status === "fulfilled" && !gmailResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = gmailResult.value as any;
        const d = val?.data ?? val;
        // Handle multiple possible response shapes
        const msgs: unknown[] =
          Array.isArray(d?.messages) ? d.messages :
          Array.isArray(d?.response_data?.messages) ? d.response_data.messages :
          Array.isArray(d?.response_data) ? d.response_data :
          [];

        console.log("Gmail fetch shape sample:", JSON.stringify(msgs[0] ?? d).slice(0, 300));

        for (const m of msgs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = m as any;
          const isUnread = Array.isArray(msg.labelIds)
            ? msg.labelIds.includes("UNREAD")
            : Array.isArray(msg.labels)
            ? msg.labels.includes("UNREAD")
            : false;

          emails.push({
            id: msg.id ?? msg.messageId ?? "",
            threadId: msg.threadId ?? msg.id ?? msg.messageId ?? "",
            subject: msg.subject || msg.Subject || "(no subject)",
            from: msg.sender || msg.from || msg.From || "Gmail",
            snippet: msg.snippet ?? msg.body ?? msg.bodyPreview ?? "",
            date: msg.date ?? msg.Date ?? msg.time ?? "",
            source: "gmail",
            isRead: !isUnread,
          });
        }
        if (msgs.length > 0) sources.gmail = true;
      } catch (e) {
        console.error("Gmail parse error:", e);
      }
    }

    // ── Outlook ─────────────────────────────────────────────────────────
    if (outlookResult.status === "fulfilled" && !outlookResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = outlookResult.value as any;
        const d = val?.data ?? val;
        const msgs: unknown[] = Array.isArray(d?.response_data?.value) ? d.response_data.value :
          Array.isArray(d?.value) ? d.value : [];
        for (const m of msgs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = m as any;
          const fromAddr = msg?.from?.emailAddress;
          emails.push({
            id: msg.id ?? "",
            subject: msg.subject || "(no subject)",
            from: fromAddr?.name ?? fromAddr?.address ?? "Outlook",
            snippet: msg.bodyPreview ?? "",
            date: msg.receivedDateTime ?? "",
            source: "outlook",
            isRead: msg.isRead !== false,
          });
        }
        if (msgs.length > 0) sources.outlook = true;
      } catch { /* skip */ }
    }

    emails.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ emails, sources });
  } catch (err) {
    console.error("Emails error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
