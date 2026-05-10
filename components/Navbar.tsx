import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex flex-col h-full p-6 space-y-6">
      <h2 className="text-xl font-bold">Composio</h2>
      <Link href="/gmail" className="flex items-center space-x-2 hover:text-blue-600">
        <span>📧</span><span>Gmail</span>
      </Link>
      <Link href="/calendar" className="flex items-center space-x-2 hover:text-blue-600">
        <span>📅</span><span>Calendar</span>
      </Link>
      <Link href="/notion" className="flex items-center space-x-2 hover:text-blue-600">
        <span>📓</span><span>Notion</span>
      </Link>
      <Link href="/slack" className="flex items-center space-x-2 hover:text-blue-600">
        <span>💬</span><span>Slack</span>
      </Link>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </nav>
  );
}
