"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Edit3, Trash2, X, RefreshCw, ArrowDownAZ, ArrowUpZA, ArrowUpDown, RotateCcw } from "lucide-react";
import { SettingOptionItem, FieldGroup } from "../types/settingMasters.types";

interface GroupValuesPanelProps {
  selectedGroup: FieldGroup | null;
  options: SettingOptionItem[];
  isLoading: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (option: SettingOptionItem) => void;
  onOpenDeleteModal: (option: SettingOptionItem) => void;
  onToggleActive: (option: SettingOptionItem, nextActive: boolean) => void;
  isToggling?: boolean;
  isReadOnly?: boolean;
}

const KNOWN_COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#000000",
  green: "#10B981",
  red: "#EF4444",
  "sky-blue": "#38BDF8",
  "sky blue": "#38BDF8",
  cream: "#FFFDD0",
  pink: "#EC4899",
  maroon: "#800000",
  blue: "#3B82F6",
  "navy blue": "#1E3A8A",
  navy: "#1E3A8A",
  gold: "#EAB308",
  clear: "#E5E7EB",
  silver: "#9CA3AF",
  brown: "#78350F",
  teal: "#0D9488",
  magenta: "#D946EF",
  yellow: "#FBBF24",
  grey: "#6B7280",
  gray: "#6B7280",
  charcoal: "#374151",
  beige: "#D2B48C",
  olive: "#556B2F",
  orange: "#F97316",
  purple: "#8B5CF6",
};

const getColorHex = (opt: SettingOptionItem): string => {
  if (opt.value && opt.value.startsWith("#")) return opt.value;
  const byVal = KNOWN_COLOR_MAP[opt.value.toLowerCase()];
  if (byVal) return byVal;
  if (opt.label) {
    const byLabel = KNOWN_COLOR_MAP[opt.label.toLowerCase()];
    if (byLabel) return byLabel;
  }
  return "#000000";
};

