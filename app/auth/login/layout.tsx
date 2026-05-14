import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sign In — FlowBoard" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
