"use client";

import React, { useState, useEffect } from "react";
import { X, Search, FileText, ArrowRight, Plus } from "lucide-react";
import { SalesInvoice } from "../types/salesInvoice.types";
import { salesInvoiceService } from "../services/salesInvoice.service";
import { toast } from "sonner";

interface InvoiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInvoice: (invoice: SalesInvoice) => void;
  onAddNew: () => void;
}

export default function InvoiceListModal({
  isOpen,
  onClose,
  onSelectInvoice,
  onAddNew,
}: InvoiceListModalProps) {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadInvoices = async (searchTerm = "") => {
    try {
      setLoading(true);
      const res = await salesInvoiceService.getInvoices({
        search: searchTerm,
        limit: 50,
      });
      setInvoices(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvoices(search);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-[#0A0E1A] rounded-[28px] sm:rounded-[32px] border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all">
        {/* Modal Header - Dark Obsidian Banner */}
        <div className="bg-[#0A0E1A] dark:bg-[#080B11] border-b border-slate-800 dark:border-white/[0.08] px-5 sm:px-7 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC]/10 text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <FileText className="w-5 h-5 text-[#E8C16D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Sales Invoices Directory
              </h2>
              <p className="text-xs text-slate-400">
                Browse, open, or export existing sales invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNew();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] bg-[#FAF8F5]/60 dark:bg-[#0A0E1A]">
          <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 py-2 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadInvoices(e.target.value);
              }}
              placeholder="Search by Invoice No, Challan No, or Party Name..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Invoices List / Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white dark:bg-[#0A0E1A]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              No sales invoices found. Create one from Sales Challan or click "New Invoice".
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] font-bold">
                    <th className="py-3 px-3 font-bold uppercase tracking-wider">Invoice No</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider">Date</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider">Challan No</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider">Party Name</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Qty</th>
                    <th className="py-3 px-3 text-right font-bold uppercase tracking-wider">Net Amount</th>
                    <th className="py-3 px-3 text-center font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3 font-bold font-mono text-[#B88728] dark:text-[#E8C16D]">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {inv.challanNo || "-"}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {inv.billingPartyName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {inv.totalQuantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{Number(inv.netAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectInvoice(inv);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] transition-all cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
