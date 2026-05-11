import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Providers from "../components/Providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Composio Dashboard",
  description: "Integration dashboard with Gmail, Calendar, Notion, Slack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex bg-white text-gray-900">
        <Providers>
          <aside className="w-64 border-r border-gray-200 bg-white">
            <Navbar />
          </aside>
          <main className="flex-1 p-10 overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
