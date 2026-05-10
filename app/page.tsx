"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [emails, setEmails] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const emailRes = await fetch("/api/gmail");
        if (!emailRes.ok) throw new Error("Failed to fetch Gmail");
        const emailData = await emailRes.json();
        setEmails(emailData.unreadEmails);

        const calRes = await fetch("/api/calendar");
        if (!calRes.ok) throw new Error("Failed to fetch Calendar");
        const calData = await calRes.json();
        setMeetings(calData.meetingsToday);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}

      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">📧 Gmail</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {emails !== null ? `${emails} unread emails` : "Loading..."}
          </p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">📅 Calendar</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {meetings !== null ? `${meetings} meetings today` : "Loading..."}
          </p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">📓 Notion</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your workspace notes and docs.
          </p>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
          <h2 className="text-xl font-bold mb-2">💬 Slack</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Team conversations and updates.
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="text-lg font-semibold">Meetings</h3>
          <p>{meetings ?? "Loading..."}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="text-lg font-semibold">Emails</h3>
          <p>{emails ?? "Loading..."}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="text-lg font-semibold">Tasks</h3>
          <p>Coming soon…</p>
        </div>
      </div>
    </div>
  );
}
