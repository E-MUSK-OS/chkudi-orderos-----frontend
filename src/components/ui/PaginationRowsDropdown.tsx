"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationRowsDropdownProps {
  value: number;
  options?: number[];
  onChange: (value: number) => void;
  className?: string;
}

export default function PaginationRowsDropdown({
  value,
  options = [10, 20, 50, 100],
  onChange,
  className = "",
}: PaginationRowsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Determine opening direction based on screen position
  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 170px space below, flip upward so menu is always visible
      setOpenUpward(spaceBelow < 170);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={cn("relative inline-block select-none", isOpen ? "z-50" : "z-10", className)}
      ref={containerRef}
    >
      {/* Trigger Button matching Image 2 */}
      <button
        type="button"
        aria-label="Select rows per page"
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-lg border px-2.5 h-8 text-xs font-bold transition-all shadow-xs outline-none cursor-pointer",
          "bg-white text-[#0A0E1A] dark:bg-[#161B24] dark:text-white",
          isOpen
            ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 text-[#0A0E1A] dark:border-[#F5C451] dark:ring-[#F5C451]/30 dark:text-white"
            : "border-[#E7E0D2] hover:border-[#E8C16D]/50 hover:bg-slate-50 dark:border-white/[0.08] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]"
        )}
      >
        <span>{value}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Floating Menu matching Image 2 */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 min-w-[80px] w-max rounded-2xl border border-[#E7E0D2] bg-white p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-2xl dark:shadow-black/80 animate-in fade-in zoom-in-95 duration-100",
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5",
            "left-0"
          )}
        >
          <div className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-left",
                    isSelected
                      ? "bg-[#F5C451] text-slate-900 shadow-xs font-bold"
                      : "text-slate-700 hover:text-black hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.08]"
                  )}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-slate-900 stroke-[2.5] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

