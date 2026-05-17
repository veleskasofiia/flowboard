"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const APPS = [
  { key: "gmail",    label: "Gmail",              icon: "📧" },
  { key: "outlook",  label: "Outlook Mail",       icon: "📨" },
  { key: "ocal",     label: "Outlook Calendar",   icon: "📆" },
  { key: "calendar", label: "Google Calendar",    icon: "📅" },
  { key: "ical",     label: "iCal",               icon: "🗓️" },
  { key: "gdrive",   label: "Google Drive",       icon: "📁" },
  { key: "slack",    label: "Slack",              icon: "💬" },
  { key: "discord",  label: "Discord",            icon: "🎮" },
  { key: "notion",   label: "Notion",             icon: "📓" },
  { key: "todoist",     label: "Todoist",            icon: "✅" },
  { key: "seznammail",  label: "Seznam Mail",        icon: "✉️" },
  { key: "seznamcal",  label: "Seznam Calendar",    icon: "📋" },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess(true);
    }
  }

  return (
    <div>
      {/* Hero */}
      <header className="hero sticky-header">
        <div className="header-bar">
          <span className="logo-lockup">
            <Image src="/logo.svg" alt="FlowBoard logo" width={52} height={52} />
            <h1 className="site-title">FlowBoard</h1>
          </span>
          <div className="header-buttons">
            <a href="/auth/login" className="header-btn">Sign In</a>
            <a href="/workflow" className="header-btn">Workflow Builder</a>
            <a href="/dashboard" className="header-btn primary">Dashboard</a>
          </div>
        </div>
        <p>All your tools, one Flow</p>
      </header>

      <div className="main-content">

        {/* App tiles */}
        <section className="section-block">
          <h2 className="section-title">Connect Your Apps</h2>
          <p className="section-subtitle">Sign up to start connecting your tools to FlowBoard.</p>
          <div className="app-tiles">
            {APPS.map((app) => (
              <button
                key={app.key}
                className={`app-tile ${app.key}`}
                onClick={() => router.push("/auth/signup")}
              >
                <span className="app-icon">{app.icon}</span>
                <span className="app-name">{app.label}</span>
                <span className="app-status">Connect →</span>
              </button>
            ))}
          </div>
        </section>

        {/* Why FlowBoard */}
        <section className="section-block why-section">
          <h2 className="section-title">Why use FlowBoard?</h2>
          <p className="why-text">
            FlowBoard brings all your essential tools into one simple, browser‑based dashboard.
            No extra installs, no complicated setup. Just one place to manage Gmail, Outlook,
            Google Calendar, Slack, Discord, and Notion with smart features like spam filtering,
            meeting reminders, and automatic archiving. Stay organized, save time, and keep your
            workflow flowing.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>🔗 Connect</h3>
              <p>Bring all your tools into one workspace with a single click.</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Sync</h3>
              <p>Keep your data updated in real time across every app.</p>
            </div>
            <div className="feature-card">
              <h3>🤖 Automate</h3>
              <p>Let the AI agent handle repetitive tasks so you don&apos;t have to.</p>
            </div>
          </div>
        </section>

        {/* Signup form */}
        <section className="section-block signup-section">
          <h2 className="section-title">Get Started for Free</h2>
          <p className="section-subtitle">Create your FlowBoard account in seconds.</p>
          {authSuccess ? (
            <div className="signup-success">
              <p>🎉 Account created! Check your email to confirm, then{" "}
                <a href="/auth/login">sign in</a>.
              </p>
            </div>
          ) : (
            <form className="signup-form" onSubmit={handleSignup}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Choose a password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {authError && <p className="auth-error">{authError}</p>}
              <button type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
              <p className="signin-link">
                Already have an account? <a href="/auth/login">Sign in</a>
              </p>
            </form>
          )}
        </section>

      </div>

      <footer style={{ background: "#1e293b", color: "#94a3b8", textAlign: "center", padding: "1.25rem", fontSize: "0.85rem" }}>
        <p>© 2026 FlowBoard · <a href="/docs" style={{ color: "#93c5fd", textDecoration: "none" }}>Documentation</a> · <a href="/auth/login" style={{ color: "#93c5fd", textDecoration: "none" }}>Sign In</a></p>
      </footer>
    </div>
  );
}
