export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <header className="text-center py-16 bg-blue-600 text-white">
        <h1 className="text-5xl font-extrabold mb-4">Getting Started with Composio</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Learn how to connect Gmail, Calendar, Notion, and Slack in one dashboard.
        </p>
      </header>

      {/* Steps Section */}
      <main className="max-w-4xl mx-auto py-12 px-6 space-y-12">
        {/* Step 1 */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Step 1: Connect Gmail</h2>
          <p className="mb-4">
            Navigate to the Gmail integration page and authorize access.
          </p>
          <pre className="bg-gray-800 text-green-300 p-4 rounded-lg overflow-x-auto">
{`// Example Gmail API call
fetch("/api/gmail")
  .then(res => res.json())
  .then(data => console.log(data));`}
          </pre>
        </section>

        {/* Step 2 */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Step 2: Sync Calendar</h2>
          <p className="mb-4">
            View upcoming events and deadlines directly in your dashboard.
          </p>
          <pre className="bg-gray-800 text-green-300 p-4 rounded-lg overflow-x-auto">
{`// Example Calendar API call
fetch("/api/calendar")
  .then(res => res.json())
  .then(events => console.log(events));`}
          </pre>
        </section>

        {/* Step 3 */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Step 3: Add Notion</h2>
          <p className="mb-4">
            Connect your Notion workspace to access notes and projects.
          </p>
        </section>

        {/* Step 4 */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Step 4: Integrate Slack</h2>
          <p className="mb-4">
            Stay updated with unread messages and team notifications.
          </p>
        </section>
      </main>
    </div>
  );
}

