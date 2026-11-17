"use client";

import React, { useState } from "react";
import { Building2, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
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

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

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

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Company Name is required.");
      return;
    }

    const trimmedGst = gstNumber.trim().toUpperCase();
    if (!trimmedGst) {
      setError("GST Number is required.");
      return;
    }

    if (trimmedGst.length !== 15) {
      setError("GST Number must be exactly 15 characters.");
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(trimmedGst)) {
      setError("Invalid GST format. Example: 24ABCDE1234F1Z5");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await companyService.createDraft({
        companyName: trimmedName,
        gstNumber: trimmedGst,
      });

      if (response && response.data) {
        toast.success("Company draft created successfully.");
        setCompanyName("");
        setGstNumber("");
        onSuccess(response.data);
      } else {
        setError(response?.message || "Failed to create draft.");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while creating the draft.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Company Draft"
      description="Start by creating a draft with your GST number."
      icon={<Building2 className="h-5 w-5" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Company Name Field */}
        <div>
          <label className="block text-xs font-bold text-[#0A0E1A] dark:text-slate-200 mb-1.5">
            Company Name <span className="text-rose-500 font-bold">*</span>
          </label>

          <input
            type="text"
            value={companyName}
            onChange={handleNameChange}
            placeholder="ENTER COMPANY NAME"
            autoFocus
            disabled={loading}
            className={`w-full h-11 px-4 text-xs sm:text-sm font-medium rounded-xl sm:rounded-2xl border transition-all uppercase tracking-wide outline-none ${
              error && !companyName.trim()
                ? "border-rose-500 bg-rose-500/5 focus:ring-2 focus:ring-rose-500/20"
                : "border-[#E7E0D2] bg-[#FAF8F5] text-[#0A0E1A] placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:bg-white dark:bg-[#080B11] dark:border-white/[0.1] dark:text-white dark:focus:bg-[#080B11]"
            }`}
          />
        </div>

        {/* GST Number Field */}
        <div>
          <label className="block text-xs font-bold text-[#0A0E1A] dark:text-slate-200 mb-1.5">
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
              className={`w-full h-11 px-4 pr-16 text-xs sm:text-sm font-mono rounded-xl sm:rounded-2xl border transition-all uppercase tracking-wider outline-none ${
                error && (!gstNumber.trim() || gstNumber.length !== 15)
                  ? "border-rose-500 bg-rose-500/5 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#E7E0D2] bg-[#FAF8F5] text-[#0A0E1A] placeholder:text-slate-400 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:bg-white dark:bg-[#080B11] dark:border-white/[0.1] dark:text-white dark:focus:bg-[#080B11]"
              }`}
            />

            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold ${
                gstNumber.length === 15
                  ? "text-emerald-600 dark:text-emerald-400"
                  : gstNumber.length > 0
                  ? "text-rose-500"
                  : "text-slate-400"
              }`}
            >
              {gstNumber.length}/15
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs mt-2 font-medium">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Helper checklist */}
        <div className="rounded-2xl bg-[#FAF8F5] border border-[#E7E0D2] px-4 py-3.5 dark:bg-white/[0.03] dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p className="font-bold text-[#0A0E1A] dark:text-slate-300">
            After creating the draft, you&apos;ll be able to:
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D] shrink-0" />
            <span>Complete the registration form at your own pace</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D] shrink-0" />
            <span>Save your progress automatically</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8C16D] shrink-0" />
            <span>Activate the company once all details are complete</span>
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E0D2] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 h-11 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-[#FEFAEE] hover:text-[#6A4D1D] hover:border-[#E8C16D] dark:hover:bg-white/[0.08] dark:hover:text-white active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || gstNumber.length === 0 || companyName.trim().length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] text-[#0A0E1A] shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0A0E1A]" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={16} className="stroke-[3] text-[#0A0E1A]" />
                <span>Create Draft</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
