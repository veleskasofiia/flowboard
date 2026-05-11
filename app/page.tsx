export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <header className="hero">
        <h1>FlowBoard</h1>
        <p>Manage Gmail, Calendar, Notion, and Slack in one sleek workspace.</p>
        <button>Get Started</button>
      </header>

      {/* Integration Tiles */}
      <section className="tiles">
        <div className="tile">📧 Gmail</div>
        <div className="tile">📅 Calendar</div>
        <div className="tile">📓 Notion</div>
        <div className="tile">💬 Slack</div>
      </section>

      {/* Steps Section */}
      <section className="steps">
        <h2>How It Works</h2>
        <div>
          <h3>Step 1: Connect Gmail</h3>
          <p>Authorize Gmail to start syncing your emails.</p>
        </div>
        <div>
          <h3>Step 2: Sync Calendar</h3>
          <p>View upcoming events directly in your dashboard.</p>
        </div>
        <div>
          <h3>Step 3: Add Notion</h3>
          <p>Access your workspace notes and projects.</p>
        </div>
        <div>
          <h3>Step 4: Integrate Slack</h3>
          <p>Stay updated with team notifications.</p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 FlowBoard. All rights reserved.</p>
      </footer>
    </div>
  );
}
