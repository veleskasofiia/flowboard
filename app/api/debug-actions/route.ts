import { NextResponse } from "next/server";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { OpenAIToolSet } = await import("composio-core") as any;
  const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = await toolset.client.actions.list({ appNames: "gmail" } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const names = (actions as any)?.items?.map((a: any) => a.name) ?? actions;
  return NextResponse.json({ actions: names });
}
