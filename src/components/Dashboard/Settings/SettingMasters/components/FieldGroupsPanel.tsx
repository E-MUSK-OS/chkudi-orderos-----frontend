"use client";

import React, { useState, useMemo } from "react";
import { Search, X, ArrowDownAZ, ArrowUpZA, RotateCcw } from "lucide-react";
import { FieldGroup } from "../types/settingMasters.types";

interface FieldGroupsPanelProps {
  groups: FieldGroup[];
  selectedGroup: FieldGroup | null;
  onSelectGroup: (group: FieldGroup) => void;
  onOpenAddGroupModal?: () => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export default function FieldGroupsPanel({
  groups,
  selectedGroup,
  onSelectGroup,
  onOpenAddGroupModal,
  isLoading = false,
  isReadOnly = false,
}: FieldGroupsPanelProps) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredGroups = useMemo(() => {
    const list = search.trim()
      ? groups.filter((g) => {
          const q = search.toLowerCase().trim();
          return (
            g.label.toLowerCase().includes(q) ||
            g.field.toLowerCase().includes(q)
          );
        })
      : groups;

    return [...list].sort((a, b) => {
      const cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [groups, search, sortOrder]);

  const isFilteredOrSorted = sortOrder !== "asc" || search.trim().length > 0;

  const handleReset = () => {
    setSortOrder("asc");
    setSearch("");
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="flex flex-col h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-3 sm:p-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] flex items-center gap-2">
        <div className="relative flex-1 group">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3 py-2 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/20 shadow-2xs">
            <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
              <Search className="h-3 w-3" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="grid h-4 w-4 place-items-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Reset Filter Icon */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!isFilteredOrSorted}
          className={`grid h-9.5 w-9.5 place-items-center rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0 ${
            isFilteredOrSorted
              ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#E8C16D]/20 active:scale-95"
              : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60"
          }`}
          title="Reset filter & sort to default (A-Z)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Field Groups Table */}
      <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.04]">
        {/* Table Header with interactive sort toggle and reset */}
        <div className="grid grid-cols-12 px-3.5 py-3 bg-[#0A0E1A] dark:bg-[#080B11] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] sticky top-0 z-10 select-none">
          <div className="col-span-2 text-center">No.</div>
          <div className="col-span-10 flex items-center justify-between pr-2">
            <button
              type="button"
              onClick={handleToggleSort}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group text-left"
              title={`Sorted ${sortOrder === "asc" ? "A-Z (Click for Z-A)" : "Z-A (Click for A-Z)"}`}
            >
              <span>Field Groups</span>
              {sortOrder === "asc" ? (
                <ArrowDownAZ className="h-3.5 w-3.5 text-[#E8C16D] group-hover:text-white transition-colors shrink-0" />
              ) : (
                <ArrowUpZA className="h-3.5 w-3.5 text-[#E8C16D] group-hover:text-white transition-colors shrink-0" />
              )}
              <span className="text-[10px] font-normal normal-case opacity-75">
                ({sortOrder === "asc" ? "A-Z" : "Z-A"})
              </span>
            </button>

            {isFilteredOrSorted && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[10px] normal-case font-semibold text-slate-400 hover:text-[#E8C16D] transition-colors cursor-pointer"
                title="Reset to default (A-Z)"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-xs font-medium text-slate-400">Loading groups...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No matching field groups found
            </p>
          </div>
        ) : (
          filteredGroups.map((group, index) => {
            const isSelected = selectedGroup?.field.toLowerCase() === group.field.toLowerCase();
            return (
              <div
                key={group.id || group.field}
                onClick={() => onSelectGroup(group)}
                className={`grid grid-cols-12 items-center px-3.5 py-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#FFF9EC]/80 dark:bg-white/[0.06]"
                    : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                {/* No. */}
                <div
                  className={`col-span-2 text-center text-xs ${
                    isSelected
                      ? "text-[#0A0E1A] dark:text-white font-black"
                      : "text-slate-400 dark:text-slate-500 font-medium"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Field Group Pill */}
                <div className="col-span-10 flex items-center justify-between pr-2 min-w-0">
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl transition-all truncate ${
                      isSelected
                        ? "px-3.5 py-1.5 bg-[#E8C16D] dark:bg-white text-[#0A0E1A] dark:text-black font-extrabold shadow-xs"
                        : "text-xs font-medium text-slate-700 dark:text-slate-300 py-1"
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] tracking-tight truncate">{group.label}</span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold shrink-0 ml-2 ${
                      isSelected
                        ? "text-[#0A0E1A] dark:text-white font-bold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {group.totalCount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
