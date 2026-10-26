"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={!mounted ? "Toggle theme" : theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="group relative grid h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FFF8E7] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#131B2E] dark:hover:text-[#F5C451] cursor-pointer shrink-0"
    >
      {!mounted ? (
        <div className="h-[18px] w-[18px]" />
      ) : theme === "dark" ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-45 text-[#F5C451]" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 -rotate-12 hover:rotate-0 text-slate-600 group-hover:text-[#C89B3C]" />
      )}

      {mounted && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-[#0A0E1A] dark:bg-[#0F1626] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-200 shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 z-50">
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
