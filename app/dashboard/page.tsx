"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

type RunRecord = { id: number; result: string; nodes: string[]; ts: string };

const APPS = [
  { key: "gmail",    label: "Gmail",            icon: "📧", color: "#ea4335" },
  { key: "outlook",  label: "Outlook Mail",     icon: "📨", color: "#0078d4" },
  { key: "ocal",     label: "Outlook Calendar", icon: "📆", color: "#0f6cbd" },
  { key: "calendar", label: "Google Calendar",  icon: "📅", color: "#4285f4" },
  { key: "ical",     label: "iCal",             icon: "🗓️", color: "#007aff" },
  { key: "gdrive",   label: "Google Drive",     icon: "📁", color: "#34a853" },
  { key: "slack",    label: "Slack",            icon: "💬", color: "#36c5f0" },
  { key: "discord",  label: "Discord",          icon: "🎮", color: "#5865f2" },
  { key: "notion",   label: "Notion",           icon: "📓", color: "#374151" },
  { key: "todoist",  label: "Todoist",          icon: "✅", color: "#db4035" },
];

const STEPS = [
  {
    number: "1",
    icon: "⚡",
    title: "Choose a Trigger",
    desc: "In the Workflow page, drag a Webhook or Schedule node from the left panel onto the canvas. This starts your flow.",
    color: "#f59e0b",
  },
  {
    number: "2",
    icon: "🔗",
    title: "Add App Actions",
    desc: "Drag any app node (Gmail, Slack, Notion…) from the Actions section and drop it on the canvas. Draw an arrow from your trigger to the action.",
    color: "#2563eb",
  },
  {
    number: "3",
    icon: "🔀",
    title: "Add an IF Condition (optional)",
    desc: 'Drag the "IF Condition" node from the Actions section. Connect your trigger to it, then connect two separate app nodes for the true and false paths.',
    color: "#7c3aed",
  },
];

