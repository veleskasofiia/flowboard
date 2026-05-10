import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="px-6 py-4 bg-gray-100 dark:bg-gray-800 shadow-md flex gap-6 items-center">
      <Link href="/" className="font-semibold hover:text-blue-500">Dashboard</Link>
      <Link href="/gmail" className="hover:text-blue-500">Gmail</Link>
      <Link href="/calendar" className="hover:text-blue-500">Calendar</Link>
      <Link href="/notion" className="hover:text-blue-500">Notion</Link>
      <Link href="/slack" className="hover:text-blue-500">Slack</Link>

      {/* ✅ Theme toggle button */}
      <ThemeToggle />
    </nav>
  );
}
