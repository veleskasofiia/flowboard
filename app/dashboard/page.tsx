"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import NavBar from "@/components/NavBar";

type RunRecord = { id: number; result: string; nodes: string[]; ts: string };
type EmailItem = { id: string; subject: string; from: string; snippet: string; date: string; source: "gmail" | "outlook"; isRead: boolean };

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
  { key: "todoist",      label: "Todoist",          icon: "✅", color: "#db4035" },
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
      { id: "1", type: "appNode", position: { x: 60,  y: 160 }, data: { label: "Schedule",     icon: "⏰", color: "#8b5cf6", category: "trigger" } },
      { id: "2", type: "appNode", position: { x: 300, y: 160 }, data: { label: "Gmail",         icon: "📧", color: "#ea4335", category: "action"  } },
      { id: "3", type: "appNode", position: { x: 540, y: 160 }, data: { label: "IF Condition",  icon: "🔀", color: "#6b7280", category: "action"  } },
      { id: "4", type: "appNode", position: { x: 760, y: 60  }, data: { label: "Slack",         icon: "💬", color: "#36c5f0", category: "action"  } },
      { id: "5", type: "appNode", position: { x: 760, y: 280 }, data: { label: "Notion",        icon: "📓", color: "#374151", category: "action"  } },
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
      { id: "1", type: "appNode", position: { x: 60,  y: 180 }, data: { label: "Schedule",        icon: "⏰", color: "#8b5cf6", category: "trigger" } },
      { id: "2", type: "appNode", position: { x: 300, y: 180 }, data: { label: "Google Calendar",  icon: "📅", color: "#4285f4", category: "action"  } },
      { id: "3", type: "appNode", position: { x: 540, y: 180 }, data: { label: "Gmail",            icon: "📧", color: "#ea4335", category: "action"  } },
      { id: "4", type: "appNode", position: { x: 780, y: 180 }, data: { label: "Notion",           icon: "📓", color: "#374151", category: "action"  } },
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
      { id: "1", type: "appNode", position: { x: 60,  y: 160 }, data: { label: "Schedule",    icon: "⏰", color: "#8b5cf6", category: "trigger" } },
      { id: "2", type: "appNode", position: { x: 300, y: 160 }, data: { label: "Todoist",      icon: "✅", color: "#db4035", category: "action"  } },
      { id: "3", type: "appNode", position: { x: 540, y: 160 }, data: { label: "IF Condition", icon: "🔀", color: "#6b7280", category: "action"  } },
      { id: "4", type: "appNode", position: { x: 760, y: 60  }, data: { label: "Outlook Mail", icon: "📨", color: "#0078d4", category: "action"  } },
      { id: "5", type: "appNode", position: { x: 760, y: 280 }, data: { label: "Slack",        icon: "💬", color: "#36c5f0", category: "action"  } },
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

