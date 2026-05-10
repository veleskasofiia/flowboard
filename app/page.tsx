"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [emails, setEmails] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<number | null>(null);
  const [slack, setSlack] = useState<number | null>(null);
  const [notion, setNotion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const emailRes = await fetch("/api/gmail");
        const emailData = await emailRes.json();
        setEmails(emailData.unreadEmails);

        const calRes = await fetch("/api/calendar");
        const calData = await calRes.json();
        setMeetings(calData.meetingsToday);

        const slackRes = await fetch("/api/slack");
        const slackData = await slackRes.json();
        setSlack(slackData.unreadMessages);

        const notionRes = await fetch("/api/notion");
        const notionData = await notionRes.json();
        setNotion(notionData.pages);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">📧 Gmail</h2>
          <p>{emails !== null ? `${emails} unread emails` : "Loading..."}</p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">📅 Calendar</h2>
          <p>{meetings !== null ? `${meetings} meetings today` : "Loading..."}</p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">💬 Slack</h2>
          <p>{slack !== null ? `${slack} unread messages` : "Loading..."}</p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">📓 Notion</h2>
          <p>{notion !== null ? `${notion} pages` : "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}
