"use client";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect",   label: "Connect Apps" },
  { href: "/workflow",  label: "Workflow Builder" },
];

export default function NavBar({ onSignOut }: { onSignOut?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("flowboard_theme");
    const dark = stored === "dark";
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? "dark" : "light";
    localStorage.setItem("flowboard_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }

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
      <button
        className="app-nav-theme"
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
      <button className="app-nav-signout" onClick={handleSignOut}>Sign Out</button>
    </header>
  );
}
