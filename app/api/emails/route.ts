import { NextResponse } from "next/server";

export type EmailItem = {
  id: string;
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

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
    const exec = (action: string, params: Record<string, unknown>) =>
      toolset.executeAction({ action, params, entityId });

    const emails: EmailItem[] = [];
    const sources = { gmail: false, outlook: false };

    const [gmailResult, outlookResult] = await Promise.allSettled([
      exec("GMAIL_LIST_THREADS", { query: "in:inbox", max_results: 15 }),
      exec("OUTLOOK_OUTLOOK_SEARCH_MESSAGES", { query: "isDraft:false", size: 15 }),
    ]);

    // ── Gmail: use thread list data directly (snippet + id) ─────────────
    if (gmailResult.status === "fulfilled" && !gmailResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = gmailResult.value.data as any;
        const threads: { id: string; snippet: string }[] = Array.isArray(data?.threads) ? data.threads : [];
        for (const t of threads) {
          emails.push({
            id: t.id,
            subject: "(Gmail thread)",
            from: "Gmail",
            snippet: t.snippet ?? "",
            date: "",
            source: "gmail",
            isRead: false,
          });
        }
        sources.gmail = true;
      } catch { /* skip */ }
    }

    // ── Outlook: full metadata available from search ─────────────────────
    if (outlookResult.status === "fulfilled" && !outlookResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = outlookResult.value.data as any;
        const msgs: unknown[] = Array.isArray(d?.response_data?.value) ? d.response_data.value : [];
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
        sources.outlook = true;
      } catch { /* skip */ }
    }

    // Sort Outlook emails by date; Gmail threads keep list order
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
