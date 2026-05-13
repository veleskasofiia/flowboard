"use client";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const LINKS = [
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/connect",    label: "Connect Apps" },
  { href: "/connected",  label: "Workflow Builder" },
  { href: "/",           label: "Home" },
];

export default function NavBar({ onSignOut }: { onSignOut?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    if (onSignOut) onSignOut();
    else router.push("/");
  }

  return (
    <header className="app-nav">
      <a href="/dashboard" className="app-nav-logo">
        <Image src="/logo.svg" alt="FlowBoard" width={30} height={30} />
        <span>FlowBoard</span>
      </a>
      <nav className="app-nav-links">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`app-nav-link${pathname === link.href ? " active" : ""}`}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <button className="app-nav-signout" onClick={handleSignOut}>Sign Out</button>
    </header>
  );
}
