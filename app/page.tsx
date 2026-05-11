"use client";
import { useState } from "react";

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);

  const apps = ["📧 Gmail", "📅 Calendar", "📓 Notion", "💬 Slack", "🗂 Trello", "💻 GitHub"];

  return (
    <div>
      {/* Sticky Hero Header */}
      <header className="hero sticky-header">
        <div className="header-bar">
          <h1>FlowBoard</h1>
          <div className="header-buttons">
            <a href="/signin" className="header-btn">Sign In</a>
            <a href="/get-started" className="header-btn primary">Get Started</a>
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

        {/* Spacer before CTA */}
        <div className="spacer"></div>

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

        {/* App Roll */}
        <section className="app-roll">
          {apps.map((app, index) => (
            <div key={index} className="app-item">
              {app}
            </div>
          ))}
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
