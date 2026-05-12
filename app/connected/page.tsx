"use client";
import React, { useState } from "react";
import ReactFlow, { addEdge, Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function ConnectedAppsPage() {
  const [nodes, setNodes] = useState([
    { id: "gmail", position: { x: 50, y: 50 }, data: { label: "📧 Gmail" }, style: { border: "2px solid #ea4335" } },
    { id: "calendar", position: { x: 250, y: 50 }, data: { label: "📅 Calendar" }, style: { border: "2px solid #4285f4" } },
    { id: "slack", position: { x: 450, y: 50 }, data: { label: "💬 Slack" }, style: { border: "2px solid #36c5f0" } },
  ]);
  const [edges, setEdges] = useState([]);

  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  return (
    <div>
      {/* Hero Section */}
      <header className="hero">
        <div className="header-bar">
          <h1 className="site-title">Connected Apps Schema</h1>
          <div className="header-buttons">
            <a href="/signin" className="header-btn">Sign In</a>
            <a href="/get-started" className="header-btn primary">Get Started</a>
          </div>
        </div>
        <p>Visualize and manage your app connections.</p>
      </header>

      {/* Layout: Schema left, Chat right */}
      <div className="connected-layout">
        {/* Schema Graph */}
        <div className="schema-panel">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>

        {/* AI Flow Chat */}
        <div className="chat-panel">
          <h2>🤖 AI Flow Assistant</h2>
          <div className="chat-box">
            <p><strong>AI Flow:</strong> Hi Sofija! I can help you connect Gmail with Slack, or Outlook with Calendar. Which integration would you like to set up?</p>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Type your request..." />
            <button>Send</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <a href="/" className="back-home">🏠 Back to Home</a>
        <p>Made with ❤️ by FlowBoard</p>
      </footer>
    </div>
  );
}
