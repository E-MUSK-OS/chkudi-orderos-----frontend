"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { SettingOptionItem, FieldGroup } from "../types/settingMasters.types";

interface AddEditOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: FieldGroup | null;
  editingOption: SettingOptionItem | null;
  onSave: (data: { value: string; label: string; isActive: boolean }) => void;
  isSaving: boolean;
}

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

  useEffect(() => {
    if (editingOption) {
      setValue(editingOption.value || "");
      setLabel(editingOption.label || editingOption.value || "");
      setIsActive(editingOption.isActive !== false);
    } else {
      setValue("");
      setLabel("");
      setIsActive(true);
    }
  }, [editingOption, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSave({
      value: value.trim(),
      label: label.trim() || value.trim(),
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-extrabold text-[#0A0E1A] dark:text-white">
              {editingOption ? "Edit Value" : "Add New Value"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Field Group: <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">{selectedGroup?.label}</span>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Option Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (!label || label === value) setLabel(e.target.value);
              }}
              placeholder="e.g. Navy Blue, Cotton 100%, Warehouse A"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Display Label <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Display text shown in form dropdowns"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Status</span>
              <p className="text-[11px] text-slate-400">Available in form dropdowns when active</p>
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
              disabled={isSaving || !value.trim()}
              className="px-5 py-2 rounded-xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isSaving ? "Saving..." : editingOption ? "Update Option" : "Save Option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

