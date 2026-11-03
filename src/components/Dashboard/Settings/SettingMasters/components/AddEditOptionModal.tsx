"use client";

import React, { useState, useEffect } from "react";
import { X, Pipette } from "lucide-react";
import { SettingOptionItem, FieldGroup } from "../types/settingMasters.types";

interface AddEditOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: FieldGroup | null;
  editingOption: SettingOptionItem | null;
  onSave: (data: { value: string; label: string; isActive: boolean }) => void;
  isSaving: boolean;
}

const PRESET_COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#FBBF24" },
  { name: "Orange", hex: "#F97316" },
  { name: "Red", hex: "#EF4444" },
  { name: "Maroon", hex: "#800000" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Beige", hex: "#D2B48C" },
  { name: "Brown", hex: "#78350F" },
  { name: "Grey", hex: "#6B7280" },
];

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

const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

export default function AddEditOptionModal({
  isOpen,
  onClose,
  selectedGroup,
  editingOption,
  onSave,
  isSaving,
}: AddEditOptionModalProps) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [labelError, setLabelError] = useState("");
  const [valueError, setValueError] = useState("");

  const isColorGroup = selectedGroup?.field?.toLowerCase() === "color";

  useEffect(() => {
    setLabelError("");
    setValueError("");

    if (editingOption) {
      if (isColorGroup) {
        const rawVal = editingOption.value || "";
        const rawLabel = editingOption.label || editingOption.value || "";
        setLabel(rawLabel);

        if (rawVal.startsWith("#") && isValidHex(rawVal)) {
          setValue(rawVal.toUpperCase());
        } else {
          const mapped = KNOWN_COLOR_MAP[rawVal.toLowerCase()] || KNOWN_COLOR_MAP[rawLabel.toLowerCase()] || "#000000";
          setValue(mapped.toUpperCase());
        }
      } else {
        setLabel(editingOption.label || editingOption.value || "");
        setValue(editingOption.value || "");
      }
      setIsActive(editingOption.isActive !== false);
    } else {
      if (isColorGroup) {
        // For Color, do NOT take default group label name (keep empty for typing color name)
        setLabel("");
        setValue("#000000");
      } else {
        setLabel("");
        setValue("");
      }
      setIsActive(true);
    }
  }, [editingOption, isOpen, isColorGroup, selectedGroup]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLabelError("");
    setValueError("");

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setLabelError(isColorGroup ? "Color name is required" : `${selectedGroup?.label || "Option"} is required`);
      return;
    }

    if (isColorGroup) {
      let cleanHex = value.trim();
      if (!cleanHex.startsWith("#") && cleanHex) {
        cleanHex = `#${cleanHex}`;
      }

      if (!isValidHex(cleanHex)) {
        setValueError("Please enter a valid hex code (e.g. #FFFFFF or #1E3A8A)");
        return;
      }

      onSave({
        value: cleanHex.toUpperCase(),
        label: trimmedLabel,
        isActive,
      });
    } else {
      onSave({
        value: trimmedLabel,
        label: trimmedLabel,
        isActive,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-extrabold text-[#0A0E1A] dark:text-white">
              {editingOption
                ? isColorGroup
                  ? "Edit Color"
                  : `Edit ${selectedGroup?.label || "Option"}`
                : isColorGroup
                ? "Add New Color"
                : `Add ${selectedGroup?.label || "Option"}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Field Group:{" "}
              <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">
                {selectedGroup?.label}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isColorGroup ? (
            <>
              {/* 1. Label First (Color Name) - NOT OPTIONAL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Name (Label) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (labelError) setLabelError("");
                  }}
                  placeholder="e.g. Navy Blue, Sky Blue, Forest Green"
                  className={`w-full h-11 px-3.5 rounded-xl border ${
                    labelError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D] focus:ring-[#E8C16D]/20"
                  } bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:ring-2 shadow-xs transition-all`}
                  autoFocus
                />
                {labelError && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">{labelError}</p>
                )}
              </div>

              {/* 2. Value Second (Hex Code Writing Option + Picker) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hex Code (Value) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                    {isValidHex(value) ? value.toUpperCase() : "Invalid Hex"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Color Picker Swatch Button */}
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 rounded-xl border border-slate-300 dark:border-white/[0.15] shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      style={{ backgroundColor: isValidHex(value) ? value : "#000000" }}
                    >
                      <Pipette className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    </div>
                    <input
                      type="color"
                      value={isValidHex(value) ? value : "#000000"}
                      onChange={(e) => {
                        setValue(e.target.value.toUpperCase());
                        if (valueError) setValueError("");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Click to open color picker"
                    />
                  </div>

                  {/* Hex Code Writing Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={value}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (!val.startsWith("#") && val.length > 0) val = `#${val}`;
                        setValue(val);
                        if (valueError) setValueError("");
                      }}
                      placeholder="#000000"
                      maxLength={7}
                      className={`w-full h-11 px-3.5 rounded-xl border ${
                        valueError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D] focus:ring-[#E8C16D]/20"
                      } bg-white dark:bg-[#080B11] text-xs sm:text-sm font-mono font-bold text-[#0A0E1A] dark:text-white outline-none focus:ring-2 shadow-xs uppercase transition-all`}
                    />
                  </div>
                </div>
                {valueError && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">{valueError}</p>
                )}

                {/* Quick Presets Swatches */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Quick Preset Colors:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected =
                        value.toUpperCase() === preset.hex.toUpperCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setValue(preset.hex.toUpperCase());
                            if (!label.trim()) setLabel(preset.name);
                            if (valueError) setValueError("");
                            if (labelError) setLabelError("");
                          }}
                          className={`w-6 h-6 rounded-md border transition-all hover:scale-110 cursor-pointer shadow-2xs ${
                            isSelected
                              ? "ring-2 ring-[#E8C16D] scale-105 border-white"
                              : "border-slate-300 dark:border-white/20 hover:border-[#E8C16D]"
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={`${preset.name} (${preset.hex})`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {selectedGroup?.label || "Option"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => {
                  const val = e.target.value;
                  setLabel(val);
                  setValue(val);
                  if (labelError) setLabelError("");
                }}
                placeholder={selectedGroup?.label ? `Enter ${selectedGroup.label.toLowerCase()}...` : "Enter option..."}
                onFocus={(e) => e.target.select()}
                className={`w-full h-11 px-3.5 rounded-xl border ${
                  labelError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D] focus:ring-[#E8C16D]/20"
                } bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:ring-2 shadow-xs transition-all`}
                autoFocus
              />
              {labelError && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{labelError}</p>
              )}
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Active Status
              </span>
              <p className="text-[11px] text-slate-400">
                Available in form dropdowns when active
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !label.trim()}
              className="px-5 py-2 rounded-xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving
                ? "Saving..."
                : editingOption
                ? isColorGroup
                  ? "Update Color"
                  : "Update Option"
                : isColorGroup
                ? "Save Color"
                : "Save Option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
