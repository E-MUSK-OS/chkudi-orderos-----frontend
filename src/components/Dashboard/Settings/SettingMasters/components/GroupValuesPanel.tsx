"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Plus, Edit3, Trash2, X, RefreshCw } from "lucide-react";
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
}

export default function GroupValuesPanel({
  selectedGroup,
  options,
  isLoading,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onToggleActive,
  isToggling = false,
}: GroupValuesPanelProps) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.value.toLowerCase().includes(q) ||
        (opt.label && opt.label.toLowerCase().includes(q))
    );
  }, [options, search]);

  return (
    <div className="flex flex-col h-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-3 sm:p-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white">
            {selectedGroup ? selectedGroup.label : "Values"}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-bold border border-[#E8C16D]/30">
            {filteredOptions.length}
          </span>
        </div>

        <div className="flex items-center gap-2 max-w-xs w-full justify-end">
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

          <button
            type="button"
            className="grid h-9.5 w-9.5 place-items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-2xs shrink-0"
            title="Filter options"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Values Table */}
      <div className="flex-1 overflow-y-auto max-h-[550px] divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.04]">
        {/* Table Header matching Amazon Order Process style */}
        <div className="grid grid-cols-12 px-4 py-3 bg-[#0A0E1A] dark:bg-[#080B11] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] sticky top-0 z-10">
          <div className="col-span-1 text-center">No.</div>
          <div className="col-span-6 pl-2">Value</div>
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
              <span>Add First Option</span>
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

                {/* Value */}
                <div className="col-span-6 pl-2 flex items-center gap-2">
                  <span className="text-xs sm:text-[13px] font-semibold text-[#0A0E1A] dark:text-white truncate">
                    {opt.label || opt.value}
                  </span>
                  {opt.label && opt.label !== opt.value && (
                    <span className="text-[10px] text-slate-400">({opt.value})</span>
                  )}
                </div>

                {/* Active Toggle Switch */}
                <div className="col-span-2 flex items-center justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={opt.isActive}
                    disabled={isToggling}
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
                  {/* Edit Pencil Button */}
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(opt)}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-2xs"
                    title="Edit value"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Trash Button */}
                  <button
                    type="button"
                    onClick={() => onOpenDeleteModal(opt)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white dark:bg-red-950/30 dark:hover:bg-red-600 transition-all cursor-pointer shadow-2xs"
                    title="Delete value"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom + Add Button matching user reference image */}
      <div className="p-3 sm:p-3.5 border-t border-[#E7E0D2] dark:border-white/[0.06] bg-slate-50/40 dark:bg-white/[0.01]">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-white text-[#0A0E1A] dark:text-black font-extrabold text-xs shadow-xs border border-slate-200 dark:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}
