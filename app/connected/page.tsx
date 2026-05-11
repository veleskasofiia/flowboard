"use client";
import { useState, useEffect } from "react";

export default function ConnectedAppsPage() {
  const [statuses, setStatuses] = useState({
    gmail: "Connecting...",
    calendar: "Pending...",
    notion: "Pending...",
    slack: "Pending..."
  });

  const [progress, setProgress] = useState({
    gmail: 0,
    calendar: 0,
    notion: 0,
    slack: 0
  });

  useEffect(() => {
    // Gmail progress
    let gmailInterval = setInterval(() => {
      setProgress(prev => {
        if (prev.gmail < 100) return { ...prev, gmail: prev.gmail + 5 };
        clearInterval(gmailInterval);
        setStatuses(prev => ({ ...prev, gmail: "✅ Connected" }));
        return prev;
      });
    }, 100);

    // Calendar progress
    setTimeout(() => {
      let calInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.calendar < 100) return { ...prev, calendar: prev.calendar + 5 };
          clearInterval(calInterval);
          setStatuses(prev => ({ ...prev, calendar: "✅ Connected" }));
          return prev;
        });
      }, 100);
    }, 2000);

    // Notion progress
    setTimeout(() => {
      let notionInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.notion < 100) return { ...prev, notion: prev.notion + 5 };
          clearInterval(notionInterval);
          setStatuses(prev => ({ ...prev, notion: "✅ Connected" }));
          return prev;
        });
      }, 100);
    }, 4000);

    // Slack progress
    setTimeout(() => {
      let slackInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.slack < 100) return { ...prev, slack: prev.slack + 5 };
          clearInterval(slackInterval);
          setStatuses(prev => ({ ...prev, slack: "✅ Connected" }));
          return prev;
        });
      }, 100);
    }, 6000);
  }, []);

  return (
    <div>
      {/* Hero Section with header buttons */}
      <header className="hero">
        <div className="header-bar">
          <h1 className="site-title">Connected Apps</h1>
          <div className="header-buttons">
            <a href="/signin" className="header-btn">Sign In</a>
            <a href="/get-started" className="header-btn primary">Get Started</a>
          </div>
        </div>
        <p>Watch your apps connect seamlessly into one workspace.</p>
      </header>

      {/* Animated Connection Tiles */}
      <section className="tiles">
        <div className="tile">
          📧 Gmail 
          <p className={statuses.gmail.includes("Connecting") ? "connecting" : ""}>{statuses.gmail}</p>
          <div className="progress-bar"><div style={{width: `${progress.gmail}%`}}></div></div>
        </div>
        <div className="tile">
          📅 Calendar 
          <p className={statuses.calendar.includes("Connecting") ? "connecting" : ""}>{statuses.calendar}</p>
          <div className="progress-bar"><div style={{width: `${progress.calendar}%`}}></div></div>
        </div>
        <div className="tile">
          📓 Notion 
          <p className={statuses.notion.includes("Connecting") ? "connecting" : ""}>{statuses.notion}</p>
          <div className="progress-bar"><div style={{width: `${progress.notion}%`}}></div></div>
        </div>
        <div className="tile">
          💬 Slack 
          <p className={statuses.slack.includes("Connecting") ? "connecting" : ""}>{statuses.slack}</p>
          <div className="progress-bar"><div style={{width: `${progress.slack}%`}}></div></div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <a href="/" className="back-home">🏠 Back to Home</a>
        <p>Made with ❤️ by FlowBoard</p>
      </footer>
    </div>
  );
}
