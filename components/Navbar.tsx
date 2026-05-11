"use client";

export default function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">FlowBoard</h2>
      <ul>
        <li><a href="#gmail">📧 Gmail</a></li>
        <li><a href="#calendar">📅 Calendar</a></li>
        <li><a href="#notion">📓 Notion</a></li>
        <li><a href="#slack">💬 Slack</a></li>
      </ul>
    </nav>
  );
}
