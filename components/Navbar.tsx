import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex flex-col h-full p-4 space-y-4">
      <h2 className="text-xl font-bold mb-6">Composio Dashboard</h2>
      <Link href="/gmail" className="hover:text-blue-500">📧 Gmail</Link>
      <Link href="/calendar" className="hover:text-blue-500">📅 Calendar</Link>
      <Link href="/notion" className="hover:text-blue-500">📓 Notion</Link>
      <Link href="/slack" className="hover:text-blue-500">💬 Slack</Link>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </nav>
  );
}
