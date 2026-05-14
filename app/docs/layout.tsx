import type { Metadata } from "next";
export const metadata: Metadata = { title: "Docs — FlowBoard" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
