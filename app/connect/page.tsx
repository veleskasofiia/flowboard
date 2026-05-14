"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import NavBar from "@/components/NavBar";

const APPS = [
  { key: "gmail",          label: "Gmail",            icon: "📧", color: "#ea4335", composioApp: "gmail" },
  { key: "outlook",        label: "Outlook Mail",     icon: "📨", color: "#0078d4", composioApp: "outlook",         note: "Also connects Outlook Calendar" },
  { key: "ocal",           label: "Outlook Calendar", icon: "📆", color: "#0f6cbd", composioApp: null,              note: "Included when you connect Outlook Mail" },
  { key: "googlecalendar", label: "Google Calendar",  icon: "📅", color: "#4285f4", composioApp: "googlecalendar" },
  { key: "ical",           label: "iCal",             icon: "🗓️", color: "#007aff", composioApp: null,              note: "OAuth not supported — use Google Calendar or Outlook" },
  { key: "googledrive",    label: "Google Drive",     icon: "📁", color: "#34a853", composioApp: "googledrive" },
  { key: "slack",          label: "Slack",            icon: "💬", color: "#36c5f0", composioApp: "slack" },
  { key: "discord",        label: "Discord",          icon: "🎮", color: "#5865f2", composioApp: "discord" },
  { key: "notion",         label: "Notion",           icon: "📓", color: "#374151", composioApp: "notion" },
  { key: "todoist",        label: "Todoist",          icon: "✅", color: "#db4035", composioApp: "todoist" },
];

type ConnectedApp = { appName: string; status: string };

export default function ConnectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectedApp[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      setUser(user);
      fetchConnections(user.id);
    });
  }, [router]);

  async function fetchConnections(entityId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/connect?entityId=${encodeURIComponent(entityId)}`);
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      setConnections([]);
    }
    setLoading(false);
  }

  async function handleConnect(composioApp: string) {
    if (!user) return;
    setConnecting(composioApp);
    setError(null);
    try {
      const callbackUrl = `${window.location.origin}/connect/callback?app=${composioApp}`;
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName: composioApp, entityId: user.id, callbackUrl }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setConnecting(null); return; }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      setError("Failed to start connection. Please try again.");
      setConnecting(null);
    }
  }

  function isConnected(composioApp: string) {
    return connections.some(
      (c) => c.appName?.toLowerCase() === composioApp.toLowerCase() && c.status !== "FAILED"
    );
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>;
  }

  return (
    <div className="dash-page">
      <NavBar onSignOut={() => { supabase.auth.signOut(); router.push("/"); }} />

      <main className="dash-main">
        <div className="dash-top-row">
          <div className="dash-welcome">
            <h1>Connect Your Apps</h1>
            <p>Sign in to each app once. FlowBoard and the AI assistant will then be able to act on your behalf.</p>
          </div>
        </div>

        {error && (
          <div className="connect-error">⚠ {error}</div>
        )}

        <div className="connect-grid">
          {APPS.map((app) => {
            const unavailable = app.composioApp === null;
            const connected = !unavailable && isConnected(app.composioApp!);
            const isLoading = !unavailable && connecting === app.composioApp;
            return (
              <div key={app.key} className="connect-card" style={{ borderTopColor: app.color, opacity: unavailable ? 0.7 : 1 }}>
                <div className="connect-card-top">
                  <span className="connect-icon">{app.icon}</span>
                  <div>
                    <div className="connect-name">{app.label}</div>
                    {connected && <span className="connect-badge connected">✓ Connected</span>}
                    {!connected && !unavailable && <span className="connect-badge not-connected">Not connected</span>}
                    {unavailable && <span className="connect-badge not-connected">ℹ {app.note}</span>}
                  </div>
                </div>
                {!unavailable && (
                  <button
                    className="connect-btn"
                    style={{ background: connected ? "#f0fdf4" : app.color, color: connected ? "#15803d" : "white", borderColor: connected ? "#bbf7d0" : app.color }}
                    onClick={() => !connected && handleConnect(app.composioApp!)}
                    disabled={isLoading || connected}
                  >
                    {isLoading ? "Redirecting…" : connected ? "✓ Connected" : `Connect ${app.label}`}
                  </button>
                )}
                {!unavailable && app.note && !connected && (
                  <p className="connect-app-note">ℹ {app.note}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="connect-info">
          <h3>How it works</h3>
          <ol>
            <li>Click <strong>Connect</strong> on any app above.</li>
            <li>You will be redirected to that app&apos;s sign-in page (e.g. Google, Slack).</li>
            <li>After signing in, you are brought back here and the app shows as <strong>Connected</strong>.</li>
            <li>Go to the <a href="/workflow">Workflow Builder</a> and ask the AI assistant to do something — it will now act on your real accounts.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
