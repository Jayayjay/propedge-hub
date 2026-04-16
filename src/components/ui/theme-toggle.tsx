"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`relative h-9 w-9 flex items-center justify-center rounded-lg border border-white/10 dark:border-white/10 dark:hover:bg-white/5 hover:bg-black/5 transition-all ${className ?? ""}`}
    >
      <Sun className="h-[15px] w-[15px] absolute transition-all scale-0 rotate-90 dark:scale-0 light:scale-100 text-[#555]
        [.light_&]:scale-100 [.light_&]:rotate-0" />
      <Moon className="h-[15px] w-[15px] transition-all dark:scale-100 dark:rotate-0 scale-0 -rotate-90 text-[#888]" />
    </button>
  );
}
