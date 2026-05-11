export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Composio Dashboard</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Manage Gmail, Calendar, Notion, and Slack in one sleek workspace.
        </p>
        <a
          href="/gmail"
          className="mt-8 inline-block px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-200"
        >
          Get Started
        </a>
      </header>

      {/* Integration Buttons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-10 py-16">
        <a href="/gmail" className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg aspect-square text-2xl font-semibold transition">
          📧 <span className="mt-2">Gmail</span>
        </a>
        <a href="/calendar" className="flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg aspect-square text-2xl font-semibold transition">
          📅 <span className="mt-2">Calendar</span>
        </a>
        <a href="/notion" className="flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg aspect-square text-2xl font-semibold transition">
          📓 <span className="mt-2">Notion</span>
        </a>
        <a href="/slack" className="flex flex-col items-center justify-center bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg aspect-square text-2xl font-semibold transition">
          💬 <span className="mt-2">Slack</span>
        </a>
      </section>

      {/* Steps Section */}
      <section className="max-w-4xl mx-auto px-6 pb-16 space-y-12">
        <div>
          <h2 className="text-2xl font-bold mb-4">Step 1: Connect Gmail</h2>
          <p>Authorize Gmail to start syncing your emails.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Step 2: Sync Calendar</h2>
          <p>View upcoming events directly in your dashboard.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Step 3: Add Notion</h2>
          <p>Access your workspace notes and projects.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Step 4: Integrate Slack</h2>
          <p>Stay updated with team notifications.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-6 text-center">
        <p>© 2026 Composio Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
