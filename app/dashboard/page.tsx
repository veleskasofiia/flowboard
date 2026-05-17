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
const SUMMARY_TTL_MS = 5 * 60 * 1000;

const CONNECTABLE_APPS = [
  { key: "gmail",          label: "Gmail",            icon: "📧", color: "#ea4335", composioApp: "gmail" },
  { key: "googlecalendar", label: "Google Calendar",  icon: "📅", color: "#4285f4", composioApp: "googlecalendar" },
  { key: "outlook",        label: "Outlook",          icon: "📨", color: "#0078d4", composioApp: "outlook" },
  { key: "slack",          label: "Slack",            icon: "💬", color: "#36c5f0", composioApp: "slack" },
  { key: "notion",         label: "Notion",           icon: "📓", color: "#374151", composioApp: "notion" },
  { key: "googledrive",    label: "Google Drive",     icon: "📁", color: "#34a853", composioApp: "googledrive" },
  { key: "todoist",        label: "Todoist",          icon: "✅", color: "#db4035", composioApp: "todoist" },
  { key: "discord",        label: "Discord",          icon: "🎮", color: "#5865f2", composioApp: "discord" },
  { key: "seznammail",     label: "Seznam Mail",      icon: "✉️", color: "#cc0000", composioApp: "seznammail" },
  { key: "seznamcal",      label: "Seznam Calendar",  icon: "📋", color: "#cc0000", composioApp: "seznamcal" },
];

const AI_PROMPTS = [
  "How do I connect Gmail to Slack?",
  "How do I use the IF Condition node?",
  "Set up a daily schedule that sends a Notion reminder",
  "What's the difference between Webhook and Schedule?",
  "How do I connect Outlook Calendar to Google Calendar?",
  "Create a workflow that filters emails by subject",
];

type ExampleNode = { id: string; type: string; position: { x: number; y: number }; data: { label: string; icon: string; color: string; category: "trigger" | "action" } };
type ExampleEdge = { id: string; source: string; target: string; type: string; animated: boolean; style: { stroke: string; strokeWidth: number } };