const CONNECTABLE_APPS = [
  { key: "gmail",          label: "Gmail",            icon: "📧", color: "#ea4335", composioApp: "gmail" },
  { key: "googlecalendar", label: "Google Calendar",  icon: "📅", color: "#4285f4", composioApp: "googlecalendar" },
  { key: "outlook",        label: "Outlook",          icon: "📨", color: "#0078d4", composioApp: "outlook" },
  { key: "slack",          label: "Slack",            icon: "💬", color: "#36c5f0", composioApp: "slack" },
  { key: "notion",         label: "Notion",           icon: "📓", color: "#374151", composioApp: "notion" },
  { key: "googledrive",    label: "Google Drive",     icon: "📁", color: "#34a853", composioApp: "googledrive" },
  { key: "todoist",        label: "Todoist",          icon: "✅", color: "#db4035", composioApp: "todoist" },
  { key: "discord",        label: "Discord",          icon: "🎮", color: "#5865f2", composioApp: "discord" },
];

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
  const [emails, setEmails] = useState<EmailItem[] | null>(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailTab, setEmailTab] = useState<"all" | "gmail" | "outlook">("all");
  const [emailSources, setEmailSources] = useState<{ gmail: boolean; outlook: boolean }>({ gmail: false, outlook: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      fetchEmails(user.id);

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

  async function fetchEmails(entityId: string) {
    setEmailsLoading(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId }),
      });
      const data = await res.json();
      setEmails(data.emails ?? []);
      if (data.sources) setEmailSources(data.sources);
    } catch {
      setEmails([]);
    }
    setEmailsLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.error) { setDeleteError(data.error); setDeleting(false); return; }
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleting(false);
    }
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

        {/* Inbox */}
        <section className="dash-card">
          <div className="dash-inbox-header">
            <h2 className="dash-card-title" style={{ margin: 0 }}>Inbox</h2>
            <div className="dash-inbox-tabs">
              {(["all", "gmail", "outlook"] as const).map((t) => (
                <button
                  key={t}
                  className={`dash-inbox-tab${emailTab === t ? " active" : ""}`}
                  onClick={() => setEmailTab(t)}
                >
                  {t === "all" ? "All" : t === "gmail" ? "📧 Gmail" : "📨 Outlook"}
                </button>
              ))}
            </div>
            <button
              className="dash-week-refresh"
              onClick={() => user && fetchEmails(user.id)}
              disabled={emailsLoading}
            >
              {emailsLoading ? "Loading…" : "↺ Refresh"}
            </button>
          </div>

          {emailsLoading && !emails && (
            <div className="dash-week-loading">
              <div className="dash-spinner" style={{ width: 24, height: 24 }} />
              <span>Fetching your emails…</span>
            </div>
          )}

          {!emailsLoading && emails !== null && (() => {
            const filtered = emailTab === "all" ? emails : emails.filter((e) => e.source === emailTab);
            if (filtered.length === 0) return (
              <div className="dash-inbox-empty">
                {emailTab !== "all" && emails.length > 0
                  ? <span>No {emailTab === "gmail" ? "Gmail" : "Outlook"} emails to show.</span>
                  : !emailSources.gmail && !emailSources.outlook
                  ? <span>No connected mail apps. <a href="/connect">Connect Gmail or Outlook →</a></span>
                  : <span>Your inbox is empty.</span>}
              </div>
            );
            return (
              <div className="dash-inbox-list">
                {filtered.map((email) => (
                  <div key={email.id} className={`dash-inbox-row${email.isRead ? " read" : ""}`}>
                    <span className="dash-inbox-src">{email.source === "gmail" ? "📧" : "📨"}</span>
                    <div className="dash-inbox-body">
                      <div className="dash-inbox-top">
                        <span className="dash-inbox-from">{email.from.replace(/<.*>/, "").trim() || email.from}</span>
                        <span className="dash-inbox-date">
                          {email.date ? new Date(email.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                        </span>
                      </div>
                      <div className="dash-inbox-subject">{email.subject}</div>
                      <div className="dash-inbox-snippet">{email.snippet}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {!emailsLoading && emails === null && (
            <div className="dash-inbox-empty">
              <span>Connect Gmail or Outlook to see your inbox. <a href="/connect">Go to Connect Apps →</a></span>
            </div>
          )}
        </section>

        {/* Connected Apps — link / unlink */}
        <section className="dash-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <h2 className="dash-card-title" style={{ marginBottom: "0.15rem" }}>Your Connected Apps</h2>
              <p className="dash-card-sub" style={{ margin: 0 }}>Connect apps so the AI and workflows can act on your real accounts.</p>
            </div>
          </div>
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

        {/* Example Workflows */}
        <section className="dash-card">
          <h2 className="dash-card-title">Example Workflows</h2>
          <p className="dash-card-sub">Click <strong>Load</strong> to open any example directly in the Workflow Builder.</p>
          <div className="dash-examples">
            {EXAMPLE_WORKFLOWS.map((wf) => (
              <div key={wf.id} className="dash-example" style={{ borderTopColor: wf.color }}>
                <div className="dash-example-header">
                  <div>
                    <h3 className="dash-example-title">{wf.title}</h3>
                    <p className="dash-example-desc">{wf.description}</p>
                  </div>
                  <button className="dash-example-btn" style={{ background: wf.color }} onClick={() => loadWorkflow(wf)}>
                    ⚡ Load
                  </button>
                </div>
                <div className="dash-example-flow">
                  {wf.steps.map((step, i) => (
                    <div key={i} className="dash-example-flow-row">
                      <div className="dash-example-node">
                        <span className="dash-example-node-icon">{step.icon}</span>
                        <div>
                          <div className="dash-example-node-label">{step.label}</div>
                          <div className="dash-example-node-desc">{step.desc}</div>
                        </div>
                      </div>
                      {i < wf.steps.length - 1 && <span className="dash-example-arrow">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

        {/* Danger Zone */}
        <section className="dash-card dash-danger-zone">
          <h2 className="dash-card-title" style={{ color: "#dc2626" }}>Danger Zone</h2>
          <p className="dash-card-sub">Permanently delete your account and all associated data. This cannot be undone.</p>
          {deleteError && <p className="dash-danger-error">{deleteError}</p>}
          <button className="dash-danger-btn" onClick={() => setShowDeleteConfirm(true)}>
            Delete My Account
          </button>
        </section>

      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            <h3 className="dash-modal-title">Delete your account?</h3>
            <p className="dash-modal-body">
              This will permanently delete your FlowBoard account, all your messages, and workflow data. <strong>This cannot be undone.</strong>
            </p>
            {deleteError && <p className="dash-danger-error">{deleteError}</p>}
            <div className="dash-modal-actions">
              <button className="dash-modal-cancel" onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }} disabled={deleting}>
                Cancel
              </button>
              <button className="dash-modal-confirm" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="dash-footer">
        <p>© 2026 FlowBoard · <a href="/docs">Documentation</a> · <a href="/">Home</a></p>
      </footer>
    </div>
  );
}
