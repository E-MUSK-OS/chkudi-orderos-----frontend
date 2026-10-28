"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThemeSelectOption {
  value: string;
  label: string;
}

export interface ThemeSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: ThemeSelectOption[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
  disabled?: boolean;
}

export default function ThemeSelectDropdown({
  value,
  onChange,
  options,
  icon,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  align = "left",
  ariaLabel,
  disabled = false,
}: ThemeSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const selectedOption = options.find(
    (opt) => opt.value.toLowerCase() === (value || "").toLowerCase()
  );

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 rounded-2xl border px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs outline-none select-none",
          "bg-white dark:bg-[#0B0F17] dark:text-white",
          isOpen
            ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
            : "border-slate-200 dark:border-white/[0.08]",
          disabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/30",
          buttonClassName
        )}
      >
        {icon && (
          <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/15 dark:text-[#F5C451] shrink-0">
            {icon}
          </div>
        )}
        <span className="truncate flex-1 text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 min-w-full w-max max-w-[280px] rounded-2xl border border-[#E7E0D2] bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100",
            "dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-black/50",
            align === "right" ? "right-0" : "left-0",
            menuClassName
          )}
        >
          <div
            className="max-h-60 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {options.map((opt) => {
              const isSelected = opt.value.toLowerCase() === (value || "").toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-2.5
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    sm:text-sm
                    font-bold
                    transition-all
                    cursor-pointer
                    text-left
                    ${
                      isSelected
                        ? "bg-[#0A0E1A] text-[#E8C16D] shadow-xs dark:bg-[#F5C451] dark:text-black"
                        : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#E8C16D] dark:text-black shrink-0 stroke-[2.5]" />
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
