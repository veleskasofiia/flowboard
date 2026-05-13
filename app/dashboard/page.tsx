"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const CONNECTED_APPS = [
  { key: "gmail",    label: "Gmail",              icon: "📧", color: "#ea4335" },
  { key: "outlook",  label: "Outlook Mail",       icon: "📨", color: "#0078d4" },
  { key: "ocal",     label: "Outlook Calendar",   icon: "📆", color: "#0f6cbd" },
  { key: "calendar", label: "Google Calendar",    icon: "📅", color: "#4285f4" },
  { key: "ical",     label: "iCal",               icon: "🗓️", color: "#007aff" },
  { key: "gdrive",   label: "Google Drive",       icon: "📁", color: "#34a853" },
  { key: "slack",    label: "Slack",              icon: "💬", color: "#36c5f0" },
  { key: "discord",  label: "Discord",            icon: "🎮", color: "#5865f2" },
  { key: "notion",   label: "Notion",             icon: "📓", color: "#374151" },
  { key: "todoist",  label: "Todoist",            icon: "✅", color: "#db4035" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setMessageCount(count ?? 0);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="dash-page">
      {/* Top nav */}
      <header className="dash-nav">
        <span className="dash-nav-logo">
          <Image src="/logo.svg" alt="FlowBoard" width={32} height={32} />
          FlowBoard
        </span>
        <nav className="dash-nav-links">
          <span className="dash-nav-link active">Dashboard</span>
          <a href="/connected" className="dash-nav-link">Workflow</a>
          <a href="/" className="dash-nav-link">Home</a>
        </nav>
        <button className="dash-signout" onClick={handleSignOut}>Sign Out</button>
      </header>

      <main className="dash-main">
        {/* Welcome */}
        <div className="dash-welcome">
          <h1>{greeting()}, <span>{user?.email}</span></h1>
          <p>Member since {joinedDate}</p>
        </div>

        {/* Stats */}
        <section className="dash-stats">
          <StatCard
            icon="📧"
            label="Emails in inbox"
            value="—"
            note="Connect Gmail or Outlook"
            color="#ea4335"
          />
          <StatCard
            icon="📅"
            label="Events today"
            value="—"
            note="Connect Google Calendar"
            color="#4285f4"
          />
          <StatCard
            icon="✅"
            label="Pending tasks"
            value="—"
            note="Connect Todoist"
            color="#db4035"
          />
          <StatCard
            icon="🤖"
            label="AI conversations"
            value={messageCount}
            note="Messages with your AI agent"
            color="#7c3aed"
          />
        </section>

        {/* Bottom two columns */}
        <div className="dash-bottom">
          {/* Connected apps */}
          <section className="dash-card">
            <h2 className="dash-card-title">Your Apps</h2>
            <p className="dash-card-sub">Go to the Workflow page to connect these apps.</p>
            <div className="dash-apps-grid">
              {CONNECTED_APPS.map((app) => (
                <div key={app.key} className="dash-app-item">
                  <span className="dash-app-icon" style={{ borderColor: app.color }}>
                    {app.icon}
                  </span>
                  <span className="dash-app-name">{app.label}</span>
                  <span className="dash-app-badge">Not connected</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="dash-card">
            <h2 className="dash-card-title">Quick Actions</h2>
            <div className="dash-actions">
              <a href="/connected" className="dash-action-btn primary">
                <span>⚡</span> Open Workflow Builder
              </a>
              <a href="/connected" className="dash-action-btn">
                <span>🔗</span> Connect an App
              </a>
              <a href="/" className="dash-action-btn">
                <span>🏠</span> Back to Home
              </a>
            </div>

            <div className="dash-account">
              <h3>Account</h3>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.id?.slice(0, 8)}…</p>
              <p><strong>Joined:</strong> {joinedDate}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, note, color,
}: {
  icon: string; label: string; value: string | number; note: string; color: string;
}) {
  return (
    <div className="dash-stat-card" style={{ borderTopColor: color }}>
      <div className="dash-stat-icon" style={{ background: color + "18" }}>{icon}</div>
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-note">{note}</div>
    </div>
  );
}
