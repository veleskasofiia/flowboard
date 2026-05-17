import { NextResponse } from "next/server";

export async function GET() {
  const { OpenAIToolSet } = await import("composio-core");
  const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
  const actions = await toolset.client.actions.list({ appNames: "gmail" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = (actions as any)?.items?.map((a: any) => a.name) ?? actions;
  return NextResponse.json({ actions: names });
}
