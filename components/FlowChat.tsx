"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FlowChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  // Load messages for the logged-in user
  useEffect(() => {
    const loadMessages = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setMessages(data);
        }
      } else {
        // Default welcome message if no user logged in
        setMessages([
          {
            role: "assistant",
            content:
              "Hi Sofija! I can help you connect Gmail with Slack, or Outlook with Calendar. Which integration would you like to set up?",
          },
        ]);
      }
    };

    loadMessages();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Add user message locally
    const newUserMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newUserMessage]);

    // Save user message to Supabase
    if (user) {
      await supabase.from("messages").insert({
        user_id: user.id,
        role: "user",
        content: input,
      });
    }

    // Call AI agent backend (Claude + Composio)
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, entityId: user?.id ?? "default" }),
    });
    const data = await res.json();

    const newAssistantMessage = { role: "assistant", content: data.reply };
    setMessages((prev) => [...prev, newAssistantMessage]);

    // Save assistant reply to Supabase
    if (user) {
      await supabase.from("messages").insert({
        user_id: user.id,
        role: "assistant",
        content: data.reply,
      });
    }

    setInput("");
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
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type your request…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
