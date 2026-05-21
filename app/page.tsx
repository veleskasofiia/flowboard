"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const APPS = [
  { key: "gmail",    label: "Gmail",            icon: "📧" },
  { key: "outlook",  label: "Outlook Mail",     icon: "📨" },
  { key: "ocal",     label: "Outlook Calendar", icon: "📆" },
  { key: "calendar", label: "Google Calendar",  icon: "📅" },
  { key: "ical",     label: "iCal",             icon: "🗓️" },
  { key: "gdrive",   label: "Google Drive",     icon: "📁" },
  { key: "slack",    label: "Slack",            icon: "💬" },
  { key: "discord",  label: "Discord",          icon: "🎮" },
  { key: "notion",   label: "Notion",           icon: "📓" },
] as const;

const TYPEWRITER_PHRASES = [
  "All your tools, one Flow.",
  "AI that acts on your behalf.",
  "Automate Gmail, Slack & Notion.",
  "Your workflow, on autopilot.",
];

const WORKFLOW_STEPS = [
  { icon: "⚡", label: "Webhook", desc: "Event received" },
  { icon: "📧", label: "Gmail",   desc: "Fetch emails" },
  { icon: "🔀", label: "IF",      desc: "Filter important" },
  { icon: "💬", label: "Slack",   desc: "Post summary" },
];

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Typewriter
  const [twText, setTwText] = useState("");
  const [twPhrase, setTwPhrase] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[twPhrase];
    let timeout: ReturnType<typeof setTimeout>;
    if (!twDeleting) {
      if (twText.length < phrase.length) {
        timeout = setTimeout(() => setTwText(phrase.slice(0, twText.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setTwDeleting(true), 1800);
      }
    } else {
      if (twText.length > 0) {
        timeout = setTimeout(() => setTwText(twText.slice(0, -1)), 35);
      } else {
        setTwDeleting(false);
        setTwPhrase((p) => (p + 1) % TYPEWRITER_PHRASES.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [twText, twPhrase, twDeleting]);

  // Animated workflow step
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % WORKFLOW_STEPS.length), 1400);
    return () => clearInterval(t);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setAuthError(error.message);
    else setAuthSuccess(true);
  }

  return (
    <div>
      {/* ── Hero ── */}
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

        {/* Typewriter */}
        <p className="hero-typewriter">
          {twText}<span className="tw-cursor">|</span>
        </p>
      </header>

      <div className="main-content">

        {/* ── Fade-up intro ── */}
        <section className="section-block fadeup-section">
          <h2 className="section-title fadeup" style={{ animationDelay: "0.1s" }}>
            One dashboard for everything
          </h2>
          <p className="section-subtitle fadeup" style={{ animationDelay: "0.25s" }}>
            Connect Gmail, Slack, Notion and more. Let the AI handle the repetitive work.
          </p>
          <div className="fadeup hero-cta-row" style={{ animationDelay: "0.4s" }}>
            <a href="/auth/signup" className="header-btn primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>Get Started Free</a>
            <a href="/auth/login" className="header-btn" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>Sign In</a>
          </div>
        </section>

        {/* ── Scrolling logos ── */}
        <section className="section-block" style={{ overflow: "hidden", padding: "1.5rem 0" }}>
          <p className="section-subtitle" style={{ marginBottom: "1rem" }}>Works with your favourite tools</p>
          <div className="marquee-track">
            <div className="marquee-inner">
              {[...APPS, ...APPS].map((app, i) => (
                <div key={i} className="marquee-item">
                  <span style={{ fontSize: "1.8rem" }}>{app.icon}</span>
                  <span className="marquee-label">{app.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Animated workflow ── */}
        <section className="section-block">
          <h2 className="section-title">Watch the AI work</h2>
          <p className="section-subtitle" style={{ marginBottom: "2rem" }}>
            A live workflow runs step by step — triggered, filtered, and delivered automatically.
          </p>
          <div className="anim-workflow">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={i} className={`anim-step${i === activeStep ? " active" : i < activeStep ? " done" : ""}`}>
                <div className="anim-step-icon">{step.icon}</div>
                <div className="anim-step-label">{step.label}</div>
                <div className="anim-step-desc">{step.desc}</div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`anim-step-arrow${i < activeStep ? " done" : ""}`}>→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── App tiles ── */}
        <section className="section-block">
          <h2 className="section-title">Connect Your Apps</h2>
          <p className="section-subtitle">Sign up to start connecting your tools to FlowBoard.</p>
          <div className="app-tiles">
            {APPS.map((app) => (
              <button key={app.key} className={`app-tile ${app.key}`} onClick={() => router.push("/auth/signup")}>
                <span className="app-icon">{app.icon}</span>
                <span className="app-name">{app.label}</span>
                <span className="app-status">Connect →</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Why FlowBoard ── */}
        <section className="section-block why-section">
          <h2 className="section-title">Why use FlowBoard?</h2>
          <p className="why-text">
            FlowBoard brings all your essential tools into one simple, browser‑based dashboard.
            No extra installs, no complicated setup. Just one place to manage Gmail, Outlook,
            Google Calendar, Slack, Discord, and Notion — with smart automation built in.
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

        {/* ── Signup ── */}
        <section className="section-block signup-section">
          <h2 className="section-title">Get Started for Free</h2>
          <p className="section-subtitle">Create your FlowBoard account in seconds.</p>
          {authSuccess ? (
            <div className="signup-success">
              <p>🎉 Account created! Check your email to confirm, then <a href="/auth/login">sign in</a>.</p>
            </div>
          ) : (
            <form className="signup-form" onSubmit={handleSignup}>
              <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Choose a password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {authError && <p className="auth-error">{authError}</p>}
              <button type="submit" disabled={loading}>{loading ? "Creating account…" : "Create Account"}</button>
              <p className="signin-link">Already have an account? <a href="/auth/login">Sign in</a></p>
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
