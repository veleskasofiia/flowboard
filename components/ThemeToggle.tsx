"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="ml-auto px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
