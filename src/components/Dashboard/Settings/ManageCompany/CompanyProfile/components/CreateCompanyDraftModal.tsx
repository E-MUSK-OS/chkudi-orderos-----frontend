"use client";

import React, { useState } from "react";
import { Building2, X, Plus, Loader2, AlertCircle } from "lucide-react";
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
      // handled via inline error banner and toast
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
      <div className="relative w-full max-w-md bg-white border border-[#E7E0D2] dark:bg-[#13161F] dark:border-white/[0.1] rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 size={20} className="text-[#B88728] dark:text-[#F5C451] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white tracking-wide">
              Create Company Draft
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Start by creating a draft with your GST number.
          <br />
          You can complete the full registration later.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Company Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={companyName}
              onChange={handleNameChange}
              placeholder="ENTER COMPANY NAME"
              autoFocus
              disabled={loading}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm uppercase tracking-wide outline-none transition-all bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 ${
                error && !companyName.trim()
                  ? "border-red-500/80 focus:ring-1 focus:ring-red-500"
                  : "hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/50 dark:hover:border-amber-400/50 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/50"
              }`}
            />
          </div>

          {/* GST Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              GST Number <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={gstNumber}
                onChange={handleGstChange}
                placeholder="ENTER YOUR GST NUMBER"
                maxLength={15}
                disabled={loading}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider outline-none transition-all pr-14 bg-white border border-[#E7E0D2] text-[#0A0E1A] placeholder-slate-400 dark:bg-[#0E1017] dark:border-white/[0.1] dark:text-white dark:placeholder-slate-500 ${
                  error && (!gstNumber.trim() || gstNumber.length !== 15)
                    ? "border-red-500/80 focus:ring-1 focus:ring-red-500"
                    : "hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/50 dark:hover:border-amber-400/50 dark:focus:border-amber-400/80 dark:focus:ring-amber-400/50"
                }`}
              />

              <div
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium ${
                  gstNumber.length === 15
                    ? "text-emerald-600 dark:text-emerald-400"
                    : gstNumber.length > 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {gstNumber.length}/15
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs mt-2 font-medium">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Helper checklist */}
          <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
              After creating the draft, you&apos;ll be able to:
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>Complete the registration form at your own pace</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>Save your progress automatically</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>Activate the company once all details are complete</span>
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08] mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E7E0D2] dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:border-white/[0.1] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || gstNumber.length === 0 || companyName.trim().length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0A0E1A] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-[#0A0E1A] dark:border-transparent shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white dark:text-slate-900" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="text-white dark:text-slate-900" />
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
