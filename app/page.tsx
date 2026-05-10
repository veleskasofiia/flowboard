export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-extrabold mb-6">Composio Dashboard</h1>
        <p className="text-lg mb-8">
          Connect Gmail, Calendar, Notion, and Slack in one sleek workspace.
        </p>
        <a
          href="/gmail"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Get Started
        </a>
      </section>

      {/* Integrations Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-10 pb-20">
        <div className="bg-white text-gray-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">📧 Gmail</h2>
          <p>View and manage your emails seamlessly.</p>
        </div>
        <div className="bg-white text-gray-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">📅 Calendar</h2>
          <p>Stay on top of events and deadlines.</p>
        </div>
        <div className="bg-white text-gray-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">📓 Notion</h2>
          <p>Access your workspace notes and projects.</p>
        </div>
        <div className="bg-white text-gray-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">💬 Slack</h2>
          <p>Check unread messages and team updates.</p>
        </div>
      </section>
    </div>
  );
}
