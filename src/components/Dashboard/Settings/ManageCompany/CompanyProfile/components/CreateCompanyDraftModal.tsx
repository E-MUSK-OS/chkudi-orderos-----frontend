"use client";

import React, { useState } from "react";
import { Building2, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { companyService } from "../services/company.service";
import { Company } from "../types/company.types";

interface CreateCompanyDraftModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newDraft: Company) => void;
}

export default function CreateCompanyDraftModal({
  open,
  onClose,
  onSuccess,
}: CreateCompanyDraftModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    setGstNumber(val);
    if (error) setError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = companyName.trim();
    const cleanGst = gstNumber.trim().toUpperCase();

    if (!cleanName) {
      setError("Please enter the company name.");
      return;
    }

    if (!cleanGst) {
      setError("Please enter a valid GST number.");
      return;
    }

    if (cleanGst.length !== 15) {
      setError("GST number must be exactly 15 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await companyService.createDraft({
        companyName: cleanName,
        gstNumber: cleanGst,
      });

      toast.success(res.message || "Company draft created successfully!");
      setCompanyName("");
      setGstNumber("");
      onClose();
      onSuccess(res.data);
    } catch (err: any) {
      console.error(err);
      const message = err.message || "Failed to create company draft.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-[#E7E0D2] dark:bg-[#0F1626] dark:border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                Create Company Draft
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Start by creating a draft with your GST number.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:bg-white/[0.08] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Company Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Company Name <span className="text-rose-500 font-bold">*</span>
            </label>

            <input
              type="text"
              value={companyName}
              onChange={handleNameChange}
              placeholder="ENTER COMPANY NAME"
              autoFocus
              disabled={loading}
              className={`w-full h-11 px-4 text-xs sm:text-sm font-medium rounded-2xl border transition-all uppercase tracking-wide outline-none ${
                error && !companyName.trim()
                  ? "border-rose-500 bg-rose-500/5 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:bg-[#080B11] dark:border-white/[0.1] dark:text-white"
              }`}
            />
          </div>

          {/* GST Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              GST Number <span className="text-rose-500 font-bold">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={gstNumber}
                onChange={handleGstChange}
                placeholder="ENTER YOUR GST NUMBER"
                maxLength={15}
                disabled={loading}
                className={`w-full h-11 px-4 pr-16 text-xs sm:text-sm font-mono rounded-2xl border transition-all uppercase tracking-wider outline-none ${
                  error && (!gstNumber.trim() || gstNumber.length !== 15)
                    ? "border-rose-500 bg-rose-500/5 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:bg-[#080B11] dark:border-white/[0.1] dark:text-white"
                }`}
              />

              <div
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-medium ${
                  gstNumber.length === 15
                    ? "text-emerald-500"
                    : gstNumber.length > 0
                    ? "text-rose-500"
                    : "text-slate-400"
                }`}
              >
                {gstNumber.length}/15
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          {/* Helper checklist */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3.5 dark:bg-white/[0.03] dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
              After creating the draft, you&apos;ll be able to:
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D]" />
              <span>Complete the registration form at your own pace</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D]" />
              <span>Save your progress automatically</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D]" />
              <span>Activate the company once all details are complete</span>
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:border-white/[0.1]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || gstNumber.length === 0 || companyName.trim().length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#E8C16D] hover:bg-[#d8b05c] text-[#0A0E1A] shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#0A0E1A]" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={15} className="stroke-[3] text-[#0A0E1A]" />
                  <span>Create Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
