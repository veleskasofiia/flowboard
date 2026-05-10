"use client";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-xl font-bold">Composio Dashboard</h1>
      <ThemeToggle />
    </nav>
  );
}
