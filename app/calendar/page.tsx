export default async function CalendarPage() {
  try {
    const res = await fetch("https://api.composio.dev/slack/unread", {
      headers: { Authorization: `Bearer ${process.env.COMPOSIO_API_KEY}` },
      cache: "no-store", // avoid caching
    });
    const data = await res.json();

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p>Unread Slack messages: {data.count}</p>
      </div>
    );
  } catch (error) {
    console.error("Slack API error:", error);
    return (
      <div className="p-6 text-red-600">
        <p>Failed to load unread messages.</p>
      </div>
    );
  }
}