export default function GroupValuesPanel({
  selectedGroup,
  options,
  isLoading,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onToggleActive,
  isToggling = false,
  isReadOnly = false,
}: GroupValuesPanelProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"default" | "asc" | "desc">("default");

  const isColorGroup = selectedGroup?.field?.toLowerCase() === "color";

  const filteredOptions = useMemo(() => {
    const list = search.trim()
      ? options.filter((opt) => {
          const q = search.toLowerCase().trim();
          return (
            opt.value.toLowerCase().includes(q) ||
            (opt.label && opt.label.toLowerCase().includes(q))
          );
        })
      : options;

    if (sortMode === "asc") {
      // Sort all items A to Z
      return list.slice().sort((a, b) =>
        (a.label || a.value).localeCompare(b.label || b.value, undefined, {
          sensitivity: "base",
          numeric: true,
        })
      ).map((opt, idx) => ({ ...opt, no: idx + 1 }));
    }

    if (sortMode === "desc") {
      // Sort all items Z to A
      return list.slice().sort((a, b) =>
        (b.label || b.value).localeCompare(a.label || a.value, undefined, {
          sensitivity: "base",
          numeric: true,
        })
      ).map((opt, idx) => ({ ...opt, no: idx + 1 }));
    }

    // Default: default items first (A-Z), newly added items at the last
    const defaultItems = list.filter((item) => item.isDefault);
    const newlyAddedItems = list.filter((item) => !item.isDefault);

    defaultItems.sort((a, b) =>
      (a.label || a.value).localeCompare(b.label || b.value, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );

    newlyAddedItems.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.label || a.value).localeCompare(b.label || b.value, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });

    return [...defaultItems, ...newlyAddedItems].map((opt, idx) => ({
      ...opt,
      no: idx + 1,
    }));
  }, [options, search, sortMode]);

  const isFilteredOrSorted = sortMode !== "default" || search.trim().length > 0;

  const handleReset = () => {
    setSortMode("default");
    setSearch("");
  };

  const handleToggleValueSort = () => {
    setSortMode((prev) => {
      if (prev === "default") return "asc";
      if (prev === "asc") return "desc";
      return "asc";
    });
  };

  return (
    <div className="flex flex-col h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="px-4 sm:px-7 py-3 sm:py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white">
            {selectedGroup ? selectedGroup.label : "Values"}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-bold border border-[#E8C16D]/30">
            {filteredOptions.length}
          </span>
          {sortMode !== "default" && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8C16D]/15 text-[#B88728] dark:text-[#E8C16D] font-bold border border-[#E8C16D]/30 hidden sm:inline-flex items-center gap-1">
              {sortMode === "asc" ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpZA className="h-3 w-3" />}
              {sortMode === "asc" ? "Sorted A-Z" : "Sorted Z-A"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 max-w-sm w-full justify-end">
          <div className="relative flex-1 group">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3 py-2 transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/20 shadow-2xs">
              <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                <Search className="h-3 w-3" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search values..."
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

          {/* Reset Filter & Sort Button */}
          <button
            type="button"
            onClick={handleReset}
            disabled={!isFilteredOrSorted}
            className={`grid h-9.5 w-9.5 place-items-center rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0 ${
              isFilteredOrSorted
                ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#E8C16D]/20 active:scale-95"
                : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-60"
            }`}
            title="Reset filter & sort to default (defaults first, new added last)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Values Table */}
      <div className="flex-1 overflow-y-auto max-h-[550px] divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.04]">
        {/* Table Header matching Amazon Order Process style */}
        <div className="grid grid-cols-12 px-4 py-3 bg-[#0A0E1A] dark:bg-[#080B11] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] sticky top-0 z-10 select-none">
          <div className="col-span-1 text-center">No.</div>
          <div className="col-span-6 pl-2 flex items-center justify-between pr-2">
            <button
              type="button"
              onClick={handleToggleValueSort}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group text-left"
              title={`Sorted ${sortMode === "default" ? "Default (Click for A-Z)" : sortMode === "asc" ? "A-Z (Click for Z-A)" : "Z-A (Click for A-Z)"}`}
            >
              <span>{isColorGroup ? "Color (Name & Hex)" : "Value"}</span>
              {sortMode === "default" && (
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#E8C16D] transition-colors shrink-0" />
              )}
              {sortMode === "asc" && (
                <ArrowDownAZ className="h-3.5 w-3.5 text-[#E8C16D] group-hover:text-white transition-colors shrink-0" />
              )}
              {sortMode === "desc" && (
                <ArrowUpZA className="h-3.5 w-3.5 text-[#E8C16D] group-hover:text-white transition-colors shrink-0" />
              )}
              <span className="text-[10px] font-normal normal-case opacity-75">
                ({sortMode === "default" ? "Default" : sortMode === "asc" ? "A-Z" : "Z-A"})
              </span>
            </button>

            {sortMode !== "default" && (
              <button
                type="button"
                onClick={() => setSortMode("default")}
                className="inline-flex items-center gap-1 text-[10px] normal-case font-semibold text-slate-400 hover:text-[#E8C16D] transition-colors cursor-pointer"
                title="Reset to default sorting (defaults first, new added last)"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
          <div className="col-span-2 text-center">Active</div>
          <div className="col-span-3 text-right pr-2">Actions</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#B88728] dark:text-[#E8C16D]" />
            <p className="mt-2 text-xs text-slate-400">Loading values...</p>
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No options found for this group
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8C16D] text-[#0A0E1A] text-xs font-bold hover:bg-[#d4af5a] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isColorGroup ? "Add First Color" : "Add First Option"}</span>
            </button>
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            return (
              <div
                key={opt.id || opt.value}
                className="grid grid-cols-12 items-center px-4 py-2 hover:bg-[#FFF9EC]/40 dark:hover:bg-[#1A160E]/30 transition-colors"
              >
                {/* No. */}
                <div className="col-span-1 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  {index + 1}
                </div>

                {/* Value / Color */}
                <div className="col-span-6 pl-2 flex items-center gap-2.5">
                  {isColorGroup && (
                    <div
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: getColorHex(opt) }}
                    />
                  )}
                  <span className="text-xs sm:text-[13px] font-semibold text-[#0A0E1A] dark:text-white truncate">
                    {opt.label || opt.value}
                  </span>
                  {opt.value && opt.value.startsWith("#") ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                      {opt.value}
                    </span>
                  ) : (
                    opt.label && opt.label !== opt.value && (
                      <span className="text-[10px] text-slate-400">({opt.value})</span>
                    )
                  )}
                </div>

                {/* Active Toggle Switch */}
                <div className="col-span-2 flex items-center justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={opt.isActive}
                    disabled={isToggling || isReadOnly}
                    onClick={() => onToggleActive(opt, !opt.isActive)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      opt.isActive
                        ? "bg-[#E8C16D] dark:bg-white"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
                        opt.isActive
                          ? "translate-x-4 bg-[#0A0E1A] dark:bg-black"
                          : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="col-span-3 flex items-center justify-end gap-1.5 pr-1">
                  {isReadOnly ? (
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic pr-2">
                      View-only
                    </span>
                  ) : (
                    <>
                      {/* Edit Pencil Button */}
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(opt)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-2xs"
                        title={isColorGroup ? "Edit Color" : "Edit Option"}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Button (with light red background from reference img) */}
                      <button
                        type="button"
                        onClick={() => onOpenDeleteModal(opt)}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-red-200 dark:border-red-900/30 bg-red-500/15 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                        title={isColorGroup ? "Delete or Deactivate Color" : "Delete Option"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer with Add Button */}
      {!isReadOnly && (
        <div className="px-4 sm:px-7 py-3 sm:py-3.5 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] flex items-center justify-start">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isColorGroup ? "Add Color" : "Add"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
