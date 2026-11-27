"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Layers,
  RefreshCw,
  Scissors,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import LotDetailsDrawer from "./components/LotDetailsDrawer";
import {
  MaterialOrderDeskLot,
  MaterialOrderDeskSummaryRow,
} from "./types/materialOrderDesk.types";
import { materialOrderDeskService } from "./services/materialOrderDesk.service";

export default function MaterialOrderDeskPage() {
  const [category, setCategory] = useState<"Fabric" | "Trim">("Fabric");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<MaterialOrderDeskSummaryRow[]>([]);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [sumRequiredQty, setSumRequiredQty] = useState(0);
  const [sumIssueQty, setSumIssueQty] = useState(0);
  const [sumStock, setSumStock] = useState(0);
  const [sumPoQty, setSumPoQty] = useState(0);
  const [sumShortSurplus, setSumShortSurplus] = useState(0);
  const [loading, setLoading] = useState(true);

  const [lotDrawerOpen, setLotDrawerOpen] = useState(false);
  const [lots, setLots] = useState<MaterialOrderDeskLot[]>([]);
  const [masterSkus, setMasterSkus] = useState<string[]>([]);
  const [productSkus, setProductSkus] = useState<string[]>([]);
  const [masterSkuFilter, setMasterSkuFilter] = useState("");
  const [productSkuFilter, setProductSkuFilter] = useState("");
  const [loadingLots, setLoadingLots] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await materialOrderDeskService.getSummary(category, search);
      setRows(data.rows || []);
      setSumRequiredQty(data.sumRequiredQty || 0);
      setSumIssueQty(data.sumIssueQty || 0);
      setSumStock(data.sumStock || 0);
      setSumPoQty(data.sumPoQty || 0);
      setSumShortSurplus(data.sumShortSurplus || 0);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load Order Desk data");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  const fetchLots = useCallback(
    async (mSku = masterSkuFilter, pSku = productSkuFilter) => {
      try {
        setLoadingLots(true);
        const data = await materialOrderDeskService.getLots({
          masterSku: mSku || undefined,
          productSku: pSku || undefined,
        });
        setLots(data.lots || []);
        setMasterSkus(data.masterSkus || []);
        setProductSkus(data.productSkus || []);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load Lot Details");
      } finally {
        setLoadingLots(false);
      }
    },
    [masterSkuFilter, productSkuFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSummary();
    }, 150);
    return () => clearTimeout(t);
  }, [fetchSummary]);

  useEffect(() => {
    if (lotDrawerOpen) {
      fetchLots();
    }
  }, [lotDrawerOpen, fetchLots]);

  const handleToggleAllRows = (checked: boolean) => {
    if (checked) {
      setSelectedSkus(rows.map((r) => r.sku));
    } else {
      setSelectedSkus([]);
    }
  };

  const handleToggleRow = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    );
  };

  return (
    <DashboardLayout title="Order Desk [ Purchase Material ]">
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-3.5 shadow-sm">
          <h1 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white tracking-tight">
            Order Desk [ Purchase Material ]
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("Fabric");
                setSelectedSkus([]);
              }}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold border transition cursor-pointer ${
                category === "Fabric"
                  ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] shadow-sm"
                  : "border-[#E7E0D2] dark:border-[#E8C16D]/30 bg-white dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014]"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Fabric</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory("Trim");
                setSelectedSkus([]);
              }}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold border transition cursor-pointer ${
                category === "Trim"
                  ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] shadow-sm"
                  : "border-[#E7E0D2] dark:border-[#E8C16D]/30 bg-white dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trim</span>
            </button>

            <button
              type="button"
              onClick={fetchSummary}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold border border-[#E7E0D2] dark:border-[#E8C16D]/40 bg-white dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refetch</span>
            </button>

            <button
              type="button"
              onClick={() => setLotDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold border border-[#E7E0D2] dark:border-[#E8C16D]/40 bg-white dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014] transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lot Details</span>
            </button>
          </div>
        </div>

        {/* Content & Drawer Container */}
        <div className="relative min-h-[580px] space-y-4 overflow-x-clip">
          {/* Search & Table Card */}
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-end gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Global search..."
                  className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  fetchSummary();
                }}
                title="Reset Search"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-500 hover:text-[#B88728] dark:hover:text-[#E8C16D] transition cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#0F1626]">
                <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                  {category}
                </h2>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                      <th className="py-3.5 px-4 w-14">No.</th>
                      <th className="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={
                            rows.length > 0 &&
                            rows.every((r) => selectedSkus.includes(r.sku))
                          }
                          onChange={(e) => handleToggleAllRows(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-4">
                        {category === "Fabric" ? "Fabrics SKU." : "Trim SKU."}
                      </th>
                      <th className="py-3.5 px-4 text-right">Required Qty.</th>
                      <th className="py-3.5 px-4 text-right">Issue Qty.</th>
                      <th className="py-3.5 px-4 text-right">Stock.</th>
                      <th className="py-3.5 px-4 text-right">PO Qty.</th>
                      <th className="py-3.5 px-4 text-right">Short/Surplus.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          Loading {category.toLowerCase()} requirements...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                              <ClipboardList className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              No data available
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => {
                        const isSelected = selectedSkus.includes(row.sku);
                        return (
                          <tr
                            key={row.sku}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-[#FFF9EC]/70 dark:bg-[#E8C16D]/[0.06]"
                                : "hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(row.sku)}
                                className="h-4 w-4 rounded border-slate-300 accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                              {row.sku}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#0A0E1A] dark:text-white">
                              {Number(row.requiredQty || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                              {Number(row.issueQty || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                              {Number(row.stock || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#B88728] dark:text-[#E8C16D] font-semibold">
                              {Number(row.poQty || 0).toFixed(2)}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-mono font-bold ${
                                row.shortSurplus < 0
                                  ? "text-rose-500 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {Number(row.shortSurplus || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FFF9EC]/70 dark:bg-[#080B11] border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-white">
                      <td className="py-3 px-4" />
                      <td className="py-3 px-3" />
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 mr-2">Sum.</span>
                        {Number(sumRequiredQty || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 mr-2">Sum.</span>
                        {Number(sumIssueQty || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 mr-2">Sum.</span>
                        {Number(sumStock || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 mr-2">Sum.</span>
                        {Number(sumPoQty || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 mr-2">Sum.</span>
                        {Number(sumShortSurplus || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <LotDetailsDrawer
            isOpen={lotDrawerOpen}
            onClose={() => setLotDrawerOpen(false)}
            lots={lots}
            loading={loadingLots}
            masterSkus={masterSkus}
            productSkus={productSkus}
            masterSkuFilter={masterSkuFilter}
            productSkuFilter={productSkuFilter}
            onMasterSkuChange={setMasterSkuFilter}
            onProductSkuChange={setProductSkuFilter}
            onSearch={() => fetchLots(masterSkuFilter, productSkuFilter)}
            onReset={() => {
              setMasterSkuFilter("");
              setProductSkuFilter("");
              fetchLots("", "");
            }}
            onSelectionUpdated={() => {
              fetchLots();
              fetchSummary();
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
