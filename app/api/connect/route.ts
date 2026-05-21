import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let appName = "";
  try {
    const body = await req.json();
    const { entityId, callbackUrl } = body;
    appName = body.appName ?? "";

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
    let raw = "Unknown error";
    try {
      if (err instanceof Error) raw = err.message;
      else if (typeof err === "string") raw = err;
      else if (err && typeof (err as Record<string, unknown>).message === "string")
        raw = (err as Record<string, unknown>).message as string;
      else raw = JSON.stringify(err);
    } catch { /* ignore serialization errors */ }
    console.error("Connect error:", raw);
    const message =
      raw.toLowerCase().includes("internal server error") || raw.toLowerCase().includes("500")
        ? `Composio could not start the connection for "${appName}". Check that your COMPOSIO_API_KEY is valid and that the app integration is enabled in your Composio dashboard.`
        : raw === "Unknown error" || raw === "undefined"
        ? `Failed to connect "${appName}". Your Composio API key may be invalid or the integration may not be enabled.`
        : raw;
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
    // Return full objects so the frontend has the connection id for disconnect
    const all = await toolset.client.connectedAccounts.list({});
    const connections = all.items
      .filter((c: Record<string, unknown>) => c.clientUniqueUserId === entityId)
      .map((c: Record<string, unknown>) => ({ id: c.id, appName: c.appName, status: c.status }));

    return NextResponse.json({ connections });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch connections";
    console.error("Connections error:", message);
    return NextResponse.json({ connections: [], error: message });
  }
}

export async function DELETE(req: Request) {
  try {
    const { connectionId } = await req.json();
    if (!process.env.COMPOSIO_API_KEY || !connectionId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });
    await toolset.client.connectedAccounts.delete({ connectedAccountId: connectionId });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
