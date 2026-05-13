"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const searchParams = useSearchParams();
  const app = searchParams.get("app") ?? "app";
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { clearInterval(timer); window.location.href = "/connect"; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="callback-page">
      <div className="callback-card">
        <div className="callback-icon">✅</div>
        <h1>Connected!</h1>
        <p>Your <strong>{app}</strong> account has been connected to FlowBoard.</p>
        <p className="callback-redirect">Returning to Connect Apps in {countdown}s…</p>
        <a href="/connect" className="dash-action-btn primary" style={{ display: "inline-flex", marginTop: "1rem" }}>
          ← Back to Connect Apps
        </a>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
