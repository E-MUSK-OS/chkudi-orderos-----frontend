"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import type { DropdownOptionItem } from "@/utils/dropdownOptions.utils";

interface AttributeValueMultiSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOptionItem[];
  placeholder?: string;
  error?: string;
}

export default function AttributeValueMultiSelect({
  value = "",
  onChange,
  options,
  placeholder = "Select values...",
  error,
}: AttributeValueMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"down" | "up">("down");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = useMemo(() => {
    return String(value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  const determineDirection = () => {
    if (!containerRef.current) return;
    const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(containerRef.current);
    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      setOpenDirection("up");
    } else {
      setOpenDirection("down");
    }
  };

  const handleToggleOpen = () => {
    if (!isOpen) determineDirection();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const cleanVal = val.trim();
    if (!cleanVal) return;
    const exists = selectedValues.some(
      (s) => s.toLowerCase() === cleanVal.toLowerCase()
    );
    const next = exists
      ? selectedValues.filter((s) => s.toLowerCase() !== cleanVal.toLowerCase())
      : [...selectedValues, cleanVal];
    onChange(next.join(", "));
  };

  const removeOption = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = selectedValues.filter(
      (s) => s.toLowerCase() !== val.toLowerCase()
    );
    onChange(next.join(", "));
  };

  return (
    <div ref={containerRef} className={cn("relative", isOpen ? "z-50" : "z-0")}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleOpen();
          }
        }}
        className={cn(
          "min-h-11 sm:min-h-12 w-full px-3 py-1.5 rounded-xl sm:rounded-2xl border bg-white dark:bg-[#0B0F17] flex items-center justify-between gap-2 cursor-pointer transition-all shadow-xs",
          error
            ? "border-rose-400 dark:border-rose-500/60"
            : isOpen
            ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/20 dark:border-[#F5C451] dark:ring-[#F5C451]/20"
            : "border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate px-0.5">
              {placeholder}
            </span>
          ) : (
            selectedValues.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E8C16D]/50 dark:border-[#F5C451]/30 bg-[#FFF9EC] dark:bg-[#F5C451]/15 px-2 py-0.5 text-xs font-bold text-[#8C6214] dark:text-[#F5C451]"
              >
                <span className="truncate max-w-[140px]">{val}</span>
                <button
                  type="button"
                  onClick={(e) => removeOption(val, e)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  aria-label={`Remove ${val}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] p-2 shadow-xl space-y-1.5",
            openDirection === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          {options.length > 6 && (
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search options..."
                className="h-8 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0F17] pl-8 pr-2.5 text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] dark:focus:border-[#F5C451]"
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optionValue = opt.label || opt.value;
                const isSelected = selectedValues.some(
                  (s) => s.toLowerCase() === optionValue.toLowerCase()
                );
                return (
                  <button
                    key={`${opt.value}-${opt.label}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(optionValue);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left",
                      isSelected
                        ? "bg-[#FFF9EC] dark:bg-[#F5C451]/15 text-[#8C6214] dark:text-[#F5C451]"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="truncate">{optionValue}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
