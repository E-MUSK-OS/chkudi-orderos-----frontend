"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, FolderGit2, Plus } from "lucide-react";
import { DEPARTMENT_OPTIONS } from "../types/userManagement.types";
import { useUserDropdownOptions, useSaveUserDropdownOption } from "../hooks/useManageUsers";
import { toast } from "sonner";

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export default function DepartmentSelect({ value = [], onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOtherActive, setIsOtherActive] = useState(false);
  const [customDept, setCustomDept] = useState("");
  const [localCustomDepts, setLocalCustomDepts] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const { data: dropdownData } = useUserDropdownOptions();
  const saveOptionMutation = useSaveUserDropdownOption();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Combine default, DB-stored, and local departments
  const allDepartments = React.useMemo(() => {
    const set = new Set<string>();
    DEPARTMENT_OPTIONS.forEach((d) => set.add(d));
    (dropdownData?.departments || []).forEach((d) => set.add(d));
    localCustomDepts.forEach((d) => set.add(d));
    value.forEach((d) => set.add(d));
    return Array.from(set);
  }, [dropdownData?.departments, localCustomDepts, value]);

  const filtered = allDepartments.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleDept = (dept: string) => {
    if (value.includes(dept)) {
      onChange(value.filter((item) => item !== dept));
    } else {
      onChange([...value, dept]);
    }
  };

  const handleAddCustomDept = () => {
    const trimmed = customDept.trim();
    if (!trimmed) return;

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setLocalCustomDepts((prev) => [...prev, trimmed]);
    toast.success(`Added "${trimmed}" to Departments`);

    // Persist to database
    saveOptionMutation.mutate({
      field: "department",
      value: trimmed,
      label: trimmed,
    });

    setCustomDept("");
    setIsOtherActive(false);
  };

  const displayText =
    value.length === 0
      ? "Select Departments"
      : value.length === 1
      ? value[0]
      : `${value.length} Departments Selected`;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white cursor-pointer shadow-xs ${
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-500"
            : open
            ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
            : "border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] focus:border-[#E8C16D]"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
            <FolderGit2 className="h-3 w-3" />
          </div>
          <span className={value.length === 0 ? "text-slate-400 dark:text-slate-500 font-normal" : "font-semibold truncate"}>
            {displayText}
          </span>
        </div>
        <ChevronDown size={14} className={`text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-[calc(100%+8px)] w-full min-w-[260px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl p-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Department..."
              className="w-full h-9 pl-9 pr-3 rounded-xl text-xs bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D]"
            />
          </div>

          {/* Department List */}
          <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 pr-0.5 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                No department found
              </div>
            ) : (
              filtered.map((dept) => {
                const checked = value.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                      checked
                        ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs"
                        : "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{dept}</span>
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
              })
            )}
          </div>

          {/* "Other" Option button / Inline Adder */}
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.06]">
            {!isOtherActive ? (
              <button
                type="button"
                onClick={() => {
                  setIsOtherActive(true);
                  setTimeout(() => customInputRef.current?.focus(), 50);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D]/10 rounded-xl transition-colors text-left cursor-pointer"
              >
                <Plus size={14} />
                <span>Other (Add New Department)</span>
              </button>
            ) : (
              <div className="p-1.5 rounded-xl border border-[#E8C16D] dark:border-[#F5C451]/40 bg-[#FFFDF9] dark:bg-[#131B2E] space-y-1.5">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDept();
                    }
                  }}
                  placeholder="Enter other department..."
                  className="w-full h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white"
                />
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOtherActive(false)}
                    className="h-7 px-2.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomDept}
                    disabled={!customDept.trim() || saveOptionMutation.isPending}
                    className="h-7 px-3 rounded-lg bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {saveOptionMutation.isPending ? "Saving..." : "Add"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
