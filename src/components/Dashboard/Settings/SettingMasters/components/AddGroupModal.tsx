"use client";

import React, { useState } from "react";
import { X, Layers, Plus } from "lucide-react";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, initialValue?: string) => void;
  isCreating: boolean;
}

export default function AddGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  isCreating,
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [initialValue, setInitialValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    onCreateGroup(groupName.trim(), initialValue.trim() || undefined);
    setGroupName("");
    setInitialValue("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0A0E1A] dark:text-white">
                Add New Field Group
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Creates a new dynamic master dropdown category
              </p>
            </div>
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
              Field Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Warehouse Zone, Courier Partner, Fabric Type"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Will automatically convert into a standardized master field key
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              First Option Value <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
              placeholder="e.g. Zone A (North), BlueDart Express"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !groupName.trim()}
              className="px-5 py-2 rounded-xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isCreating ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

