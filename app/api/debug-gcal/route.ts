import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get("entityId") || "default";

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json({ error: "No COMPOSIO_API_KEY" });
  }

  const { OpenAIToolSet } = await import("composio-core");
  const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

  // Check what connections exist for this entity
  const all = await toolset.client.connectedAccounts.list({});
  const connections = all.items
    .filter((c: Record<string, unknown>) => c.clientUniqueUserId === entityId)
    .map((c: Record<string, unknown>) => ({ id: c.id, appName: c.appName, status: c.status }));

  // Try fetching calendar events
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  let calResult = null;
  let calError = null;
  try {
    const result = await toolset.executeAction({
      action: "GOOGLECALENDAR_EVENTS_LIST",
      params: {
        calendarId: "primary",
        timeMin: monday.toISOString(),
        timeMax: sunday.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 10,
      },
      entityId,
    });
    calResult = result;
  } catch (e) {
    calError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({ entityId, connections, calResult, calError });
}