const EXAMPLE_WORKFLOWS = [
  {
    id: "email-digest",
    title: "Daily Email Digest to Slack",
    description: "Every morning, fetch unread Gmail threads, filter important ones, and post a summary to your Slack channel.",
    tags: ["Gmail", "IF Condition", "Slack", "Notion"],
    color: "#6366f1",
    steps: [
      { icon: "⏰", label: "Schedule", desc: "Runs every day at 8 AM" },
      { icon: "📧", label: "Gmail", desc: "Fetch unread inbox threads" },
      { icon: "🔀", label: "IF Condition", desc: "Is it marked important?" },
      { icon: "💬", label: "Slack", desc: "Post digest to #daily-inbox" },
      { icon: "📓", label: "Notion", desc: "Log all others to a database" },
    ],
    nodes: [
      { id: "1", type: "appNode", position: { x: 60,  y: 160 }, data: { label: "Schedule",    icon: "⏰", color: "#8b5cf6", category: "trigger" as const } },
      { id: "2", type: "appNode", position: { x: 300, y: 160 }, data: { label: "Gmail",        icon: "📧", color: "#ea4335", category: "action"  as const } },
      { id: "3", type: "appNode", position: { x: 540, y: 160 }, data: { label: "IF Condition", icon: "🔀", color: "#6b7280", category: "action"  as const } },
      { id: "4", type: "appNode", position: { x: 760, y: 60  }, data: { label: "Slack",        icon: "💬", color: "#36c5f0", category: "action"  as const } },
      { id: "5", type: "appNode", position: { x: 760, y: 280 }, data: { label: "Notion",       icon: "📓", color: "#374151", category: "action"  as const } },
    ] as ExampleNode[],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#36c5f0", strokeWidth: 2 } },
      { id: "e3-5", source: "3", target: "5", type: "smoothstep", animated: true, style: { stroke: "#374151", strokeWidth: 2 } },
    ] as ExampleEdge[],
  },
  {
    id: "meeting-prep",
    title: "Automatic Meeting Prep Notes",
    description: "Before each meeting, pull calendar details, search related emails, and create a Notion prep page automatically.",
    tags: ["Schedule", "Google Calendar", "Gmail", "Notion"],
    color: "#0ea5e9",
    steps: [
      { icon: "⏰", label: "Schedule", desc: "Runs every morning at 7 AM" },
      { icon: "📅", label: "Google Calendar", desc: "Get today's meetings" },
      { icon: "📧", label: "Gmail", desc: "Find related email threads" },
      { icon: "📓", label: "Notion", desc: "Create a prep page per meeting" },
    ],
    nodes: [
      { id: "1", type: "appNode", position: { x: 60,  y: 180 }, data: { label: "Schedule",       icon: "⏰", color: "#8b5cf6", category: "trigger" as const } },
      { id: "2", type: "appNode", position: { x: 300, y: 180 }, data: { label: "Google Calendar", icon: "📅", color: "#4285f4", category: "action"  as const } },
      { id: "3", type: "appNode", position: { x: 540, y: 180 }, data: { label: "Gmail",           icon: "📧", color: "#ea4335", category: "action"  as const } },
      { id: "4", type: "appNode", position: { x: 780, y: 180 }, data: { label: "Notion",          icon: "📓", color: "#374151", category: "action"  as const } },
    ] as ExampleNode[],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
    ] as ExampleEdge[],
  },
  {
    id: "client-followup",
    title: "Weekly Client Follow-up System",
    description: "Every Friday, check overdue Todoist tasks, send follow-up emails via Outlook, and notify your team on Slack.",
    tags: ["Schedule", "Todoist", "IF Condition", "Outlook", "Slack"],
    color: "#f59e0b",
    steps: [
      { icon: "⏰", label: "Schedule", desc: "Runs every Friday at 4 PM" },
      { icon: "✅", label: "Todoist", desc: "Get overdue tasks" },
      { icon: "🔀", label: "IF Condition", desc: "Is the task a client task?" },
      { icon: "📨", label: "Outlook Mail", desc: "Send follow-up email to client" },
      { icon: "💬", label: "Slack", desc: "Notify team in #clients" },
    ],
    nodes: [
      { id: "1", type: "appNode", position: { x: 60,  y: 160 }, data: { label: "Schedule",    icon: "⏰", color: "#8b5cf6", category: "trigger" as const } },
      { id: "2", type: "appNode", position: { x: 300, y: 160 }, data: { label: "Todoist",      icon: "✅", color: "#db4035", category: "action"  as const } },
      { id: "3", type: "appNode", position: { x: 540, y: 160 }, data: { label: "IF Condition", icon: "🔀", color: "#6b7280", category: "action"  as const } },
      { id: "4", type: "appNode", position: { x: 760, y: 60  }, data: { label: "Outlook Mail", icon: "📨", color: "#0078d4", category: "action"  as const } },
      { id: "5", type: "appNode", position: { x: 760, y: 280 }, data: { label: "Slack",        icon: "💬", color: "#36c5f0", category: "action"  as const } },
    ] as ExampleNode[],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e2-3", source: "2", target: "3", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
      { id: "e3-4", source: "3", target: "4", type: "smoothstep", animated: true, style: { stroke: "#0078d4", strokeWidth: 2 } },
      { id: "e3-5", source: "3", target: "5", type: "smoothstep", animated: true, style: { stroke: "#36c5f0", strokeWidth: 2 } },
    ] as ExampleEdge[],
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type Connection = { id: string; appName: string; status: string };

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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingApp, setConnectingApp] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

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
      fetchConnections(user.id);

      const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < SUMMARY_TTL_MS) { setSummary(data); return; }
      }
      fetchSummary(user.id);
    }
    init();
  }, [router]);

  async function fetchConnections(entityId: string) {
    try {
      const res = await fetch(`/api/connect?entityId=${encodeURIComponent(entityId)}`);
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch { setConnections([]); }
  }

  async function handleConnect(composioApp: string) {
    if (!user) return;
    setConnectingApp(composioApp);
    try {
      const callbackUrl = `${window.location.origin}/connect/callback?app=${composioApp}`;
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName: composioApp, entityId: user.id, callbackUrl }),
      });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch { /* ignore */ }
    setConnectingApp(null);
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnectingId(connectionId);
    try {
      await fetch("/api/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (user) fetchConnections(user.id);
    } catch { /* ignore */ }
    setDisconnectingId(null);
  }

  function getConnection(composioApp: string) {
    return connections.find(
      (c) => c.appName?.toLowerCase() === composioApp.toLowerCase() && c.status !== "FAILED"
    ) ?? null;
  }

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

  function loadWorkflow(wf: typeof EXAMPLE_WORKFLOWS[0]) {
    localStorage.setItem("flowboard_canvas", JSON.stringify({ nodes: wf.nodes, edges: wf.edges }));
    router.push("/workflow");
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>;
  }

  return (
    <div className="dash-page">
      <NavBar onSignOut={handleSignOut} />

      <main className="dash-main">

        {/* Greeting */}
        <div className="dash-greeting-row">
          <div>
            <h1 className="dash-greeting-title">
              {greeting()}, <span>{user?.email?.split("@")[0]}</span>!
            </h1>
            <p className="dash-greeting-sub">Here&apos;s what&apos;s happening with your apps today.</p>
          </div>
          <button
            className="dash-refresh-btn"
            onClick={() => user && fetchSummary(user.id)}
            disabled={summaryLoading}
          >
            {summaryLoading ? "Loading…" : "↺ Refresh"}
          </button>
        </div>

        {/* 4 stat cards */}
        <div className="dash-stats-row">
          <div className="dash-stat-card" style={{ borderTopColor: "#4285f4" }}>
            <span className="dash-stat-label">Meetings this week</span>
            <span className="dash-stat-value">
              {summaryLoading ? "…" : summary?.meetings_count ?? "—"}
            </span>
            {summary?.next_meeting
              ? <span className="dash-stat-sub">Next: {summary.next_meeting.title}</span>
              : !summaryLoading && <a href="/connect" className="dash-stat-connect">Connect calendar →</a>}
          </div>
          <div className="dash-stat-card" style={{ borderTopColor: "#ea4335" }}>
            <span className="dash-stat-label">Unread Gmail</span>
            <span className="dash-stat-value">
              {summaryLoading ? "…" : summary?.gmail_unread != null
                ? `${summary.gmail_unread}${summary.gmail_has_more ? "+" : ""}`
                : "—"}
            </span>
            {!summaryLoading && summary?.gmail_unread == null && (
              <a href="/connect" className="dash-stat-connect">Connect Gmail →</a>
            )}
          </div>
          <div className="dash-stat-card" style={{ borderTopColor: "#0078d4" }}>
            <span className="dash-stat-label">Unread Outlook</span>
            <span className="dash-stat-value">
              {summaryLoading ? "…" : summary?.outlook_unread ?? "—"}
            </span>
            {!summaryLoading && summary?.outlook_unread == null && (
              <a href="/connect" className="dash-stat-connect">Connect Outlook →</a>
            )}
          </div>
          <div className="dash-stat-card" style={{ borderTopColor: "#8b5cf6" }}>
            <span className="dash-stat-label">AI Messages</span>
            <span className="dash-stat-value">{messageCount}</span>
            <span className="dash-stat-sub">{daysAsMember} days with FlowBoard</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="dash-content-grid">

          {/* Left: meetings + recent runs */}
          <div className="dash-content-left">

            <section className="dash-card">
              <h2 className="dash-card-title">This Week&apos;s Meetings</h2>
              {summary?.meetings && summary.meetings.length > 0 ? (
                <div className="dash-schedule-list">
                  {summary.meetings.slice(0, 6).map((m, i) => (
                    <div key={i} className="dash-schedule-row">
                      <div className="dash-schedule-time">
                        <span>{new Date(m.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                        <span>{new Date(m.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="dash-schedule-event" style={{ borderLeftColor: m.source === "google" ? "#4285f4" : "#0078d4" }}>
                        <span className="dash-schedule-title">{m.title}</span>
                        <span className="dash-schedule-src">{m.source === "google" ? "Google Calendar" : "Outlook"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dash-empty-state">
                  {summaryLoading
                    ? <span>Loading meetings…</span>
                    : <span>No meetings this week. <a href="/connect">Connect a calendar →</a></span>}
                </div>
              )}
            </section>

            <section className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title" style={{ margin: 0 }}>Recent Workflow Runs</h2>
                <a href="/workflow" className="dash-card-link">Open Builder →</a>
              </div>
              {recentRuns.length === 0 ? (
                <div className="dash-empty-state">
                  <span>No runs yet. <a href="/workflow">Run your first workflow →</a></span>
                </div>
              ) : (
                <div className="dash-runs-list" style={{ marginTop: "0.75rem" }}>
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

          </div>

          {/* Right: connected apps */}
          <div className="dash-content-right">
            <section className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title" style={{ margin: 0 }}>Your Connected Apps</h2>
              </div>
              <p className="dash-card-sub">Connect apps so the AI and workflows can act on your real accounts.</p>
              <div className="dash-conn-grid">
                {CONNECTABLE_APPS.map((app) => {
                  const conn = getConnection(app.composioApp);
                  const isConn = !!conn;
                  const isConnecting = connectingApp === app.composioApp;
                  const isDisconn = disconnectingId === conn?.id;
                  return (
                    <div key={app.key} className="dash-conn-card" style={{ borderColor: isConn ? app.color + "55" : "#e2e8f0" }}>
                      <div className="dash-conn-card-top">
                        <span className="dash-conn-icon">{app.icon}</span>
                        <div>
                          <div className="dash-conn-label">{app.label}</div>
                          <div className={`dash-conn-status ${isConn ? "connected" : ""}`}>
                            {isConn ? "✓ Connected" : "Not connected"}
                          </div>
                        </div>
                      </div>
                      {isConn ? (
                        <button
                          className="dash-conn-btn disconnect"
                          onClick={() => conn && handleDisconnect(conn.id)}
                          disabled={isDisconn}
                        >
                          {isDisconn ? "Removing…" : "Disconnect"}
                        </button>
                      ) : (
                        <button
                          className="dash-conn-btn connect"
                          style={{ background: app.color }}
                          onClick={() => handleConnect(app.composioApp)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? "Redirecting…" : "Connect"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

        </div>

        {/* Example Workflows as project cards */}
        <section className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title" style={{ margin: 0 }}>Example Workflows</h2>
            <a href="/workflow" className="dash-card-link">Open Builder →</a>
          </div>
          <p className="dash-card-sub" style={{ marginTop: "0.25rem" }}>Click Load to open any example directly in the Workflow Builder.</p>
          <div className="dash-projects-grid">
            {EXAMPLE_WORKFLOWS.map((wf) => (
              <div key={wf.id} className="dash-project-card" style={{ borderTopColor: wf.color }}>
                <div className="dash-project-icon" style={{ background: wf.color + "22", color: wf.color }}>
                  {wf.steps[0]?.icon}
                </div>
                <div className="dash-project-info">
                  <h3 className="dash-project-title">{wf.title}</h3>
                  <p className="dash-project-desc">{wf.description}</p>
                  <div className="dash-project-tags">
                    {wf.tags.map((tag) => (
                      <span key={tag} className="dash-project-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="dash-project-load"
                  style={{ background: wf.color }}
                  onClick={() => loadWorkflow(wf)}
                >
                  ⚡ Load
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AI prompt ideas */}
        <section className="dash-card">
          <h2 className="dash-card-title">Ask the AI Assistant</h2>
          <p className="dash-card-sub">
            Open the <a href="/workflow">Workflow Builder</a>, then copy a prompt and paste it into the AI chat.
          </p>
          <div className="dash-prompts">
            {AI_PROMPTS.map((p) => (
              <button key={p} className="dash-prompt-btn" onClick={() => copyPrompt(p)}>
                <span className="dash-prompt-text">{p}</span>
                <span className="dash-prompt-copy">{copied === p ? "✓ Copied" : "Copy"}</span>
              </button>
            ))}
          </div>
        </section>

      </main>

      <footer className="dash-footer">
        <p>© 2026 FlowBoard · <a href="/docs">Documentation</a> · <a href="/">Home</a></p>
      </footer>
    </div>
  );
}
