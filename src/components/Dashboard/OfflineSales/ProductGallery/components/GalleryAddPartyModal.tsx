"use client";

import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { challanService } from "../../SalesChallan/services/challan.service";
import type { Party } from "../../SalesChallan/types/challan.types";

interface GalleryAddPartyModalProps {
  open: boolean;
  onClose: () => void;
  onPartyCreated: (party: Party) => void;
}

const FIELD_LABEL_CLASS =
  "block text-xs font-bold text-[#0A0E1A] dark:text-slate-200 mb-1.5";

const FIELD_INPUT_CLASS =
  "w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#E7E0D2] bg-slate-50/50 text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-[#E8C16D] focus:bg-white focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#F5C451] dark:focus:bg-[#080B11] dark:focus:ring-[#F5C451]/20 transition-all";

export default function GalleryAddPartyModal({
  open,
  onClose,
  onPartyCreated,
}: GalleryAddPartyModalProps) {
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setName("");
    setContactNo("");
    setCity("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = contactNo.replace(/\D/g, "").trim();
    const cleanCity = city.trim();

    if (!cleanName) {
      toast.error("Party name is required.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!cleanCity) {
      toast.error("City is required.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await challanService.createParty({
        partyName: cleanName,
        accountHead: "Sundry Debtors",
        phone: cleanPhone,
        whatsapp: cleanPhone,
        city: cleanCity,
        shippingSameAsBilling: true,
        shippingCity: cleanCity,
        isActive: true,
      });

      toast.success(`Added party "${created.partyName}" (Sundry Debtors).`);
      setName("");
      setContactNo("");
      setCity("");
      onPartyCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create party.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Add Party
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Creates a Sundry Debtors ledger and selects it for this cart.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            aria-label="Close"
            className="p-1.5 rounded-xl text-slate-400 hover:text-[#0A0E1A] hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form matching img-2 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className={FIELD_LABEL_CLASS}>
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Party name"
              autoFocus
              required
              className={FIELD_INPUT_CLASS}
            />
          </div>

          <div>
            <label className={FIELD_LABEL_CLASS}>
              Contact No. <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="10-digit mobile"
              required
              className={FIELD_INPUT_CLASS}
            />
          </div>

          <div>
            <label className={FIELD_LABEL_CLASS}>
              City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              required
              className={FIELD_INPUT_CLASS}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={submitting}
              className="h-10 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold border border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50/70 dark:bg-[#131926] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#dfb458] dark:bg-[#F5C451] dark:hover:bg-[#e5b53d] text-[#0A0E1A] transition-all cursor-pointer shadow-xs disabled:opacity-60 inline-flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Party</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
