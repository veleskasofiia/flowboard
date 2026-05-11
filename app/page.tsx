export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-extrabold mb-6">Composio Dashboard</h1>
        <p className="text-lg mb-8">
          Connect Gmail, Calendar, Notion, and Slack in one sleek workspace.
        </p>
      </section>

      {/* Integration Buttons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-10 pb-20">
        <a
          href="/gmail"
          className="block text-center bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg p-10 font-semibold text-2xl"
        >
          📧 Gmail
        </a>
        <a
          href="/calendar"
          className="block text-center bg-green-600 hover:bg-green-700 rounded-xl shadow-lg p-10 font-semibold text-2xl"
        >
          📅 Calendar
        </a>
        <a
          href="/notion"
          className="block text-center bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg p-10 font-semibold text-2xl"
        >
          📓 Notion
        </a>
        <a
          href="/slack"
          className="block text-center bg-pink-600 hover:bg-pink-700 rounded-xl shadow-lg p-10 font-semibold text-2xl"
        >
          💬 Slack
        </a>
      </section>
    </div>
  );
}
