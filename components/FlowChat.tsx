"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

type Msg = { role: string; content: string };
const LS_KEY = "flowboard_chat";

export default function FlowChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Try Supabase first
        const { data, error } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data);
          localStorage.setItem(LS_KEY, JSON.stringify(data));
          return;
        }
      }

      // Fall back to localStorage
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        try { setMessages(JSON.parse(stored)); } catch { /* ignore */ }
      }
    };
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const { data: { user } } = await supabase.auth.getUser();

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setInput("");
    setLoading(true);

    if (user) {
      supabase.from("messages").insert({ user_id: user.id, role: "user", content: text }).then(() => {});
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, entityId: user?.id ?? "default" }),
      });
      const data = await res.json();
      const reply = data.reply ?? "No response received.";

      const withReply = [...updated, { role: "assistant", content: reply }];
      setMessages(withReply);
      localStorage.setItem(LS_KEY, JSON.stringify(withReply));

      if (user) {
        supabase.from("messages").insert({ user_id: user.id, role: "assistant", content: reply }).then(() => {});
      }
    } catch {
      const withErr = [...updated, { role: "assistant", content: "Could not reach the AI. Check your connection and try again." }];
      setMessages(withErr);
      localStorage.setItem(LS_KEY, JSON.stringify(withErr));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMessages([]);
    localStorage.removeItem(LS_KEY);
    if (user) {
      supabase.from("messages").delete().eq("user_id", user.id).then(() => {});
    }
  };

  return (
    <div className="chat-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>🤖 AI Flow Assistant</h2>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{ fontSize: "0.72rem", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
            Clear
          </button>
        )}
      </div>
      <div className="chat-box">
        {messages.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Hi! Ask me how to build a workflow.</p>
        )}
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.role === "assistant" ? "AI Flow:" : "You:"}</strong>{" "}
            {m.content}
          </p>
        ))}
        {loading && (
          <p><strong>AI Flow:</strong> <span style={{ color: "#94a3b8" }}>Thinking…</span></p>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type your request…"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
