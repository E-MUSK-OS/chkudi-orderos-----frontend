"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronsUpDown, Check, Plus, X, Search } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import { toast } from "sonner";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";
import { useDropdownManagementMode } from "@/components/Dashboard/Settings/Configuration/hooks/useDropdownManagementMode";

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
  hideLabel?: boolean;
  labelClassName?: string;
  buttonClassName?: string;
  menuClassName?: string;
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
  hideLabel = false,
  labelClassName,
  buttonClassName,
  menuClassName,
}: DropdownWithOtherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"down" | "up">("down");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOtherActive, setIsOtherActive] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [localCustomOptions, setLocalCustomOptions] = useState<DropdownOption[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`product_custom_opt_${fieldKey}`);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const saveOptionMutation = useSaveDropdownOption();
  const { isSettingMastersOnly } = useDropdownManagementMode();
  const effectiveAllowOther = isSettingMastersOnly ? false : allowOther;

  // Deduplicate and merge options
  const mergedOptions: DropdownOption[] = useMemo(() => {
    const map = new Map<string, DropdownOption>();
    [...options, ...localCustomOptions].forEach((opt) => {
      const v = String(opt.value).trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });

    if (value && String(value).trim() && !map.has(String(value).trim().toLowerCase())) {
      map.set(String(value).trim().toLowerCase(), {
        label: String(value).trim(),
        value: String(value).trim(),
      });
    }

    return Array.from(map.values());
  }, [options, localCustomOptions, value]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return mergedOptions;
    const query = searchTerm.toLowerCase().trim();
    return mergedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [mergedOptions, searchTerm]);

  // Determine whether to open upward or downward using vertical space
  const determineDirection = () => {
    if (!containerRef.current) return;
    const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(containerRef.current);

    if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      setOpenDirection("up");
    } else {
      setOpenDirection("down");
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      determineDirection();
      setSearchTerm("");
      setTimeout(() => {
        if (mergedOptions.length > 6) {
          searchInputRef.current?.focus();
        }
      }, 50);
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Synchronize when dropdown options are updated externally
  useEffect(() => {
    const handleSync = () => {
      setLocalCustomOptions([]);
    };
    window.addEventListener("dropdown_options_updated", handleSync);
    return () => window.removeEventListener("dropdown_options_updated", handleSync);
  }, []);

  // Safely prune local temporary options once server options include them
  useEffect(() => {
    if (localCustomOptions.length > 0) {
      const serverVals = new Set(options.map((o) => o.value.toLowerCase()));
      setLocalCustomOptions((prev) =>
        prev.filter((item) => !serverVals.has(item.value.toLowerCase()))
      );
    }
  }, [options]);

  const handleSelect = (val: string) => {
    if (val === "__other__") {
      if (!effectiveAllowOther) return;
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
    if (!trimmed) {
      setIsOtherActive(false);
      return;
    }

    const newOpt: DropdownOption = { label: trimmed, value: trimmed };
    const updated = [...localCustomOptions, newOpt];
    setLocalCustomOptions(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`product_custom_opt_${fieldKey}`, JSON.stringify(updated));
      } catch {}
    }
    onChange(trimmed);

    // Persist option to backend Database
    saveOptionMutation.mutate(
      {
        field: fieldKey,
        value: trimmed,
        label: trimmed,
      },
      {
        onSuccess: () => {
          toast.success(`Added "${trimmed}" to ${label.replace(/\.+$/, "")}`);
        },
        onError: (err: any) => {
          toast.error(err?.message || `Failed to save option "${trimmed}" to database`);
        },
      }
    );

    setIsOtherActive(false);
    setCustomValue("");
    setSearchTerm("");
  };

  const selectedOption = mergedOptions.find(
    (o) => o.value.toLowerCase() === (value || "").toLowerCase()
  );

  return (
    <div
      ref={containerRef}
      className={cn("space-y-1.5 w-full", isOpen && "relative z-40", className)}
    >
      {!hideLabel && (
        <label
          className={cn(
            "block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight",
            labelClassName
          )}
        >
          {label.replace(/\.+$/, "")}
          {required && !label.includes("*") && (
            <span className="text-rose-500 ml-0.5">*</span>
          )}
        </label>
      )}

      {/* Main Trigger / Other Input */}
      {isOtherActive && effectiveAllowOther ? (
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
            placeholder={`Enter custom ${label.replace(/[\.\*]/g, "").trim()}...`}
            className="flex-1 h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#F5C451] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white outline-none focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOtherActive(false);
              setCustomValue("");
            }}
            className="h-11 sm:h-12 px-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className={cn("relative", isOpen && "z-50")}>
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "w-full h-11 sm:h-12 px-3.5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 outline-none cursor-pointer",
              "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
              "dark:border-white/[0.08] dark:bg-[#131926] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
              isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
              error && "border-rose-500 dark:border-rose-500",
              value ? "text-[#0A0E1A] dark:text-white" : "text-slate-400 dark:text-slate-500",
              buttonClassName
            )}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : value ? value : placeholder}
            </span>
            <ChevronsUpDown
              size={15}
              className={cn(
                "shrink-0 text-slate-400 dark:text-slate-400 ml-2 transition-transform duration-200",
                isOpen && "text-[#B88728] dark:text-[#F5C451]"
              )}
            />
          </button>

          {/* Dropdown Menu - Auto flips upward or downward */}
          {isOpen && (
            <div
              className={cn(
                "absolute z-50 left-0 right-0 min-w-[200px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in-50 duration-150",
                openDirection === "up"
                  ? "bottom-full mb-1.5 origin-bottom zoom-in-95"
                  : "top-full mt-1.5 origin-top zoom-in-95",
                menuClassName
              )}
            >
              {/* Optional Search Filter when > 6 options */}
              {mergedOptions.length > 6 && (
                <div className="p-2 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 px-2.5 h-8 bg-white dark:bg-[#131926] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                    <Search size={13} className="text-slate-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search options..."
                      className="w-full text-xs font-semibold bg-transparent outline-none text-[#0A0E1A] dark:text-white placeholder:text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-400 text-center">
                    No matching options
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected =
                      (value || "").toLowerCase() === opt.value.toLowerCase();
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
                        {isSelected && (
                          <Check
                            size={14}
                            className="shrink-0 text-[#B88728] dark:text-[#F5C451] ml-2"
                          />
                        )}
                      </button>
                    );
                  })
                )}

                {effectiveAllowOther && (
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => handleSelect("__other__")}
                      className="w-full px-3 py-2 flex items-center gap-2 text-xs font-bold text-[#B88728] dark:text-[#F5C451] hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/10 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <Plus size={14} className="shrink-0" />
                      <span>+ Other (Enter custom value)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
