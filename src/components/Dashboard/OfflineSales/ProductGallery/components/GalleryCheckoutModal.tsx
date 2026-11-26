"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, FileText, Loader2, PackageCheck } from "lucide-react";
import type { GalleryCart } from "../types/gallery.types";
import { challanService } from "../../SalesChallan/services/challan.service";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";

interface GalleryCheckoutModalProps {
  open: boolean;
  cart: GalleryCart | null;
  onClose: () => void;
  onConfirm: (options: {
    challanNo: string;
    challanDate: string;
    challanRefNo: string;
    challanFor: string;
    stockOutFrom: string;
    openInvoice: boolean;
  }) => Promise<void>;
  submitting: boolean;
}

export default function GalleryCheckoutModal({
  open,
  cart,
  onClose,
  onConfirm,
  submitting,
}: GalleryCheckoutModalProps) {
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [challanRefNo, setChallanRefNo] = useState("");
  const [challanFor, setChallanFor] = useState("Sales");
  const [stockOutFrom, setStockOutFrom] = useState("General");

  useEffect(() => {
    if (open) {
      challanService
        .getNextChallanNo()
        .then((num) => setChallanNo(num))
        .catch(() => setChallanNo(""));
    }
  }, [open]);

  if (!open || !cart) return null;

  const totalQty = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.rate,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 sm:p-4 font-sans"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl h-[82dvh] max-h-[620px] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                Checkout Cart ({cart.name})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a Sales Challan directly from your gallery cart items.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          {/* Party Summary */}
          <div className="rounded-2xl border border-[#E8C16D]/40 bg-[#FFF9EC]/60 dark:bg-[#1A160E]/60 dark:border-[#E8C16D]/20 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Selected Party
              </p>
              <p className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                {cart.party?.partyName || "Not Selected"}
              </p>
              {cart.party?.city && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {cart.party.city}
                  {cart.party.state ? `, ${cart.party.state}` : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Cart Total
              </p>
              <p className="text-base font-black text-[#B88728] dark:text-[#F5C451]">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {totalQty} pcs ({cart.items.length} SKUs)
              </p>
            </div>
          </div>

          {/* Challan Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                OC Challan No
              </label>
              <input
                type="text"
                readOnly
                value={challanNo || "Auto-generating..."}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs font-bold text-[#B88728] dark:text-[#F5C451] cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Challan Date
              </label>
              <input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Challan For
              </label>
              <ThemeSelectDropdown
                value={challanFor}
                onChange={setChallanFor}
                options={[
                  { value: "Sales", label: "Sales" },
                  { value: "Borrow (Uchhina)", label: "Borrow (Uchhina)" },
                ]}
                className="w-full"
                buttonClassName="w-full h-10 px-3 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Stock Out From
              </label>
              <ThemeSelectDropdown
                value={stockOutFrom}
                onChange={setStockOutFrom}
                options={[
                  { value: "General", label: "General" },
                  { value: "Main Godown", label: "Main Godown" },
                  { value: "Warehouse 1", label: "Warehouse 1" },
                ]}
                className="w-full"
                buttonClassName="w-full h-10 px-3 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Challan Ref No (Optional)
              </label>
              <input
                type="text"
                value={challanRefNo}
                onChange={(e) => setChallanRefNo(e.target.value)}
                placeholder="Enter optional reference number..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          {/* Items Mini Preview */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#0B0F17] px-3.5 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Item / SKU</span>
              <span>Qty × Rate = Amount</span>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
              {cart.items.map((item) => (
                <div
                  key={item.variantId}
                  className="px-3.5 py-2 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-mono font-semibold text-[#0A0E1A] dark:text-white truncate">
                      {item.variantSku}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.color}
                      {item.size ? ` • ${item.size}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.quantity} × ₹{item.rate} ={" "}
                    </span>
                    <span className="font-bold text-[#0A0E1A] dark:text-white">
                      ₹{(item.quantity * item.rate).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-wrap items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#0B0F17]/50 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting || !challanNo}
            onClick={() =>
              onConfirm({
                challanNo,
                challanDate,
                challanRefNo,
                challanFor,
                stockOutFrom,
                openInvoice: false,
              })
            }
            className="h-9 sm:h-10 px-3.5 sm:px-4 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FDF2D1] dark:hover:bg-[#262014] cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
            )}
            <span>Create Sales Challan</span>
          </button>

          <button
            type="button"
            disabled={submitting || !challanNo}
            onClick={() =>
              onConfirm({
                challanNo,
                challanDate,
                challanRefNo,
                challanFor,
                stockOutFrom,
                openInvoice: true,
              })
            }
            className="h-9 sm:h-10 px-4 sm:px-5 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] cursor-pointer shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText size={15} />
            )}
            <span>Challan & Open Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
