"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { FieldGroup } from "../types/settingMasters.types";

interface FieldGroupsPanelProps {
  groups: FieldGroup[];
  selectedGroup: FieldGroup | null;
  onSelectGroup: (group: FieldGroup) => void;
  onOpenAddGroupModal: () => void;
  isLoading?: boolean;
}

export default function FieldGroupsPanel({
  groups,
  selectedGroup,
  onSelectGroup,
  onOpenAddGroupModal,
  isLoading = false,
}: FieldGroupsPanelProps) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.field.toLowerCase().includes(q)
    );
  }, [groups, search]);

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
              placeholder="Global search..."
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

        {/* Filter Toggle Button */}
        <button
          type="button"
          className="grid h-9.5 w-9.5 place-items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-2xs shrink-0"
          title="Filter groups"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>

        {/* + Group Button */}
        <button
          type="button"
          onClick={onOpenAddGroupModal}
          className="inline-flex items-center gap-1.5 h-9.5 px-3 rounded-xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98]"
          title="Add dynamic field group"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Group</span>
        </button>
      </div>

      {/* Field Groups Table */}
      <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.04]">
        {/* Table Header matching Amazon Order Process style */}
        <div className="grid grid-cols-12 px-4 py-3 bg-[#0A0E1A] dark:bg-[#080B11] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] sticky top-0 z-10">
          <div className="col-span-2 text-center">No.</div>
          <div className="col-span-10">Field Groups</div>
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
                className={`grid grid-cols-12 items-center px-4 py-2 cursor-pointer transition-colors ${
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
                <div className="col-span-10 flex items-center justify-between pr-2">
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl transition-all ${
                      isSelected
                        ? "px-3.5 py-1.5 bg-[#E8C16D] dark:bg-white text-[#0A0E1A] dark:text-black font-extrabold shadow-xs"
                        : "text-xs font-medium text-slate-700 dark:text-slate-300 py-1"
                    }`}
                  >
                    <span className="text-xs sm:text-[13px] tracking-tight">{group.label}</span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold ${
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
