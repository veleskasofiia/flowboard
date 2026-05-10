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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Providers>
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-800 shadow-md">
            <Navbar />
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
