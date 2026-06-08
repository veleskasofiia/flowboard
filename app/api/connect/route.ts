import { NextResponse } from "next/server";
import { Composio } from "@composio/core";

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
    return `Access denied for "${appName}". Your Composio API key may be expired or invalid — check it at app.composio.dev and update COMPOSIO_API_KEY in your environment variables.`;
  }
  if (lower.includes("no auth config") || lower.includes("not found")) {
    return `Could not find a connection setup for "${appName}" in your Composio account. Make sure the integration is enabled at app.composio.dev.`;
  }
  if (!raw || raw === "Unknown error" || raw === "undefined") {
    return `Failed to connect "${appName}". Your Composio API key may be invalid or the integration may not be enabled.`;
  }
  return raw;
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

    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

    const authConfigsResult = await composio.authConfigs.list({});
    const authConfig = authConfigsResult.items.find(
      (c: Record<string, unknown>) =>
        (c.toolkit as Record<string, unknown>)?.slug?.toString().toLowerCase() === appName.toLowerCase() &&
        c.isComposioManaged === true
    );

    if (!authConfig) {
      return NextResponse.json(
        { error: `No auth config found for "${appName}". Enable the integration at app.composio.dev.` },
        { status: 400 }
      );
    }

    const connReq = await composio.connectedAccounts.initiate(entityId, authConfig.id as string, { callbackUrl });

    return NextResponse.json({ redirectUrl: connReq.redirectUrl });
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

    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    const result = await composio.connectedAccounts.list({ userIds: [entityId] });
    const connections = result.items.map((c: Record<string, unknown>) => ({
      id: c.id,
      appName: (c.toolkit as Record<string, unknown>)?.slug ?? "",
      status: c.status,
    }));

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
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    await composio.connectedAccounts.delete(connectionId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
