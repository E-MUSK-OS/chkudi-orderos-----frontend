"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";
import { toast } from "sonner";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownWithOtherProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  fieldKey: string;
  allowOther?: boolean;
  className?: string;
}

export default function DropdownWithOther({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  required = false,
  error,
  fieldKey,
  allowOther = true,
  className,
}: DropdownWithOtherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOtherActive, setIsOtherActive] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [localCustomOptions, setLocalCustomOptions] = useState<DropdownOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const saveOptionMutation = useSaveDropdownOption();

  // Deduplicate and merge options
  const mergedOptions: DropdownOption[] = React.useMemo(() => {
    const map = new Map<string, DropdownOption>();
    [...options, ...localCustomOptions].forEach((opt) => {
      const v = String(opt.value).trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });

    // If current value is set and not present in options, include it
    if (value && String(value).trim() && !map.has(String(value).trim().toLowerCase())) {
      map.set(String(value).trim().toLowerCase(), {
        label: String(value).trim(),
        value: String(value).trim(),
      });
    }

    return Array.from(map.values());
  }, [options, localCustomOptions, value]);

  // Check if current value is unknown
  useEffect(() => {
    if (value && !mergedOptions.some((o) => o.value.toLowerCase() === value.toLowerCase())) {
      setIsOtherActive(true);
      setCustomValue(value);
    }
  }, [value, mergedOptions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (val === "__other__") {
      setIsOtherActive(true);
      setIsOpen(false);
      setTimeout(() => customInputRef.current?.focus(), 50);
    } else {
      setIsOtherActive(false);
      onChange(val);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;

    onChange(trimmed);
    setLocalCustomOptions((prev) => [...prev, { label: trimmed, value: trimmed }]);
    toast.success(`Added "${trimmed}" to ${label.replace(/\.+$/, "")}`);

    // Persist to database for future use
    try {
      saveOptionMutation.mutate({
        field: fieldKey,
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom option:", e);
    }

    setCustomValue("");
    setIsOtherActive(false);
  };

  const selectedOption = mergedOptions.find(
    (o) => o.value.toLowerCase() === (value || "").toLowerCase()
  );

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full", className)}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {label.replace(/\.+$/, "")}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Main Select Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full h-11 sm:h-12 px-3.5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 outline-none cursor-pointer",
            "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
            "dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
            isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
            error && "border-rose-500 dark:border-rose-500",
            value ? "text-[#0A0E1A] dark:text-white" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : value ? value : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ml-2",
              isOpen && "transform rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu (no search box) */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {mergedOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                  No options available
                </div>
              ) : (
                mergedOptions.map((opt) => {
                  const isSelected = (value || "").toLowerCase() === opt.value.toLowerCase();
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full px-3 py-2 flex items-center justify-between text-xs sm:text-sm font-medium rounded-xl transition-colors text-left cursor-pointer",
                        isSelected
                          ? "bg-[#FFF9EC] text-[#B88728] font-bold border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2 text-[#B88728] dark:text-[#F5C451]" />}
                    </button>
                  );
                })
              )}

              {/* "Other" option - only "Other" */}
              {allowOther && (
                <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleSelect("__other__")}
                    className="w-full px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#F5C451] dark:hover:bg-[#F5C451]/10 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Other</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inline Custom Input when 'Other' is selected */}
      {isOtherActive && (
        <div className="p-3 rounded-2xl border border-[#E8C16D] dark:border-[#F5C451]/50 bg-[#FFFDF9] dark:bg-[#131B2E] shadow-md space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B88728] dark:text-[#F5C451]">
              Add New {label.replace(/\./g, "").trim()}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOtherActive(false);
                setCustomValue("");
              }}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={customInputRef}
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCustomSubmit();
                } else if (e.key === "Escape") {
                  setIsOtherActive(false);
                  setCustomValue("");
                }
              }}
              placeholder={`Enter new ${label.replace(/\./g, "").toLowerCase()}...`}
              className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.1] dark:bg-[#0B0F17] dark:text-white dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/20 shadow-xs"
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={!customValue.trim() || saveOptionMutation.isPending}
              className="h-10 px-4 rounded-xl bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:hover:bg-[#e6b540] dark:text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{saveOptionMutation.isPending ? "Saving..." : "Add"}</span>
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
