import { NextResponse } from "next/server";

function extractMessage(err: unknown): string {
  try {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof (err as Record<string, unknown>).message === "string")
      return (err as Record<string, unknown>).message as string;
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function friendlyConnectError(raw: string, appName: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
    return `Composio's API rate limit was hit. Please wait 30 seconds and try connecting "${appName}" again.`;
  }
  if (lower.includes("access denied") || lower.includes("403") || lower.includes("forbidden") || lower.includes("unauthorized") || lower.includes("401")) {
    return `Access denied for "${appName}". Your Composio API key may be expired or invalid — check it at app.composio.dev and update the COMPOSIO_API_KEY in your Vercel environment variables.`;
  }
  if (lower.includes("internal server error") || lower.includes("500")) {
    return `Composio could not start the connection for "${appName}". Check that your COMPOSIO_API_KEY is valid and the app integration is enabled in your Composio dashboard.`;
  }
  if (!raw || raw === "Unknown error" || raw === "undefined") {
    return `Failed to connect "${appName}". Your Composio API key may be invalid or the integration may not be enabled.`;
  }
  return raw;
}

async function initiateWithRetry(
  entity: { initiateConnection: (opts: unknown) => Promise<{ redirectUrl: string }> },
  appName: string,
  callbackUrl: string,
  retries = 1
): Promise<{ redirectUrl: string }> {
  try {
    return await entity.initiateConnection({ appName, config: { redirectUrl: callbackUrl } });
  } catch (err) {
    const msg = extractMessage(err).toLowerCase();
    if (retries > 0 && (msg.includes("rate limit") || msg.includes("429"))) {
      await new Promise((r) => setTimeout(r, 3000));
      return initiateWithRetry(entity, appName, callbackUrl, retries - 1);
    }
    throw err;
  }
}

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

    const connRequest = await initiateWithRetry(entity, appName, callbackUrl);
    return NextResponse.json({ redirectUrl: connRequest.redirectUrl });
  } catch (err: unknown) {
    const raw = extractMessage(err);
    console.error("Connect error:", raw);
    return NextResponse.json({ error: friendlyConnectError(raw, appName) }, { status: 500 });
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
