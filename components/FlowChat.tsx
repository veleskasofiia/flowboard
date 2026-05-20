"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FlowChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (!error && data) setMessages(data);
      } else {
        setMessages([{ role: "assistant", content: "Hi! I can help you build workflows. Ask me anything." }]);
      }
    };
    loadMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const { data: { user } } = await supabase.auth.getUser();

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    if (user) {
      await supabase.from("messages").insert({ user_id: user.id, role: "user", content: text });
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, entityId: user?.id ?? "default" }),
      });
      const data = await res.json();
      const reply = data.reply ?? "No response received.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (user) {
        await supabase.from("messages").insert({ user_id: user.id, role: "assistant", content: reply });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Could not reach the AI. Check your internet connection and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <h2>🤖 AI Flow Assistant</h2>
      <div className="chat-box">
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
