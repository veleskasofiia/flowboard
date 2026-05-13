import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dig(obj: any, ...keys: string[]): any {
  for (const k of keys) {
    if (obj?.[k] !== undefined) return obj[k];
  }
  return undefined;
}

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
    let gcalOk = false;
    if (gcalResult.status === "fulfilled" && !gcalResult.value?.error) {
      try {
        const d = gcalResult.value.data;
        const items = dig(d, "items", "response", "events") ?? [];
        if (Array.isArray(items)) {
          for (const ev of items) {
            const start = ev.start?.dateTime ?? ev.start?.date ?? null;
            if (start && ev.summary) meetings.push({ title: ev.summary, start, source: "google" });
          }
          gcalOk = true;
          connected.push("googlecalendar");
        }
      } catch { /* ignore */ }
    }

    // ── Gmail ───────────────────────────────────────────────────────────
    let gmailUnread: number | null = null;
    if (gmailResult.status === "fulfilled" && !gmailResult.value?.error) {
      try {
        const d = gmailResult.value.data;
        // resultSizeEstimate = total matching threads (not capped by page size)
        const estimate = dig(d, "resultSizeEstimate");
        const threads = dig(d, "threads") ?? [];
        if (typeof estimate === "number" && estimate > 0) {
          gmailUnread = estimate;
        } else if (Array.isArray(threads)) {
          gmailUnread = threads.length;
        } else {
          gmailUnread = 0;
        }
        connected.push("gmail");
      } catch { /* ignore */ }
    }

    // ── Outlook Calendar ────────────────────────────────────────────────
    let outlookCalOk = false;
    if (outlookCalResult.status === "fulfilled" && !outlookCalResult.value?.error) {
      try {
        const d = outlookCalResult.value.data;
        const items = dig(d, "value", "events", "items") ?? [];
        if (Array.isArray(items)) {
          for (const ev of items) {
            const start = ev.start?.dateTime ?? null;
            if (start && ev.subject) meetings.push({ title: ev.subject, start, source: "outlook" });
          }
          outlookCalOk = true;
          connected.push("outlook_calendar");
        }
      } catch { /* ignore */ }
    }

    // ── Outlook Mail ────────────────────────────────────────────────────
    let outlookUnread: number | null = null;
    if (outlookMailResult.status === "fulfilled" && !outlookMailResult.value?.error) {
      try {
        const d = outlookMailResult.value.data;
        const msgs = dig(d, "value", "messages", "items") ?? [];
        const count = dig(d, "@odata.count", "totalCount");
        if (typeof count === "number") {
          outlookUnread = count;
        } else if (Array.isArray(msgs)) {
          outlookUnread = msgs.length;
        }
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
      outlook_unread: outlookUnread,
      connected,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
