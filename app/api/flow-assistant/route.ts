import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message } = await req.json();

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3", // or mistral, gemma, etc.
      prompt: message,
    }),
  });

  const data = await res.json();
  const reply = data.response || "Sorry, I couldn’t generate a reply.";

  return NextResponse.json({ reply });
}
