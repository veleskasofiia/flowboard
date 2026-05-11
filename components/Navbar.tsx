export default function Navbar() {
  return (
    <nav className="p-4">
      <h2 className="text-xl font-bold">Composio</h2>
      <ul className="mt-4 space-y-2">
        <li><a href="/gmail" className="block hover:text-blue-600">Gmail</a></li>
        <li><a href="/calendar" className="block hover:text-green-600">Calendar</a></li>
        <li><a href="/notion" className="block hover:text-purple-600">Notion</a></li>
        <li><a href="/slack" className="block hover:text-pink-600">Slack</a></li>
      </ul>
    </nav>
  );
}
