"use client";

import React, { useState, useEffect } from "react";
import { X, Search, FileText, ArrowRight, Download, Trash2, Plus } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0F1626] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Sales Invoices Directory
              </h2>
              <p className="text-xs text-slate-500">
                Browse, open, or export existing sales invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNew();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0A0E1A] hover:bg-black dark:bg-[#F5C451] dark:text-slate-900 dark:hover:bg-[#e8b83e] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                loadInvoices(e.target.value);
              }}
              placeholder="Search by Invoice No, Challan No, or Party Name..."
              className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl focus:border-[#E8C16D] dark:focus:border-[#F5C451] focus:outline-none"
            />
          </div>
        </div>

        {/* Invoices List / Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No sales invoices found. Create one from Sales Challan or click "New Invoice".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-500">
                    <th className="py-2.5 px-3 font-bold">Invoice No</th>
                    <th className="py-2.5 px-3 font-bold">Date</th>
                    <th className="py-2.5 px-3 font-bold">Challan No</th>
                    <th className="py-2.5 px-3 font-bold">Party Name</th>
                    <th className="py-2.5 px-3 text-right font-bold">Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold">Net Amount</th>
                    <th className="py-2.5 px-3 text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3 font-bold font-mono text-[#B88728] dark:text-[#F5C451]">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {inv.challanNo || "-"}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {inv.billingPartyName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#B88728] hover:text-[#9A701E] hover:bg-[#FFF9EC] dark:text-[#F5C451] dark:hover:bg-amber-500/10 transition-all cursor-pointer"
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
