"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDown,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  Sparkles,
  Layers,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SizeMultiSelectProps {
  label?: string;
  value: string; // Comma-separated string: "10x12, 12x14, 14x16"
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  masterSku?: string;
  attributeName?: string;
  onAttributeNameChange?: (name: string) => void;
}

const COMMON_ATTRIBUTE_NAMES = [
  "Size",
  "Dimension",
  "Type",
  "Capacity",
  "Specification",
  "Bag Size",
];

const PRESET_GROUPS = [
  {
    title: "Packaging / Bags",
    items: ["10x12", "12x14", "14x16", "16x20"],
  },
  {
    title: "Apparel (Alpha)",
    items: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    title: "Apparel (Numeric)",
    items: ["28", "30", "32", "34", "36", "38"],
  },
];

export default function SizeMultiSelect({
  label = "Size List",
  value = "",
  onChange,
  required = false,
  error,
  className,
  masterSku = "SKU",
  attributeName = "Size",
  onAttributeNameChange,
}: SizeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isCustomAttr, setIsCustomAttr] = useState(false);
  const [customAttrInput, setCustomAttrInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Parse comma-separated value into array of sizes/dimensions
  const selectedSizes: string[] = useMemo(() => {
    if (!value || typeof value !== "string") return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setEditingIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Focus edit input when edit begins
  useEffect(() => {
    if (editingIndex !== null) {
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 50);
    }
  }, [editingIndex]);

  // Helper to commit array change
  const commitSizes = (newSizes: string[]) => {
    onChange(newSizes.join(", "));
  };

  // Add one or multiple sizes (supports comma separated entry)
  const handleAddSize = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const parts = trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const added: string[] = [];
    const current = [...selectedSizes];

    parts.forEach((part) => {
      const exists = current.some(
        (s) => s.toLowerCase() === part.toLowerCase()
      );
      if (!exists) {
        current.push(part);
        added.push(part);
      }
    });

    if (added.length === 0) {
      toast.info(`"${trimmed}" is already in the list.`);
    } else {
      commitSizes(current);
      toast.success(
        added.length === 1
          ? `Added "${added[0]}"`
          : `Added ${added.length} items: ${added.join(", ")}`
      );
    }

    setInputVal("");
    inputRef.current?.focus();
  };

  // Handle enter key on main input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSize();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Delete size
  const handleDeleteSize = (sizeToDelete: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = selectedSizes.filter(
      (s) => s.toLowerCase() !== sizeToDelete.toLowerCase()
    );
    commitSizes(updated);
    toast.success(`Removed "${sizeToDelete}"`);
  };

  // Start editing a size
  const handleStartEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingValue(selectedSizes[index] || "");
  };

  // Save edited size
  const handleSaveEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (editingIndex === null) return;

    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.error("Size/dimension cannot be empty.");
      return;
    }

    const current = [...selectedSizes];
    const isDuplicate = current.some(
      (s, idx) =>
        idx !== editingIndex && s.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`"${trimmed}" already exists in the list.`);
      return;
    }

    const oldVal = current[editingIndex];
    current[editingIndex] = trimmed;
    commitSizes(current);
    setEditingIndex(null);
    setEditingValue("");
    toast.success(`Updated "${oldVal}" to "${trimmed}"`);
  };

  // Cancel edit
  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingIndex(null);
    setEditingValue("");
  };

  // Clear all sizes
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSizes.length === 0) return;
    commitSizes([]);
    toast.info("Cleared all sizes.");
  };

  // Quick preset toggle/add
  const handleAddPreset = (item: string) => {
    const exists = selectedSizes.some(
      (s) => s.toLowerCase() === item.toLowerCase()
    );
    if (!exists) {
      commitSizes([...selectedSizes, item]);
    }
  };

  // Handle custom attribute name change
  const handleAttrChange = (newName: string) => {
    if (newName === "__CUSTOM__") {
      setIsCustomAttr(true);
      setCustomAttrInput("");
    } else {
      setIsCustomAttr(false);
      onAttributeNameChange?.(newName);
    }
  };

  const handleSaveCustomAttr = () => {
    const trimmed = customAttrInput.trim();
    if (trimmed) {
      onAttributeNameChange?.(trimmed);
      setIsCustomAttr(false);
    }
  };

  const effectiveMaster = masterSku.trim() || "SKU";

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full", className)}>
      {/* Label and Count */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        <label className="flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
          {attributeName && attributeName !== "Size" && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {attributeName}
            </span>
          )}
        </label>
        {selectedSizes.length > 0 && (
          <span className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451]">
            {selectedSizes.length} {selectedSizes.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {/* Main Trigger Box */}
      <div className="relative">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full min-h-[44px] sm:min-h-[48px] px-3 py-1.5 flex flex-wrap items-center gap-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-xs sm:text-sm font-semibold",
            "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
            "dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
            isOpen &&
              "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
            error && "border-rose-500 dark:border-rose-500"
          )}
        >
          {selectedSizes.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 py-1">
              <Plus size={14} className="text-[#B88728] dark:text-[#F5C451]" />
              <span className="text-xs">
                Add sizes / dimensions (e.g. 10x12, 12x14)...
              </span>
            </div>
          ) : (
            selectedSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D]/40 dark:bg-[#1E2638] dark:text-slate-200 dark:border-white/[0.08] shadow-2xs animate-in fade-in-50"
              >
                <span>{size}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSize(size, e)}
                  title={`Remove ${size}`}
                  className="hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer ml-0.5 text-slate-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}

          <div className="ml-auto flex items-center gap-1 text-[#B88728] dark:text-[#F5C451] pl-1">
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 transition-transform duration-200",
                isOpen && "transform rotate-180"
              )}
            />
          </div>
        </div>

        {/* Dropdown / Management Panel */}
        {isOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-2 w-full min-w-[340px] sm:min-w-[440px] max-w-[500px] z-50 rounded-2xl border border-slate-200 bg-white dark:border-white/[0.1] dark:bg-[#0E131F] shadow-2xl p-4 space-y-3.5 animate-in fade-in-50 zoom-in-95"
          >
            {/* Header: Title + Attribute Name Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFF9EC] dark:bg-[#1E2638] flex items-center justify-center text-[#B88728] dark:text-[#F5C451]">
                  <Layers size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Sizes & Dimensions Manager
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Add, edit or delete sizes below
                  </p>
                </div>
              </div>

              {/* Attribute Name Pill Selector */}
              {onAttributeNameChange && (
                <div className="flex items-center gap-1 text-[11px]">
                  {!isCustomAttr ? (
                    <select
                      value={
                        COMMON_ATTRIBUTE_NAMES.includes(attributeName)
                          ? attributeName
                          : "__CUSTOM__"
                      }
                      onChange={(e) => handleAttrChange(e.target.value)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] transition-all cursor-pointer"
                    >
                      {COMMON_ATTRIBUTE_NAMES.map((name) => (
                        <option key={name} value={name}>
                          Attr: {name}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Custom Name...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={customAttrInput}
                        onChange={(e) => setCustomAttrInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCustomAttr();
                          if (e.key === "Escape") setIsCustomAttr(false);
                        }}
                        placeholder="e.g. Bag Size"
                        className="w-24 px-2 py-0.5 text-[11px] font-bold rounded-lg border border-[#E8C16D] bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomAttr}
                        className="p-1 rounded bg-[#E8C16D] text-black hover:bg-[#D4A843]"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomAttr(false)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Row: Add New Size */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Add New {attributeName || "Size"} (Unlimited)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type ${attributeName.toLowerCase()} (e.g. 10x12, 12x14, S, 500ml) & hit Enter...`}
                    className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white transition-all"
                  />
                  {inputVal && (
                    <button
                      type="button"
                      onClick={() => setInputVal("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSize}
                  disabled={!inputVal.trim()}
                  className={cn(
                    "h-10 px-3.5 flex items-center gap-1.5 text-xs font-bold rounded-xl transition-all",
                    inputVal.trim()
                      ? "bg-gradient-to-r from-[#E8C16D] to-[#D4A843] text-black shadow-xs hover:brightness-105 active:scale-95 cursor-pointer"
                      : "bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500 cursor-not-allowed"
                  )}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Tip: You can type multiple values separated by commas (e.g.{" "}
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  10x12, 12x14, 14x16
                </span>
                ) and press Enter.
              </p>
            </div>

            {/* Added Sizes List (Add / Update / Delete) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span>
                  Added Items ({selectedSizes.length})
                </span>
                {selectedSizes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-500 hover:text-rose-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={10} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {selectedSizes.length === 0 ? (
                <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] text-center space-y-1 bg-slate-50/50 dark:bg-white/[0.02]">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No {attributeName.toLowerCase()}s added yet
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Type a size/dimension above and click Add or press Enter to
                    add as many as you need below.
                  </p>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {selectedSizes.map((size, index) => {
                    const isEditing = editingIndex === index;

                    if (isEditing) {
                      return (
                        <div
                          key={`edit-${index}`}
                          className="flex items-center gap-1.5 p-1.5 rounded-xl border border-[#E8C16D] bg-[#FFFDF5] dark:bg-[#1E2638] animate-in fade-in-50"
                        >
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(e);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="flex-1 h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            title="Save changes"
                            className="h-8 px-2.5 rounded-lg bg-[#E8C16D] text-black hover:bg-[#D4A843] flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            title="Cancel"
                            className="h-8 px-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`size-${size}-${index}`}
                        className="group flex items-center justify-between px-3 py-2 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-slate-100/80 dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 w-4">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {size}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => handleStartEdit(index, e)}
                            title={`Edit "${size}"`}
                            className="p-1 rounded-md text-slate-400 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:text-[#F5C451] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSize(size, e)}
                            title={`Delete "${size}"`}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Presets (Optional 1-click addition) */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Quick Presets (Click to Add)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GROUPS.map((group) => (
                  <div key={group.title} className="flex flex-wrap gap-1">
                    {group.items.map((item) => {
                      const isAdded = selectedSizes.some(
                        (s) => s.toLowerCase() === item.toLowerCase()
                      );
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddPreset(item)}
                          disabled={isAdded}
                          className={cn(
                            "px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                            isAdded
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 opacity-60 cursor-default"
                              : "bg-slate-100 text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] hover:border-[#E8C16D]/50 border border-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:border-white/[0.06]"
                          )}
                        >
                          + {item}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Variant SKU Preview */}
            {selectedSizes.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <Sparkles size={13} />
                  <span>
                    {selectedSizes.length}{" "}
                    {selectedSizes.length === 1 ? "Variant" : "Variants"} will
                    be generated on Save:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {selectedSizes.map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-slate-200 border border-amber-500/30"
                    >
                      {effectiveMaster}-{s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Done Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {selectedSizes.length} {attributeName.toLowerCase()}s selected
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#0A0E1A] text-white dark:bg-white dark:text-black hover:opacity-90 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