const AI_PROMPTS = [
  "How do I connect Gmail to Slack?",
  "How do I use the IF Condition node?",
  "Set up a daily schedule that sends a Notion reminder",
  "What's the difference between Webhook and Schedule?",
  "How do I connect Outlook Calendar to Google Calendar?",
  "Create a workflow that filters emails by subject",
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
  const [messageCount, setMessageCount] = useState(0);
  const [daysAsMember, setDaysAsMember] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setMessageCount(count ?? 0);

      const joined = new Date(user.created_at);
      const days = Math.floor((Date.now() - joined.getTime()) / 86_400_000);
      setDaysAsMember(days);

      setLoading(false);

      const runs: RunRecord[] = JSON.parse(localStorage.getItem("flowboard_runs") || "[]");
      setRecentRuns(runs.slice(0, 5));
    }
    init();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function copyPrompt(prompt: string) {
    navigator.clipboard.writeText(prompt);
    setCopied(prompt);
    setTimeout(() => setCopied(null), 1500);
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>;
  }

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="dash-page">
      <header className="dash-nav">
        <span className="dash-nav-logo">
          <Image src="/logo.svg" alt="FlowBoard" width={32} height={32} />
          FlowBoard
        </span>
        <nav className="dash-nav-links">
          <span className="dash-nav-link active">Dashboard</span>
          <a href="/connect" className="dash-nav-link">Connect Apps</a>
          <a href="/connected" className="dash-nav-link">Workflow Builder</a>
          <a href="/" className="dash-nav-link">Home</a>
        </nav>
        <button className="dash-signout" onClick={handleSignOut}>Sign Out</button>
      </header>

      <main className="dash-main">

        {/* Welcome + stats */}
        <div className="dash-top-row">
          <div className="dash-welcome">
            <h1>{greeting()}, <span>{user?.email?.split("@")[0]}</span> 👋</h1>
            <p>Member since {joinedDate}</p>
          </div>
          <div className="dash-mini-stats">
            <div className="dash-mini-stat">
              <span className="dash-mini-val">{daysAsMember}</span>
              <span className="dash-mini-label">Days with FlowBoard</span>
            </div>
            <div className="dash-mini-stat">
              <span className="dash-mini-val">{APPS.length}</span>
              <span className="dash-mini-label">Apps available</span>
            </div>
            <div className="dash-mini-stat">
              <span className="dash-mini-val">{messageCount}</span>
              <span className="dash-mini-label">AI messages sent</span>
            </div>
          </div>
        </div>

        {/* Connect Apps CTA */}
        <section className="dash-card dash-connect-cta">
          <div className="dash-connect-cta-inner">
            <div>
              <h2 className="dash-card-title" style={{ marginBottom: "0.3rem" }}>Connect Your Apps</h2>
              <p className="dash-card-sub" style={{ margin: 0 }}>Sign in to Gmail, Slack, Notion and more so the AI assistant can take real actions on your behalf.</p>
            </div>
            <a href="/connect" className="dash-action-btn primary" style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
              🔗 Connect Apps
            </a>
          </div>
        </section>

        {/* How to build a workflow */}
        <section className="dash-card dash-guide">
          <h2 className="dash-card-title">How to Build a Workflow</h2>
          <p className="dash-card-sub">
            Open the <a href="/connected">Workflow Builder</a> and follow these three steps.
          </p>
          <div className="dash-steps">
            {STEPS.map((s) => (
              <div key={s.number} className="dash-step" style={{ borderTopColor: s.color }}>
                <div className="dash-step-num" style={{ background: s.color }}>{s.number}</div>
                <div className="dash-step-icon">{s.icon}</div>
                <h3 className="dash-step-title">{s.title}</h3>
                <p className="dash-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
          <a href="/connected" className="dash-action-btn primary" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
            ⚡ Open Workflow Builder
          </a>
        </section>

        <div className="dash-bottom">
          {/* Apps */}
          <section className="dash-card">
            <h2 className="dash-card-title">Supported Apps</h2>
            <p className="dash-card-sub">Drag these from the left panel in the Workflow Builder.</p>
            <div className="dash-apps-grid2">
              {APPS.map((app) => (
                <div key={app.key} className="dash-app2" style={{ borderColor: app.color + "55" }}>
                  <span style={{ fontSize: "1.3rem" }}>{app.icon}</span>
                  <span className="dash-app2-label">{app.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* AI prompt ideas */}
          <section className="dash-card">
            <h2 className="dash-card-title">Ask the AI Assistant</h2>
            <p className="dash-card-sub">
              Open the <a href="/connected">Workflow Builder</a>, then copy a prompt below and paste it into the AI chat.
            </p>
            <div className="dash-prompts">
              {AI_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="dash-prompt-btn"
                  onClick={() => copyPrompt(p)}
                >
                  <span className="dash-prompt-text">{p}</span>
                  <span className="dash-prompt-copy">
                    {copied === p ? "✓ Copied" : "Copy"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Recent workflow runs */}
        <section className="dash-card dash-runs">
          <h2 className="dash-card-title">Recent Workflow Runs</h2>
          <p className="dash-card-sub">
            Results from your last runs in the <a href="/connected">Workflow Builder</a>.
          </p>
          {recentRuns.length === 0 ? (
            <div className="dash-runs-empty">
              <span>No runs yet.</span>
              <a href="/connected" className="dash-action-btn primary" style={{ display: "inline-flex", marginTop: "0.75rem" }}>
                ▶ Run your first workflow
              </a>
            </div>
          ) : (
            <div className="dash-runs-list">
              {recentRuns.map((run) => (
                <div key={run.id} className="dash-run-item">
                  <div className="dash-run-meta">
                    <span className="dash-run-nodes">{run.nodes.join(" → ")}</span>
                    <span className="dash-run-ts">
                      {new Date(run.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <pre className="dash-run-result">{run.result}</pre>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="dash-footer">
        <p>© 2026 FlowBoard · <a href="/docs">Documentation</a> · <a href="/">Home</a></p>
      </footer>
    </div>
  );
}
