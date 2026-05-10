import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    // Create OAuth2 client
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Use refresh token to get a valid access token
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // Gmail API client
    const gmail = google.gmail({ version: "v1", auth });

    // Fetch unread messages
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
    });

    const unreadEmails = res.data.messages?.length || 0;

    return NextResponse.json({ unreadEmails });
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json({ unreadEmails: 0 }, { status: 500 });
  }
}
