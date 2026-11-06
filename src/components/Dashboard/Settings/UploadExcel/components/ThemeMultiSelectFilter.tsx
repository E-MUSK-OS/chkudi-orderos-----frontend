"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface ThemeMultiSelectFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function ThemeMultiSelectFilter({
  value = [],
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  onOpenChange,
}: ThemeMultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click & recalculate direction on scroll/resize
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchQuery("");
      }
    }
    const handleScrollOrResize = () => {
      determineDirection();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleScrollOrResize, { passive: true });
      window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, onOpenChange]);

  // Determine direction to open
  const determineDirection = () => {
    if (!containerRef.current) return;
    const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(containerRef.current);
    const neededSpace = Math.min(Math.max(realOptions.length * 36 + 90, 120), 300);
    if (spaceBelow >= neededSpace) {
      setOpenUpward(false);
    } else if (spaceAbove >= neededSpace) {
      setOpenUpward(true);
    } else {
      setOpenUpward(spaceAbove > spaceBelow);
    }
  };

  const handleToggleOpen = () => {
    if (!isOpen) determineDirection();
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
    setSearchQuery("");
  };

  // Filter options by search query (skipping "All" from search list)
  const realOptions = useMemo(() => {
    return options.filter((opt) => opt.value !== "All");
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return realOptions;
    const q = searchQuery.toLowerCase();
    return realOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [realOptions, searchQuery]);

  const isAllSelected =
    value.length === 0 ||
    value.includes("All") ||
    (realOptions.length > 0 && value.length === realOptions.length);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(["All"]);
    }
  };

  const handleOptionToggle = (optVal: string) => {
    if (optVal === "All") {
      onChange(["All"]);
      return;
    }

    // If currently "All", clicking a specific option selects only that option
    if (value.includes("All") || value.length === 0) {
      onChange([optVal]);
      return;
    }

    if (value.includes(optVal)) {
      const next = value.filter((v) => v !== optVal);
      onChange(next.length === 0 ? ["All"] : next);
    } else {
      const next = [...value, optVal];
      if (next.length === realOptions.length) {
        onChange(["All"]);
      } else {
        onChange(next);
      }
    }
  };

  // Display text in button
  const displayText = useMemo(() => {
    if (isAllSelected || value.length === 0 || value.includes("All")) {
      return placeholder;
    }
    if (value.length === 1) {
      const found = realOptions.find((o) => o.value === value[0]);
      return found ? found.label : value[0];
    }
    if (value.length === 2) {
      const label1 = realOptions.find((o) => o.value === value[0])?.label || value[0];
      const label2 = realOptions.find((o) => o.value === value[1])?.label || value[1];
      return `${label1}, ${label2}`;
    }
    const first = realOptions.find((o) => o.value === value[0])?.label || value[0];
    return `${first} (+${value.length - 1})`;
  }, [isAllSelected, value, placeholder, realOptions]);

  const hasSpecificSelection = !isAllSelected && value.length > 0 && !value.includes("All");

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", isOpen ? "z-50" : "z-0", className)}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className={cn(
          "inline-flex items-center justify-between gap-2 h-8.5 px-3.5 text-xs rounded-xl transition-all cursor-pointer select-none outline-none shadow-xs",
          "bg-white dark:bg-[#131622] border border-[#E7E0D2] dark:border-white/[0.08] text-slate-800 dark:text-white font-medium",
          "hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/30",
          hasSpecificSelection && "border-[#B88728] dark:border-[#F5C451] text-[#B88728] dark:text-[#F5C451]",
          isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30",
          buttonClassName
        )}
      >
        <span className="truncate max-w-[170px]">{displayText}</span>
        {hasSpecificSelection && (
          <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF9EC] text-[#B88728] border border-[#B88728]/20 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/20">
            {value.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute z-50 min-w-[220px] max-w-[300px] w-max rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-xl dark:shadow-black/50 p-1.5 text-xs animate-in fade-in duration-100",
            openUpward ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
          )}
        >
          {/* Optional Search bar if more than 5 options */}
          {realOptions.length > 5 && (
            <div className="px-1.5 pb-1.5 pt-0.5 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-[#E7E0D2] dark:border-white/[0.08]">
                <Search className="h-3 w-3 text-[#B88728] dark:text-[#F5C451] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Select All Option */}
          <div
            onClick={handleSelectAllToggle}
            className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer select-none hover:bg-[#FFF9EC] dark:hover:bg-white/10 transition-colors font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-white/[0.08] my-0.5"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "h-4 w-4 rounded-md border flex items-center justify-center transition-colors shrink-0",
                  isAllSelected
                    ? "bg-[#B88728] dark:bg-[#F5C451] border-[#B88728] dark:border-[#F5C451] text-white dark:text-slate-900"
                    : "border-slate-300 dark:border-white/[0.2] bg-white dark:bg-transparent"
                )}
              >
                {isAllSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>
              <span>Select All</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              ({realOptions.length})
            </span>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto py-0.5 flex flex-col gap-0.5 pr-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-slate-400 text-[11px]">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = isAllSelected || value.includes(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleOptionToggle(opt.value)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-[#FFF9EC] dark:bg-white/[0.06] text-[#B88728] dark:text-[#F5C451] font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-[#B88728] dark:bg-[#F5C451] border-[#B88728] dark:border-[#F5C451] text-white dark:text-slate-900"
                            : "border-slate-300 dark:border-white/[0.2] bg-white dark:bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
