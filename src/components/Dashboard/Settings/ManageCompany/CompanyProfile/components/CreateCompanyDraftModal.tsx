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

      {/* Modal Card matching Screenshot */}
      <div className="relative w-full max-w-md bg-white border border-[#E7E0D2] dark:bg-[#13161F] dark:border-white/[0.1] rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 size={20} className="text-slate-200 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Create Company Draft
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle matching Screenshot */}
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Start by creating a draft with your GST number.
          <br />
          You can complete the full registration later.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Company Name Field (Added above GST Number as requested) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={companyName}
              onChange={handleNameChange}
              placeholder="ENTER COMPANY NAME"
              autoFocus
              disabled={loading}
              className={`w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#0E1017] dark:border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 uppercase tracking-wide outline-none transition-all ${
                error && !companyName.trim()
                  ? "border-red-500/80 focus:ring-1 focus:ring-red-500"
                  : "border-white/[0.1] focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50"
              }`}
            />
          </div>

          {/* GST Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                className={`w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#0E1017] dark:border rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 uppercase tracking-wider outline-none transition-all pr-14 ${
                  error && (!gstNumber.trim() || gstNumber.length !== 15)
                    ? "border-red-500/80 focus:ring-1 focus:ring-red-500"
                    : "border-white/[0.1] focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50"
                }`}
              />

              <div
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium ${
                  gstNumber.length === 15
                    ? "text-emerald-400"
                    : gstNumber.length > 0
                    ? "text-red-400"
                    : "text-slate-500"
                }`}
              >
                {gstNumber.length}/15
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          {/* Helper checklist matching Screenshot */}
          <div className="pt-2 text-xs text-slate-400 space-y-1.5">
            <p className="font-medium text-slate-300 mb-2">
              After creating the draft, you&apos;ll be able to:
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400">•</span>
              <span>Complete the registration form at your own pace</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400">•</span>
              <span>Save your progress automatically</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-slate-400">•</span>
              <span>Activate the company once all details are complete</span>
            </p>
          </div>

          {/* Modal Footer matching Screenshot */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06] mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || gstNumber.length === 0 || companyName.trim().length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-slate-900" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="text-slate-900" />
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
