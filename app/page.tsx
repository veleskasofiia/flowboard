"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [emails, setEmails] = useState<number | null>(null);
  const [meetings, setMeetings] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      const emailRes = await fetch("/api/gmail");
      const emailData = await emailRes.json();
      setEmails(emailData.unreadEmails);

      const calRes = await fetch("/api/calendar");
      const calData = await calRes.json();
      setMeetings(calData.meetingsToday);
    }
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gmail Card */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
        <h2 className="text-xl font-bold mb-2">📧 Gmail</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {emails !== null ? `${emails} unread emails` : "Loading..."}
        </p>
      </div>

      {/* Calendar Card */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
        <h2 className="text-xl font-bold mb-2">📅 Calendar</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {meetings !== null ? `${meetings} meetings today` : "Loading..."}
        </p>
      </div>

      {/* Notion Card */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
        <h2 className="text-xl font-bold mb-2">📓 Notion</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your workspace notes and docs.
        </p>
      </div>

      {/* Slack Card */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
        <h2 className="text-xl font-bold mb-2">💬 Slack</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Team conversations and updates.
        </p>
      </div>
    </div>
  );
}
