import { NextResponse } from "next/server";
import { Composio } from "@composio/core";

export async function POST(req: Request) {
  try {
    const { entityId } = await req.json();

    if (!entityId || entityId === "default") {
      return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
    }
    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "not_configured" }, { status: 500 });
    }

    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    twoWeeksLater.setHours(23, 59, 59, 999);

    const exec = (slug: string, args: Record<string, unknown>) =>
      composio.tools.execute(slug, {
        userId: entityId,
        dangerouslySkipVersionCheck: true,
        arguments: args,
      });

    const [gcalResult, gmailResult, outlookCalResult, outlookMailResult] = await Promise.allSettled([
      exec("GOOGLECALENDAR_EVENTS_LIST", {
        calendarId: "primary",
        timeMin: today.toISOString(),
        timeMax: twoWeeksLater.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      }),
      exec("GMAIL_FETCH_EMAILS", { query: "is:unread in:inbox", max_results: 500, ids_only: true, user_id: "me" }),
      exec("OUTLOOK_GET_CALENDAR_VIEW", {
        start_datetime: today.toISOString(),
        end_datetime: twoWeeksLater.toISOString(),
        top: 100,
        user_id: "me",
      }),
      exec("OUTLOOK_GET_MAIL_DELTA", {
        folder_id: "inbox",
        top: 100,
        user_id: "me",
        select: ["id", "isRead"],
      }),
    ]);

    type Meeting = { title: string; start: string; source: string };
    const meetings: Meeting[] = [];
    const connected: string[] = [];

    // Google Calendar
    let gcalOk = false;
    if (gcalResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = gcalResult.value as any;
      console.log("GCal result:", JSON.stringify(val)?.slice(0, 300));
      if (!val?.error) {
        try {
          const d = val.data ?? val;
          const items: unknown[] =
            Array.isArray(d?.items) ? d.items :
            Array.isArray(d?.response_data?.items) ? d.response_data.items :
            Array.isArray(d?.response_data) ? d.response_data : [];
          for (const ev of items) {
            const e = ev as Record<string, unknown>;
            const s = e.start as Record<string, string> | undefined;
            const start = s?.dateTime ?? s?.date ?? null;
            const title = typeof e.summary === "string" ? e.summary : e.summary ? JSON.stringify(e.summary) : null;
            if (start && title) meetings.push({ title, start, source: "google" });
          }
          gcalOk = true;
          connected.push("googlecalendar");
        } catch (e) { console.error("GCal parse error:", e); }
      }
    } else {
      console.error("GCal failed:", gcalResult.reason);
    }

    // Gmail — GMAIL_FETCH_EMAILS with ids_only returns messages array
    let gmailUnread: number | null = null;
    let gmailHasMore = false;
    if (gmailResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = gmailResult.value as any;
      console.log("Gmail result:", JSON.stringify(val)?.slice(0, 300));
      if (!val?.error) {
        try {
          const d = val.data ?? val;
          const msgs: unknown[] =
            Array.isArray(d?.messages) ? d.messages :
            Array.isArray(d?.response_data?.messages) ? d.response_data.messages :
            Array.isArray(d?.response_data) ? d.response_data : [];
          gmailHasMore = !!(d?.nextPageToken ?? d?.response_data?.nextPageToken);
          gmailUnread = msgs.length;
          connected.push("gmail");
        } catch { /* ignore */ }
      }
    } else {
      console.error("Gmail failed:", gmailResult.reason);
    }

    // Outlook Calendar
    let outlookCalOk = false;
    if (outlookCalResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = outlookCalResult.value as any;
      console.log("Outlook cal result:", JSON.stringify(val)?.slice(0, 400));
      if (!val?.error) {
        try {
          const d = val.data ?? val;
          // OUTLOOK_GET_CALENDAR_VIEW returns { value: [...] } or nested under response_data
          const items: unknown[] =
            Array.isArray(d?.value) ? d.value :
            Array.isArray(d?.response_data?.value) ? d.response_data.value :
            Array.isArray(d?.events) ? d.events :
            Array.isArray(d?.response_data) ? d.response_data : [];
          for (const ev of items) {
            const e = ev as Record<string, unknown>;
            const s = (e.start as Record<string, string> | undefined);
            const start = s?.dateTime ?? null;
            const title = typeof e.subject === "string" ? e.subject : e.subject ? JSON.stringify(e.subject) : null;
            if (start && title) meetings.push({ title, start, source: "outlook" });
          }
          outlookCalOk = true;
          connected.push("outlook_calendar");
        } catch (e) { console.error("Outlook cal parse error:", e); }
      }
    } else {
      console.error("Outlook cal failed:", outlookCalResult.reason);
    }

    // Outlook Mail — OUTLOOK_GET_MAIL_DELTA returns messages; count isRead:false for unread
    let outlookUnread: number | null = null;
    if (outlookMailResult.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = outlookMailResult.value as any;
      console.log("Outlook mail result:", JSON.stringify(val)?.slice(0, 400));
      if (!val?.error) {
        try {
          const d = val.data ?? val;
          const msgs: unknown[] =
            Array.isArray(d?.value) ? d.value :
            Array.isArray(d?.response_data?.value) ? d.response_data.value :
            Array.isArray(d?.messages) ? d.messages :
            Array.isArray(d?.response_data) ? d.response_data : [];
          // Count unread (isRead === false)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const unreadMsgs = msgs.filter((m: any) => m?.isRead === false);
          outlookUnread = unreadMsgs.length;
          connected.push("outlook_mail");
        } catch (e) { console.error("Outlook mail parse error:", e); }
      }
    } else {
      console.error("Outlook mail failed:", outlookMailResult.reason);
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
