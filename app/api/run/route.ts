import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nodes } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        result: "• Workflow executed (AI simulation unavailable — add GROQ_API_KEY to enable detailed results)",
      });
    }

    const nodeList = (nodes as { label: string; category: string }[])
      .map((n) => `${n.category === "trigger" ? "[Trigger]" : "[Action]"} ${n.label}`)
      .join(", ");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a workflow simulation engine for FlowBoard, a visual automation tool.
When given a list of workflow nodes, simulate what happened when the workflow ran RIGHT NOW.
Return exactly 3-5 bullet points of realistic, specific output. Rules:
- Gmail: mention count of unread emails and 1-2 realistic subject lines
- Outlook Mail: mention 1 realistic email subject and sender
- Slack: mention a channel name (#general, #dev, etc.) and a short message
- Google Calendar / Outlook Calendar / iCal: mention next event name, date, and time
- Google Drive: mention a file name that was accessed or created
- Notion: mention a page title that was updated
- Todoist: mention a task that was completed or created
- Discord: mention a server/channel and a short message
- Webhook trigger: say what event was received (e.g., "POST /webhook received from api.example.com")
- Schedule trigger: say it was triggered at the current time
- IF Condition: say whether it evaluated to true or false and why
Each bullet starts with the app name in **bold**. Be specific and realistic. No preamble or closing line.`,
        },
        {
          role: "user",
          content: `Simulate running this workflow now: ${nodeList}`,
        },
      ],
      max_tokens: 512,
    });

    const result = response.choices[0].message.content ?? "Workflow completed successfully.";
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Run error:", err);
    return NextResponse.json({ result: "Workflow run failed. Please try again." }, { status: 500 });
  }
}
