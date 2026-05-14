"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import NavBar from "@/components/NavBar";

type RunRecord = { id: number; result: string; nodes: string[]; ts: string };

type Meeting = { title: string; start: string; source: string };
type Summary = {
  meetings_count: number | null;
  meetings: Meeting[];
  next_meeting: Meeting | null;
  gmail_unread: number | null;
  gmail_has_more: boolean;
  outlook_unread: number | null;
  connected: string[];
  error?: string;
};

const SUMMARY_CACHE_KEY = "flowboard_summary";
const SUMMARY_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

      // Load summary — use cache if fresh, else fetch
      const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < SUMMARY_TTL_MS) { setSummary(data); return; }
      }
      fetchSummary(user.id);
    }
    init();
  }, [router]);

  async function fetchSummary(entityId: string) {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId }),
      });
      const data: Summary = await res.json();
      setSummary(data);
      localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      setSummary({ meetings_count: null, meetings: [], next_meeting: null, gmail_unread: null, gmail_has_more: false, outlook_unread: null, connected: [], error: "failed" });
    }
    setSummaryLoading(false);
  }

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
      <NavBar onSignOut={handleSignOut} />

      <main className="dash-main">

        {/* Welcome */}
        <div className="dash-top-row">
          <div className="dash-welcome">
            <h1>{greeting()}, <span>{user?.email?.split("@")[0]}</span> 👋</h1>
            <p>Member since {joinedDate} · {daysAsMember} days with FlowBoard · {messageCount} AI messages</p>
          </div>
        </div>

        {/* Your Week — real data from connected apps */}
        <section className="dash-card dash-week">
          <div className="dash-week-header">
            <h2 className="dash-card-title" style={{ margin: 0 }}>Your Week at a Glance</h2>
            <button
              className="dash-week-refresh"
              onClick={() => user && fetchSummary(user.id)}
              disabled={summaryLoading}
            >
              {summaryLoading ? "Loading…" : "↺ Refresh"}
            </button>
          </div>

          {summaryLoading && !summary && (
            <div className="dash-week-loading">
              <div className="dash-spinner" style={{ width: 28, height: 28 }} />
              <span>Fetching your meetings and emails…</span>
            </div>
          )}

          {!summaryLoading && !summary && (
            <div className="dash-how-to">
              <p className="dash-how-to-title">To see your real meetings and emails here:</p>
              <ol className="dash-how-to-steps">
                <li>Go to <a href="/connect"><strong>Connect Apps</strong></a> in the top navigation.</li>
                <li>Click <strong>Connect Gmail</strong> and sign in with your Google account.</li>
                <li>Click <strong>Connect Outlook Mail</strong> and sign in with your Microsoft account.</li>
                <li>Click <strong>Connect Google Calendar</strong> and/or <strong>Connect Outlook Mail</strong> (Outlook Calendar is included automatically).</li>
                <li>Come back here and click <strong>↺ Refresh</strong>.</li>
              </ol>
              <a href="/connect" className="dash-action-btn primary" style={{ display: "inline-flex", marginTop: "0.75rem" }}>🔗 Go to Connect Apps</a>
            </div>
          )}

          {summary && !summary.error && (
            <>
              <div className="dash-week-stats">
                {/* Meetings this week */}
                <div className="dash-week-stat" style={{ borderColor: "#4285f4" }}>
                  <span className="dash-week-icon">📅</span>
                  <span className="dash-week-val">
                    {summary.meetings_count !== null ? summary.meetings_count : "—"}
                  </span>
                  <span className="dash-week-label">meetings this week</span>
                  {summary.next_meeting && (
                    <span className="dash-week-sub">
                      Next: {summary.next_meeting.title}<br />
                      {new Date(summary.next_meeting.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                      {new Date(summary.next_meeting.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Gmail unread */}
                <div className="dash-week-stat" style={{ borderColor: "#ea4335" }}>
                  <span className="dash-week-icon">📧</span>
                  <span className="dash-week-val">
                    {summary.gmail_unread !== null
                      ? `${summary.gmail_unread}${summary.gmail_has_more ? "+" : ""}`
                      : "—"}
                  </span>
                  <span className="dash-week-label">unread Gmail</span>
                  {summary.gmail_unread === null && (
                    <a href="/connect" className="dash-week-connect">Connect Gmail →</a>
                  )}
                </div>

                {/* Outlook unread */}
                <div className="dash-week-stat" style={{ borderColor: "#0078d4" }}>
                  <span className="dash-week-icon">📨</span>
                  <span className="dash-week-val">
                    {summary.outlook_unread !== null ? summary.outlook_unread : "—"}
                  </span>
                  <span className="dash-week-label">unread Outlook</span>
                  {summary.outlook_unread === null && (
                    <a href="/connect" className="dash-week-connect">Connect Outlook →</a>
                  )}
                </div>
              </div>

              {/* Meeting list */}
              {summary.meetings.length > 0 && (
                <div className="dash-meeting-list">
                  <p className="dash-meeting-list-title">This week&apos;s meetings</p>
                  {summary.meetings.slice(0, 8).map((m, i) => (
                    <div key={i} className="dash-meeting-row">
                      <span className="dash-meeting-src">{m.source === "google" ? "📅" : "📆"}</span>
                      <span className="dash-meeting-title">{m.title}</span>
                      <span className="dash-meeting-time">
                        {new Date(m.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                        {new Date(m.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {summary.meetings_count === null && summary.gmail_unread === null && summary.outlook_unread === null && (
                <div className="dash-how-to" style={{ marginTop: "0.75rem" }}>
                  <p className="dash-how-to-title">No apps connected yet. Here&apos;s how to fix that:</p>
                  <ol className="dash-how-to-steps">
                    <li>Go to <a href="/connect"><strong>Connect Apps</strong></a> in the navigation bar.</li>
                    <li>Click <strong>Connect Gmail</strong> → sign in with Google → come back.</li>
                    <li>Click <strong>Connect Outlook Mail</strong> → sign in with Microsoft → come back.</li>
                    <li>Click <strong>Connect Google Calendar</strong> if you use it.</li>
                    <li>Click <strong>↺ Refresh</strong> on this card.</li>
                  </ol>
                  <a href="/connect" className="dash-action-btn primary" style={{ display: "inline-flex", marginTop: "0.75rem" }}>🔗 Connect Apps</a>
                </div>
              )}
            </>
          )}

          {summary?.error && (
            <div className="dash-week-empty">
              <p>Could not load your data. <button className="dash-week-retry" onClick={() => user && fetchSummary(user.id)}>Try again</button></p>
            </div>
          )}
        </section>

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
            Open the <a href="/workflow">Workflow Builder</a> and follow these three steps.
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
          <a href="/workflow" className="dash-action-btn primary" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
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
              Open the <a href="/workflow">Workflow Builder</a>, then copy a prompt below and paste it into the AI chat.
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
            Results from your last runs in the <a href="/workflow">Workflow Builder</a>.
          </p>
          {recentRuns.length === 0 ? (
            <div className="dash-runs-empty">
              <span>No runs yet.</span>
              <a href="/workflow" className="dash-action-btn primary" style={{ display: "inline-flex", marginTop: "0.75rem" }}>
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
