import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { appName, entityId, callbackUrl } = await req.json();

    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ error: "Composio not configured" }, { status: 500 });
    }

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
    const entity = toolset.client.getEntity(entityId);

    const connRequest = await entity.initiateConnection({
      appName,
      config: { redirectUrl: callbackUrl },
    });

    return NextResponse.json({ redirectUrl: connRequest.redirectUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    console.error("Connect error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId") || "default";

    if (!process.env.COMPOSIO_API_KEY) {
      return NextResponse.json({ connections: [] });
    }

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
    const entity = toolset.client.getEntity(entityId);
    const connections = await entity.getConnections();

    return NextResponse.json({ connections });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch connections";
    console.error("Connections error:", message);
    return NextResponse.json({ connections: [], error: message });
  }
}
