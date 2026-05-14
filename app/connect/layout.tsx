import type { Metadata } from "next";
export const metadata: Metadata = { title: "Connect Apps — FlowBoard" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
