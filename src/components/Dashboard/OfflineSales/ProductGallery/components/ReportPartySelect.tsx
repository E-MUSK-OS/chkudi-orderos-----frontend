"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Search } from "lucide-react";
import { challanService } from "../../SalesChallan/services/challan.service";
import type { Party } from "../../SalesChallan/types/challan.types";

interface ReportPartySelectProps {
  value: string;
  onChange: (val: string) => void;
  extraPartyNames?: string[];
  className?: string;
}

export default function ReportPartySelect({
  value,
  onChange,
  extraPartyNames = [],
  className = "w-36",
}: ReportPartySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data: allParties = [] } = useQuery<Party[]>({
    queryKey: ["gallery-parties"],
    queryFn: () => challanService.getParties(""),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const partyNames = useMemo(() => {
    const map = new Map<string, string>();
    allParties.forEach((p) => {
      const name = (p.partyName || "").trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), name);
      }
    });
    extraPartyNames.forEach((raw) => {
      const name = (raw || "").trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), name);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [allParties, extraPartyNames]);

  const filteredNames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partyNames;
    return partyNames.filter((n) => n.toLowerCase().includes(q));
  }, [partyNames, search]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
          open
            ? "border-[#E8C16D] bg-[#FFF9EC] text-[#6A4D1D] dark:border-[#F5C451] dark:bg-[#1A160E] dark:text-[#F5C451]"
            : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
        }`}
      >
        <span className="truncate">{value || "All"}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-1.5 z-50 w-52 sm:w-60 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-1.5 shadow-2xl">
          <div className="relative mb-1.5">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search party..."
              className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs font-medium text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0.5">
            {(!search.trim() || "all".includes(search.trim().toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onChange("All");
                  setOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  value === "All"
                    ? "bg-[#FFF9EC] text-[#7A581F] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                }`}
              >
                <span>All</span>
                {value === "All" && <Check size={12} />}
              </button>
            )}

            {filteredNames.length === 0 ? (
              <p className="px-2.5 py-2 text-[11px] text-slate-400 text-center">
                No matching party
              </p>
            ) : (
              filteredNames.map((name) => {
                const isSelected = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 text-left text-xs font-semibold cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF9EC] text-[#7A581F] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="truncate">{name}</span>
                    {isSelected && <Check size={12} className="shrink-0" />}
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
