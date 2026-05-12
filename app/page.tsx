"use client";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);

  const [statuses, setStatuses] = useState({
    gmail: "Connecting...",
    calendar: "Pending...",
    notion: "Pending...",
    slack: "Pending...",
    trello: "Pending...",
    github: "Pending...",
    outlook: "Pending...",
    discord: "Pending...",
    dropbox: "Pending...",
    zoom: "Pending..."
  });

  const [progress, setProgress] = useState({
    gmail: 0,
    calendar: 0,
    notion: 0,
    slack: 0,
    trello: 0,
    github: 0,
    outlook: 0,
    discord: 0,
    dropbox: 0,
    zoom: 0
  });

  useEffect(() => {
    const apps = [
      { key: "gmail", delay: 0 },
      { key: "calendar", delay: 2000 },
      { key: "notion", delay: 4000 },
      { key: "slack", delay: 6000 },
      { key: "trello", delay: 8000 },
      { key: "github", delay: 10000 },
      { key: "outlook", delay: 12000 },
      { key: "discord", delay: 14000 },
      { key: "dropbox", delay: 16000 },
      { key: "zoom", delay: 18000 },
    ];

    apps.forEach(app => {
      setTimeout(() => {
        let interval = setInterval(() => {
          setProgress(prev => {
            if (prev[app.key] < 100) return { ...prev, [app.key]: prev[app.key] + 5 };
            clearInterval(interval);
            setStatuses(prev => ({ ...prev, [app.key]: "✅ Connected" }));
            return prev;
          });
        }, 100);
      }, app.delay);
    });
  }, []);

  return (
    <div>
      {/* Sticky Hero Header */}
      <header className="hero sticky-header">
        <div className="header-bar">
          <h1 className="site-title">FlowBoard</h1>
          <div className="header-buttons">
            <a href="/signin" className="header-btn">Sign In</a>
            <a href="/connected" className="header-btn primary">Go to Connected</a>
          </div>
        </div>
        <p>All your tools, one Flow</p>
      </header>

      {/* Main content area with gradient background */}
      <div className="main-content">
        {/* Feature Grid */}
        <section className="feature-grid">
          <div className="feature-card">
            <h3>🔗 Connect</h3>
            <p>Bring Gmail, Slack, Notion, and more into one workspace.</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Sync</h3>
            <p>Keep your data updated in real time across all tools.</p>
          </div>
          <div className="feature-card">
            <h3>🤖 Automate</h3>
            <p>Save hours by automating repetitive tasks effortlessly.</p>
          </div>
        </section>

        {/* Workflow Diagram */}
        <section className="workflow-section">
          <h2>Visualize Your Flow</h2>
          <div className="workflow-diagram">
            <div className="workflow-step">📧 Gmail</div>
            <span className="arrow">➡️</span>
            <div className="workflow-step">📅 Calendar</div>
            <span className="arrow">➡️</span>
            <div className="workflow-step">💬 Slack</div>
            <span className="arrow">➡️</span>
            <div className="workflow-step">✅ Done</div>
          </div>
        </section>

        {/* Status Tiles Section */}
        <section className="status-tiles">
          {Object.keys(statuses).map(app => (
            <div key={app} className={`status-tile ${app}`}>
              <span>
                {app === "gmail" && "📧 Gmail"}
                {app === "calendar" && "📅 Calendar"}
                {app === "notion" && "📓 Notion"}
                {app === "slack" && "💬 Slack"}
                {app === "trello" && "🗂 Trello"}
                {app === "github" && "💻 GitHub"}
                {app === "outlook" && "📨 Outlook"}
                {app === "discord" && "🎮 Discord"}
                {app === "dropbox" && "📂 Dropbox"}
                {app === "zoom" && "🎥 Zoom"}
              </span>
              <p>{statuses[app]}</p>
              <div className="progress-bar">
                <div style={{ width: `${progress[app]}%` }}></div>
              </div>
            </div>
          ))}
        </section>

        {/* About Section */}
        <section className="about-section">
          <h2>Why FlowBoard?</h2>
          <p>
            Managing multiple apps can feel overwhelming — emails in Gmail, meetings in Calendar,
            notes in Notion, and conversations in Slack. FlowBoard brings them all together in one
            unified dashboard, so you don’t waste time switching tabs or missing important updates.
          </p>
          <p>
            With FlowBoard, you can see everything at a glance, automate repetitive tasks, and keep
            your work flowing smoothly. It’s the simplest way to stay connected and productive.
          </p>
        </section>

        {/* Steps Section */}
        <section className="steps">
          <h2>How It Works</h2>
          <div>
            <h3>1. Connect Your Apps</h3>
            <p>Link Gmail, Calendar, Slack, Notion, and more in seconds.</p>
          </div>
          <div>
            <h3>2. Sync Your Data</h3>
            <p>FlowBoard keeps everything updated in real time across all tools.</p>
          </div>
          <div>
            <h3>3. Automate Workflows</h3>
            <p>Save hours by automating repetitive tasks and focusing on what matters.</p>
          </div>
        </section>

        {/* Registration Form / CTA */}
        {showForm ? (
          <section className="form-section">
            <h2>Register Now</h2>
            <form className="register-form">
              <input type="text" placeholder="First Name" required />
              <input type="text" placeholder="Surname" required />
              <input type="email" placeholder="Email Address" required />
              <input
                type="password"
                placeholder="Password"
                required
                pattern="^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$"
                title="Password must be at least 8 characters, include one uppercase letter, one number, and one special character."
              />
              <input type="password" placeholder="Confirm Password" required />
              <button type="submit" className="form-submit">Sign Up</button>
            </form>
          </section>
        ) : (
          <div className="cta-block">
            <button onClick={() => setShowForm(true)} className="cta-button">
              🚀 Get Started for Free
            </button>
            <a href="/connected" className="back-home">🔗 Go to Connected Apps</a>
          </div>
        )}

        {/* Footer */}
        <footer>
          <p>Made with ❤️ by FlowBoard</p>
        </footer>
      </div>
    </div>
  );
}
