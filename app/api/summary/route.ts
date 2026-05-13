import { NextResponse } from "next/server";


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

    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const exec = (action: string, params: Record<string, unknown>) =>
      toolset.executeAction({ action, params, entityId });

    const [gcalResult, gmailResult, outlookCalResult, outlookMailResult] = await Promise.allSettled([
      exec("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin: monday.toISOString(),
        timeMax: sunday.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      }),
      // No max_results so resultSizeEstimate reflects true total unread
      exec("GMAIL_LIST_THREADS", {
        query: "is:unread",
      }),
      exec("OUTLOOK_OUTLOOK_LIST_EVENTS", {
        filter: `start/dateTime ge '${monday.toISOString()}' and end/dateTime le '${sunday.toISOString()}'`,
        top: 100,
        timezone: "UTC",
      }),
      exec("OUTLOOK_OUTLOOK_SEARCH_MESSAGES", {
        query: "isread:false",
        size: 500,
      }),
    ]);

    type Meeting = { title: string; start: string; source: string };
    const meetings: Meeting[] = [];
    const connected: string[] = [];

    // ── Google Calendar ─────────────────────────────────────────────────
    // Response shape: { data: { items: [...], ... } }
    let gcalOk = false;
    if (gcalResult.status === "fulfilled" && !gcalResult.value?.error) {
      try {
        const d = gcalResult.value.data;
        const items: unknown[] = Array.isArray(d?.items) ? d.items : [];
        for (const ev of items) {
          const e = ev as Record<string, unknown>;
          const s = (e.start as Record<string, string> | undefined);
          const start = s?.dateTime ?? s?.date ?? null;
          if (start && e.summary) meetings.push({ title: e.summary as string, start, source: "google" });
        }
        gcalOk = true;
        connected.push("googlecalendar");
      } catch { /* ignore */ }
    }

    // ── Gmail ───────────────────────────────────────────────────────────
    // Response shape: { data: { threads: [...], nextPageToken?: string } }
    // resultSizeEstimate is not forwarded by Composio; use threads.length.
    // nextPageToken means more pages exist — surface a "+" indicator via gmail_has_more.
    let gmailUnread: number | null = null;
    let gmailHasMore = false;
    if (gmailResult.status === "fulfilled" && !gmailResult.value?.error) {
      try {
        const d = gmailResult.value.data;
        const threads: unknown[] = Array.isArray(d?.threads) ? d.threads : [];
        gmailHasMore = !!d?.nextPageToken;
        gmailUnread = threads.length;
        connected.push("gmail");
      } catch { /* ignore */ }
    }

    // ── Outlook Calendar ────────────────────────────────────────────────
    // Response shape: { data: { response_data: { value: [...] } } }
    let outlookCalOk = false;
    if (outlookCalResult.status === "fulfilled" && !outlookCalResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = outlookCalResult.value.data as any;
        const items: unknown[] = Array.isArray(d?.response_data?.value) ? d.response_data.value : [];
        for (const ev of items) {
          const e = ev as Record<string, unknown>;
          const s = (e.start as Record<string, string> | undefined);
          const start = s?.dateTime ?? null;
          if (start && e.subject) meetings.push({ title: e.subject as string, start, source: "outlook" });
        }
        outlookCalOk = true;
        connected.push("outlook_calendar");
      } catch { /* ignore */ }
    }

    // ── Outlook Mail ────────────────────────────────────────────────────
    // Response shape: { data: { response_data: { value: [...] } } }
    let outlookUnread: number | null = null;
    if (outlookMailResult.status === "fulfilled" && !outlookMailResult.value?.error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = outlookMailResult.value.data as any;
        const msgs: unknown[] = Array.isArray(d?.response_data?.value) ? d.response_data.value : [];
        outlookUnread = msgs.length;
        connected.push("outlook_mail");
      } catch { /* ignore */ }
    }

    meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const now = new Date();
    const nextMeeting = meetings.find((m) => new Date(m.start) >= now) ?? null;

    return NextResponse.json({
      meetings_count: gcalOk || outlookCalOk ? meetings.length : null,
      meetings,
      next_meeting: nextMeeting,
      gmail_unread: gmailUnread,
      gmail_has_more: gmailHasMore,
      outlook_unread: outlookUnread,
      connected,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
