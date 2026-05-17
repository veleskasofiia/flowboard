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

    const [gmailListResult, outlookResult] = await Promise.allSettled([
      exec("GMAIL_LIST_THREADS", { query: "in:inbox", max_results: 10 }),
      exec("OUTLOOK_OUTLOOK_SEARCH_MESSAGES", { query: "isDraft:false", size: 10 }),
    ]);

    // ── Gmail ───────────────────────────────────────────────────────────
    if (gmailListResult.status === "fulfilled" && !gmailListResult.value?.error) {
      try {
        const threads = (gmailListResult.value.data?.threads ?? []) as { id: string; snippet: string }[];

        const threadDetails = await Promise.allSettled(
          threads.map((t) => exec("GMAIL_FETCH_THREAD_BY_THREAD_ID", { thread_id: t.id }))
        );

        for (let i = 0; i < threadDetails.length; i++) {
          const r = threadDetails[i];
          if (r.status !== "fulfilled") continue;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const thread = r.value?.data as any;
            const msgs: unknown[] = Array.isArray(thread?.messages) ? thread.messages : [];
            // Use the most recent message in the thread
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = msgs[msgs.length - 1] as any;
            if (!msg) continue;

            const headers: { name: string; value: string }[] = msg?.payload?.headers ?? [];
            const get = (name: string) =>
              headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

            emails.push({
              id: thread.id ?? threads[i].id,
              subject: get("Subject") || "(no subject)",
              from: get("From") || "Unknown",
              snippet: msg.snippet ?? threads[i].snippet ?? "",
              date: get("Date") || "",
              source: "gmail",
              isRead: !Array.isArray(msg.labelIds) || !msg.labelIds.includes("UNREAD"),
            });
          } catch { /* skip malformed */ }
        }
      } catch { /* skip */ }
    }

    // ── Outlook ─────────────────────────────────────────────────────────
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
            from: fromAddr?.name ?? fromAddr?.address ?? "Unknown",
            snippet: msg.bodyPreview ?? "",
            date: msg.receivedDateTime ?? "",
            source: "outlook",
            isRead: msg.isRead !== false,
          });
        }
      } catch { /* skip */ }
    }

    // Sort newest first
    emails.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    return NextResponse.json({ emails });
  } catch (err) {
    console.error("Emails error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
