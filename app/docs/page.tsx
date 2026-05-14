"use client";
import NavBar from "@/components/NavBar";

export default function DocsPage() {
  return (
    <div className="docs-page">
      <NavBar />

      <div className="docs-layout">
        <aside className="docs-toc">
          <p className="docs-toc-title">On this page</p>
          <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#getting-started">Getting Started</a></li>
            <li><a href="#workflow-builder">Workflow Builder</a>
              <ul>
                <li><a href="#canvas">Canvas</a></li>
                <li><a href="#palette">Left Panel</a></li>
                <li><a href="#run">Running a Workflow</a></li>
              </ul>
            </li>
            <li><a href="#nodes">Node Reference</a>
              <ul>
                <li><a href="#triggers">Triggers</a></li>
                <li><a href="#actions">Actions</a></li>
                <li><a href="#if-condition">IF Condition</a></li>
              </ul>
            </li>
            <li><a href="#ai-assistant">AI Assistant</a></li>
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#technology">Technology</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </aside>

        <main className="docs-content">

          <section id="overview">
            <h1>FlowBoard Documentation</h1>
            <p className="docs-lead">
              FlowBoard is a browser-based visual workflow builder. Connect your favourite apps —
              Gmail, Slack, Notion, Google Calendar, and more — by dragging nodes onto a canvas and
              drawing connections between them. An AI assistant helps you design and understand your
              automations in plain English.
            </p>
          </section>

          <hr className="docs-divider" />

          <section id="getting-started">
            <h2>Getting Started</h2>
            <ol className="docs-steps">
              <li>
                <strong>Create an account</strong> — visit the <a href="/">homepage</a> and fill in
                the sign-up form, or go to <a href="/auth/signup">Sign Up</a> directly. You will
                receive a confirmation email; click the link inside to activate your account.
              </li>
              <li>
                <strong>Sign in</strong> — go to <a href="/auth/login">Sign In</a> and enter your
                credentials. You are redirected to your personal <a href="/dashboard">Dashboard</a>.
              </li>
              <li>
                <strong>Open the Workflow Builder</strong> — click <em>Workflow Builder</em> in the
                navigation or the <em>Open Workflow Builder</em> button on the Dashboard.
              </li>
              <li>
                <strong>Build your first flow</strong> — drag a <strong>Webhook</strong> or{" "}
                <strong>Schedule</strong> trigger from the left panel onto the canvas, then drag an
                app action (e.g. Gmail) and connect the two nodes by dragging from the right handle
                of the trigger to the left handle of the action.
              </li>
              <li>
                <strong>Run it</strong> — click the <strong>▶ Run</strong> button in the top bar.
                The AI simulates what the workflow would do and shows the result in a banner.
              </li>
            </ol>
          </section>

          <hr className="docs-divider" />

          <section id="workflow-builder">
            <h2>Workflow Builder</h2>
            <p>
              The Workflow Builder is the main workspace at <code>/workflow</code>. It has three
              areas: the <strong>left panel</strong> (node palette), the <strong>canvas</strong>
              (your workflow), and the <strong>AI chat panel</strong> on the right.
            </p>

            <h3 id="canvas">Canvas</h3>
            <p>The canvas is an infinite, pannable/zoomable workspace.</p>
            <ul>
              <li>
                <strong>Pan</strong> — click and drag on empty canvas space, or use the scroll wheel
                to zoom.
              </li>
              <li>
                <strong>Select a node</strong> — click it. It gets a coloured border and glow.
              </li>
              <li>
                <strong>Move a node</strong> — drag it to any position.
              </li>
              <li>
                <strong>Delete a node or edge</strong> — select it and press{" "}
                <kbd>Backspace</kbd>.
              </li>
              <li>
                <strong>Connect two nodes</strong> — hover over the right side of a node until the
                handle (coloured dot) appears; drag from it to the left handle of the target node.
              </li>
              <li>
                <strong>MiniMap</strong> — the small map in the bottom-right shows your full
                workflow at a glance. Click to jump to any area.
              </li>
              <li>
                <strong>Controls</strong> — zoom in/out and fit-view buttons in the bottom-left.
              </li>
            </ul>

            <h3 id="palette">Left Panel</h3>
            <p>
              The left panel lists all available nodes in two groups: <strong>Triggers</strong> and{" "}
              <strong>Actions</strong>. Use the search bar at the top to filter by name.
            </p>
            <p>
              To add a node to the canvas, drag it from the left panel and drop it anywhere on the
              canvas. The node appears at the position you dropped it.
            </p>

            <h3 id="run">Running a Workflow</h3>
            <p>
              Click <strong>▶ Run</strong> in the top bar. FlowBoard reads every node currently on
              the canvas and sends them to the AI simulation engine. Within a few seconds a result
              banner appears below the top bar showing what each step of the workflow produced (e.g.
              how many emails were found, which calendar event is next, which Slack message was
              sent).
            </p>
            <p>
              Run results are saved locally in your browser. Your <a href="/dashboard">Dashboard</a>{" "}
              shows the last 5 runs in the <em>Recent Workflow Runs</em> section.
            </p>
          </section>

          <hr className="docs-divider" />

          <section id="nodes">
            <h2>Node Reference</h2>

            <h3 id="triggers">Triggers</h3>
            <p>
              Every workflow must start with exactly one trigger. Triggers appear in the{" "}
              <strong>Triggers</strong> section of the left panel.
            </p>

            <div className="docs-node-table">
              <div className="docs-node-row docs-node-head">
                <span>Node</span><span>Icon</span><span>Description</span>
              </div>
              <div className="docs-node-row">
                <span><strong>Webhook</strong></span>
                <span>⚡</span>
                <span>Starts the workflow when an HTTP POST request is received at a unique URL.</span>
              </div>
              <div className="docs-node-row">
                <span><strong>Schedule</strong></span>
                <span>⏰</span>
                <span>Starts the workflow on a time-based schedule (e.g. every morning at 8 AM).</span>
              </div>
            </div>

            <h3 id="actions">Actions</h3>
            <p>
              Actions are the steps that run after a trigger. You can chain as many as you need.
            </p>

            <div className="docs-node-table">
              <div className="docs-node-row docs-node-head">
                <span>Node</span><span>Icon</span><span>Description</span>
              </div>
              {[
                ["Gmail", "📧", "Read, filter, or send emails via your Gmail account."],
                ["Outlook Mail", "📨", "Read or send emails via Microsoft Outlook."],
                ["Outlook Calendar", "📆", "Create, read, or update Microsoft Outlook calendar events."],
                ["Google Calendar", "📅", "Create, read, or update Google Calendar events."],
                ["iCal", "🗓️", "Subscribe to or read iCal feeds."],
                ["Google Drive", "📁", "Upload, download, or organise files in Google Drive."],
                ["Slack", "💬", "Post messages or read channels in your Slack workspace."],
                ["Discord", "🎮", "Send messages or read channels in your Discord server."],
                ["Notion", "📓", "Create or update Notion pages and databases."],
                ["Todoist", "✅", "Create, complete, or list tasks in Todoist."],
              ].map(([name, icon, desc]) => (
                <div key={name} className="docs-node-row">
                  <span><strong>{name}</strong></span>
                  <span>{icon}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>

            <h3 id="if-condition">IF Condition</h3>
            <p>
              The <strong>IF Condition</strong> node (🔀) lets you branch your workflow based on a
              condition. Connect your trigger to the IF node, then connect two separate action nodes
              to the IF node — one for the <em>true</em> path and one for the <em>false</em> path.
            </p>
            <div className="docs-example">
              <p><strong>Example:</strong> Schedule → IF Condition → Gmail (true path) + Slack (false path)</p>
              <p>
                The AI assistant can help you decide what condition to use. Ask it: <em>"How do I
                filter emails by subject with the IF Condition node?"</em>
              </p>
            </div>
          </section>

          <hr className="docs-divider" />

          <section id="ai-assistant">
            <h2>AI Assistant</h2>
            <p>
              The AI chat panel on the right side of the Workflow Builder is powered by{" "}
              <strong>Groq</strong> (llama-3.3-70b-versatile model). It knows exactly what the
              FlowBoard UI looks like and can answer questions like:
            </p>
            <ul>
              <li>"How do I connect Gmail to Slack?"</li>
              <li>"How do I use the IF Condition node?"</li>
              <li>"What is the difference between Webhook and Schedule?"</li>
              <li>"How do I connect Outlook Calendar to Google Calendar?"</li>
            </ul>
            <p>
              Type your question in the input box at the bottom of the chat panel and press{" "}
              <kbd>Enter</kbd> or click <strong>Send</strong>.
            </p>
            <p>
              The assistant gives short, practical answers (3–5 lines) describing exactly what to
              drag and where to connect it in the UI you see.
            </p>
          </section>

          <hr className="docs-divider" />

          <section id="dashboard">
            <h2>Dashboard</h2>
            <p>
              The <a href="/dashboard">Dashboard</a> is your personal home base after signing in. It
              shows:
            </p>
            <ul>
              <li>A greeting with your username and member-since date.</li>
              <li>
                <strong>Stats</strong> — days with FlowBoard, number of supported apps, AI messages
                sent.
              </li>
              <li>
                <strong>How to Build a Workflow</strong> — a 3-step quick-start guide.
              </li>
              <li>
                <strong>Supported Apps</strong> — all available app nodes at a glance.
              </li>
              <li>
                <strong>AI Prompt Ideas</strong> — one-click copy of useful questions to paste into
                the AI assistant.
              </li>
              <li>
                <strong>Recent Workflow Runs</strong> — the last 5 runs you executed in the Workflow
                Builder, stored in your browser.
              </li>
            </ul>
          </section>

          <hr className="docs-divider" />

          <section id="technology">
            <h2>Technology</h2>
            <p>FlowBoard is built on open, reliable infrastructure:</p>
            <div className="docs-tech-grid">
              <div className="docs-tech-card">
                <span className="docs-tech-icon">🗄️</span>
                <div>
                  <strong>
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>
                  </strong>
                  <p>
                    Authentication, user accounts, and cloud workflow storage are all powered by
                    Supabase — an open-source Firebase alternative built on PostgreSQL. Your data
                    is stored securely and is only accessible to you.
                  </p>
                </div>
              </div>
              <div className="docs-tech-card">
                <span className="docs-tech-icon">🤖</span>
                <div>
                  <strong>Groq AI</strong>
                  <p>
                    The AI assistant and workflow simulation engine run on{" "}
                    <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">Groq</a>
                    {" "}using the Llama 3.3 70B model — a fast, open-source large language model.
                  </p>
                </div>
              </div>
              <div className="docs-tech-card">
                <span className="docs-tech-icon">⚡</span>
                <div>
                  <strong>Next.js + ReactFlow</strong>
                  <p>
                    The frontend is built with Next.js (React framework) and{" "}
                    <a href="https://reactflow.dev" target="_blank" rel="noopener noreferrer">ReactFlow</a>
                    {" "}for the interactive drag-and-drop canvas. Deployed on Vercel.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="docs-divider" />

          <section id="faq">
            <h2>FAQ</h2>

            <details className="docs-faq-item">
              <summary>Is FlowBoard free?</summary>
              <p>
                Yes. FlowBoard is free to use. The AI assistant runs on the Groq free tier. There
                are no usage limits imposed by FlowBoard itself.
              </p>
            </details>

            <details className="docs-faq-item">
              <summary>Does FlowBoard actually connect to my Gmail / Slack?</summary>
              <p>
                The current version simulates workflow runs using AI-generated output. Real OAuth
                connections to external apps (Gmail, Slack, etc.) are on the roadmap.
              </p>
            </details>

            <details className="docs-faq-item">
              <summary>Where are my workflow runs stored?</summary>
              <p>
                Run results are stored in your browser&apos;s <code>localStorage</code>. They are
                not synced to the cloud and will be lost if you clear your browser data.
              </p>
            </details>

            <details className="docs-faq-item">
              <summary>How do I delete a node from the canvas?</summary>
              <p>
                Click the node to select it (it gets a coloured border), then press{" "}
                <kbd>Backspace</kbd>.
              </p>
            </details>

            <details className="docs-faq-item">
              <summary>Can I save my workflow?</summary>
              <p>
                Yes — in two ways. Your workflow is auto-saved locally in your browser as you build
                it, so it survives page reloads even without an account. If you are signed in, you
                can also click the <strong>💾 Save</strong> button in the top bar to save your
                workflow to your account in the cloud (powered by{" "}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>
                ). Cloud saves are synced across devices.
              </p>
            </details>

            <details className="docs-faq-item">
              <summary>The AI assistant isn&apos;t responding. What do I do?</summary>
              <p>
                The AI assistant is fully managed by FlowBoard — you do not need an API key or any
                account with a third-party service. If the assistant stops responding, try refreshing
                the page. If the problem persists, the service may be temporarily unavailable.
              </p>
            </details>
          </section>

        </main>
      </div>

      <footer className="docs-footer">
        <p>© 2026 FlowBoard · <a href="/">Home</a> · <a href="/dashboard">Dashboard</a> · <a href="/workflow">Workflow Builder</a></p>
      </footer>
    </div>
  );
}
