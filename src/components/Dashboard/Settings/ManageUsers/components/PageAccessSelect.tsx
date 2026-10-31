"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Shield } from "lucide-react";
import { PAGE_ACCESS_OPTIONS } from "../types/userManagement.types";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxAllowedPages?: string[];
}

export default function PageAccessSelect({ value = [], onChange, error, maxAllowedPages }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const availableOptions = React.useMemo(() => {
    if (!maxAllowedPages || maxAllowedPages.includes("ALL")) {
      return PAGE_ACCESS_OPTIONS;
    }
    return PAGE_ACCESS_OPTIONS.filter(
      (opt) => opt.id !== "ALL" && maxAllowedPages.includes(opt.id)
    );
  }, [maxAllowedPages]);

  const filtered = availableOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase().trim()) ||
    opt.id.toLowerCase().includes(search.toLowerCase().trim())
  );

  const togglePage = (pageId: string) => {
    if (pageId === "ALL") {
      if (value.includes("ALL")) {
        onChange([]);
      } else {
        onChange(["ALL"]);
      }
      return;
    }

    let updated: string[];
    if (value.includes("ALL")) {
      const allSpecificIds = PAGE_ACCESS_OPTIONS.filter((p) => p.id !== "ALL").map((p) => p.id);
      updated = allSpecificIds.filter((id) => id !== pageId);
    } else if (value.includes(pageId)) {
      updated = value.filter((id) => id !== pageId);
    } else {
      updated = [...value, pageId];
      const allSpecificIds = PAGE_ACCESS_OPTIONS.filter((p) => p.id !== "ALL").map((p) => p.id);
      if (allSpecificIds.every((id) => updated.includes(id))) {
        updated = ["ALL"];
      }
    }

    onChange(updated);
  };

  const removeChip = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (pageId === "ALL") {
      onChange([]);
    } else {
      onChange(value.filter((id) => id !== pageId));
    }
  };

  const isChecked = (pageId: string) => {
    if (pageId === "ALL") return value.includes("ALL");
    return value.includes("ALL") || value.includes(pageId);
  };

  return (
    <div className="w-full space-y-2.5" ref={containerRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white cursor-pointer shadow-xs ${
            error
              ? "border-red-500"
              : open
              ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
              : "border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] focus:border-[#E8C16D]"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
              <Shield className="h-3 w-3" />
            </div>
            <span className={value.length === 0 ? "text-slate-400 dark:text-slate-500 font-normal" : "font-semibold truncate"}>
              {value.includes("ALL")
                ? "ALL Pages (Full Access Granted)"
                : value.length === 0
                ? "Select Accessible Pages"
                : `${value.length} Pages Selected`}
            </span>
          </div>
          <ChevronDown size={14} className={`text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-50 left-0 top-[calc(100%+8px)] w-full min-w-[280px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl p-2 animate-in fade-in zoom-in-95 duration-100">
            {/* Search */}
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Pages..."
                className="w-full h-9 pl-9 pr-3 rounded-xl text-xs bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D]"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar">
              {filtered.map((opt) => {
                const checked = isChecked(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePage(opt.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                      checked
                        ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs"
                        : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        checked
                          ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A] dark:bg-black dark:border-black dark:text-[#F5C451]"
                          : "border-slate-300 dark:border-white/[0.2] bg-transparent"
                      }`}
                    >
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Chips matching OrderOS styling */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((pageId) => {
            const opt = PAGE_ACCESS_OPTIONS.find((p) => p.id === pageId);
            return (
              <span
                key={pageId}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] border border-[#E8C16D]/40 shadow-xs"
              >
                <span>{opt?.label.split(" (")[0] || pageId}</span>
                <button
                  type="button"
                  onClick={(e) => removeChip(e, pageId)}
                  className="hover:text-red-500 cursor-pointer p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
