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

    // Run all fetches in parallel — each is isolated so one failure won't block others
    const [gcalResult, gmailResult, outlookCalResult, outlookMailResult] = await Promise.allSettled([

      // Google Calendar events this week
      toolset.executeAction({
        action: "GOOGLECALENDAR_EVENTS_LIST",
        params: {
          calendarId: "primary",
          timeMin: monday.toISOString(),
          timeMax: sunday.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 50,
        },
        entityId,
      }),

      // Gmail unread emails
      toolset.executeAction({
        action: "GMAIL_FETCH_EMAILS",
        params: { query: "is:unread", max_results: 200, ids_only: true },
        entityId,
      }),

      // Outlook calendar events this week
      toolset.executeAction({
        action: "OUTLOOK_OUTLOOK_LIST_EVENTS",
        params: {
          filter: `start/dateTime ge '${monday.toISOString()}' and end/dateTime le '${sunday.toISOString()}'`,
          top: 50,
          timezone: "UTC",
        },
        entityId,
      }),

      // Outlook unread messages
      toolset.executeAction({
        action: "OUTLOOK_OUTLOOK_SEARCH_MESSAGES",
        params: { query: "isread:false", size: 200 },
        entityId,
      }),
    ]);

    // ── Parse Google Calendar ───────────────────────────────────────────
    type Meeting = { title: string; start: string; source: string };
    const meetings: Meeting[] = [];
    let gcalOk = false;

    if (gcalResult.status === "fulfilled") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = gcalResult.value;
        const items = raw?.items ?? raw?.data?.items ?? raw?.response?.items ?? [];
        for (const ev of items) {
          const start = ev.start?.dateTime ?? ev.start?.date ?? null;
          if (start && ev.summary) {
            meetings.push({ title: ev.summary, start, source: "google" });
          }
        }
        gcalOk = true;
      } catch { /* ignore */ }
    }

    // ── Parse Gmail ─────────────────────────────────────────────────────
    let gmailUnread: number | null = null;

    if (gmailResult.status === "fulfilled") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = gmailResult.value;
        const messages =
          raw?.messages ?? raw?.data?.messages ?? raw?.response?.messages ??
          raw?.emails ?? raw?.data?.emails ?? [];
        gmailUnread = Array.isArray(messages) ? messages.length : null;
        if (gmailUnread === null && typeof raw?.resultSizeEstimate === "number") {
          gmailUnread = raw.resultSizeEstimate;
        }
      } catch { /* ignore */ }
    }

    // ── Parse Outlook Calendar ──────────────────────────────────────────
    let outlookCalOk = false;

    if (outlookCalResult.status === "fulfilled") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = outlookCalResult.value;
        const items = raw?.value ?? raw?.data?.value ?? raw?.response?.value ?? [];
        for (const ev of items) {
          const start = ev.start?.dateTime ?? null;
          if (start && ev.subject) {
            meetings.push({ title: ev.subject, start, source: "outlook" });
          }
        }
        outlookCalOk = true;
      } catch { /* ignore */ }
    }

    // ── Parse Outlook Mail ──────────────────────────────────────────────
    let outlookUnread: number | null = null;

    if (outlookMailResult.status === "fulfilled") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = outlookMailResult.value;
        const msgs =
          raw?.value ?? raw?.data?.value ?? raw?.response?.value ??
          raw?.messages ?? raw?.data?.messages ?? [];
        outlookUnread = Array.isArray(msgs) ? msgs.length : null;
      } catch { /* ignore */ }
    }

    // Sort meetings by start time
    meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Next meeting = first meeting that hasn't ended yet
    const now = new Date();
    const nextMeeting = meetings.find((m) => new Date(m.start) >= now) ?? null;

    const connected: string[] = [];
    if (gcalOk) connected.push("googlecalendar");
    if (gmailUnread !== null) connected.push("gmail");
    if (outlookCalOk) connected.push("outlook_calendar");
    if (outlookUnread !== null) connected.push("outlook_mail");

    return NextResponse.json({
      meetings_count: gcalOk || outlookCalOk ? meetings.length : null,
      meetings,
      next_meeting: nextMeeting,
      gmail_unread: gmailUnread,
      outlook_unread: outlookUnread,
      connected,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
