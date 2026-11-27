"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { MaterialCatalogOption } from "../../Order/types/materialOrder.types";
import { materialOrderService } from "../../Order/services/materialOrder.service";
import {
  MaterialOrderDeskLot,
  MaterialOrderDeskRequirementItem,
} from "../types/materialOrderDesk.types";
import { materialOrderDeskService } from "../services/materialOrderDesk.service";

interface LotDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lots: MaterialOrderDeskLot[];
  loading: boolean;
  masterSkus: string[];
  productSkus: string[];
  masterSkuFilter: string;
  productSkuFilter: string;
  onMasterSkuChange: (v: string) => void;
  onProductSkuChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
  onSelectionUpdated: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  Pending:
    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  "In Progress":
    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Completed:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};

export default function LotDetailsDrawer({
  isOpen,
  onClose,
  lots,
  loading,
  masterSkus,
  productSkus,
  masterSkuFilter,
  productSkuFilter,
  onMasterSkuChange,
  onProductSkuChange,
  onSearch,
  onReset,
  onSelectionUpdated,
}: LotDetailsDrawerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [lotNo, setLotNo] = useState("");
  const [masterSku, setMasterSku] = useState("");
  const [productSku, setProductSku] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState("Pending");
  const [reqs, setReqs] = useState<MaterialOrderDeskRequirementItem[]>([
    { sku: "", category: "Fabric", unit: "MTR", requiredQty: 0, issueQty: 0 },
  ]);
  const [savingLot, setSavingLot] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    materialOrderService
      .getMaterials()
      .then((list) => setMaterials(list))
      .catch(() => {});
  }, [isOpen]);

  const masterSkuOptions: ThemeSelectOption[] = masterSkus.map((s) => ({
    value: s,
    label: s,
  }));
  const productSkuOptions: ThemeSelectOption[] = productSkus.map((s) => ({
    value: s,
    label: s,
  }));
  const materialOptions: ThemeSelectOption[] = materials.map((m) => ({
    value: m.sku || m.masterSku || m.materialName,
    label: m.materialName || m.sku || m.masterSku,
  }));

  const allSelected = lots.length > 0 && lots.every((l) => l.isSelected);

  const handleToggleAll = async (checked: boolean) => {
    try {
      await materialOrderDeskService.updateLotSelection({
        all: true,
        isSelected: checked,
      });
      onSelectionUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lot selection");
    }
  };

  const handleToggleOne = async (lot: MaterialOrderDeskLot) => {
    try {
      await materialOrderDeskService.updateLotSelection({
        lotIds: [lot.id],
        isSelected: !lot.isSelected,
      });
      onSelectionUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update lot selection");
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterSku.trim() || !productSku.trim()) {
      toast.error("Please enter Master SKU and Product SKU.");
      return;
    }
    const validReqs = reqs.filter((r) => r.sku.trim() !== "");
    try {
      setSavingLot(true);
      await materialOrderDeskService.createLot({
        lotNo: lotNo.trim() || undefined,
        masterSku: masterSku.trim(),
        productSku: productSku.trim(),
        quantity: Number(quantity) || 0,
        status,
        requirements: validReqs,
      });
      toast.success("Lot added to Order Desk.");
      setLotNo("");
      setMasterSku("");
      setProductSku("");
      setQuantity(0);
      setStatus("Pending");
      setReqs([
        { sku: "", category: "Fabric", unit: "MTR", requiredQty: 0, issueQty: 0 },
      ]);
      setShowAddForm(false);
      onSelectionUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create lot");
    } finally {
      setSavingLot(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-30 bg-black/15 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-4xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
            Lot Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((p) => !p)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#d9b25d] text-[#0A0E1A] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Close Form" : "Add Lot"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Filter Row */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Master SKU.
              </label>
              <ThemeSelectDropdown
                value={masterSkuFilter}
                onChange={onMasterSkuChange}
                options={masterSkuOptions}
                placeholder="Select master SKU"
                className="w-full"
                buttonClassName="w-full justify-between h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141A29] text-[#0A0E1A] dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Product SKU.
              </label>
              <ThemeSelectDropdown
                value={productSkuFilter}
                onChange={onProductSkuChange}
                options={productSkuOptions}
                placeholder="Select product SKU"
                className="w-full"
                buttonClassName="w-full justify-between h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#141A29] text-[#0A0E1A] dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={onSearch}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-xl bg-white dark:bg-slate-100 hover:bg-slate-200 text-[#0A0E1A] text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#141A29] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Optional Add Lot Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateLot}
            className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-[#111726] border-b border-slate-200 dark:border-white/[0.08] space-y-3"
          >
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <input
                type="text"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder="Lot No (auto if blank)"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <input
                type="text"
                required
                value={masterSku}
                onChange={(e) => setMasterSku(e.target.value)}
                placeholder="Master SKU *"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <input
                type="text"
                required
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                placeholder="Product SKU *"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="Quantity"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Material Requirements (Fabric / Trim)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setReqs((p) => [
                      ...p,
                      {
                        sku: "",
                        category: "Fabric",
                        unit: "MTR",
                        requiredQty: 0,
                        issueQty: 0,
                      },
                    ])
                  }
                  className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] hover:underline cursor-pointer"
                >
                  + Add Material
                </button>
              </div>

              {reqs.map((r, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[100px_1fr_90px_90px_32px] gap-2 items-center text-xs"
                >
                  <select
                    value={r.category}
                    onChange={(e) =>
                      setReqs((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                category: e.target.value as "Fabric" | "Trim",
                              }
                            : item
                        )
                      )
                    }
                    className="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  >
                    <option value="Fabric">Fabric</option>
                    <option value="Trim">Trim</option>
                  </select>

                  <ThemeSelectDropdown
                    value={r.sku}
                    onChange={(val) => {
                      const found = materials.find(
                        (m) => (m.sku || m.masterSku || m.materialName) === val
                      );
                      setReqs((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                sku: val,
                                materialId: found?.id || null,
                                unit: found?.unit || item.unit,
                              }
                            : item
                        )
                      );
                    }}
                    options={materialOptions}
                    placeholder="Select Material SKU"
                    className="w-full"
                    buttonClassName="w-full justify-between h-8 px-2.5 text-xs rounded-lg border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />

                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={r.requiredQty}
                    onChange={(e) =>
                      setReqs((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? { ...item, requiredQty: parseFloat(e.target.value) || 0 }
                            : item
                        )
                      )
                    }
                    placeholder="Req Qty"
                    className="h-8 px-2 text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />

                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={r.issueQty}
                    onChange={(e) =>
                      setReqs((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? { ...item, issueQty: parseFloat(e.target.value) || 0 }
                            : item
                        )
                      )
                    }
                    placeholder="Issue Qty"
                    className="h-8 px-2 text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setReqs((prev) =>
                        prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingLot}
                className="h-8 px-5 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] cursor-pointer disabled:opacity-60"
              >
                {savingLot ? "Saving..." : "Save Lot"}
              </button>
            </div>
          </form>
        )}

        {/* Drawer Lots Table */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 custom-scrollbar">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                  <th className="py-3 px-3 w-12">No.</th>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Lot No.</th>
                  <th className="py-3 px-3">Master SKU.</th>
                  <th className="py-3 px-3">Product SKU.</th>
                  <th className="py-3 px-3 text-right">Quantity.</th>
                  <th className="py-3 px-3 text-center">Status.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading lots...
                    </td>
                  </tr>
                ) : lots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No lots available
                        </p>
                        <p className="text-xs text-slate-400">
                          Click &ldquo;+ Add Lot&rdquo; above to add a production lot.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lots.map((lot, idx) => (
                    <tr
                      key={lot.id}
                      onClick={() => handleToggleOne(lot)}
                      className={`cursor-pointer transition-colors ${
                        lot.isSelected
                          ? "bg-[#FFF9EC]/50 dark:bg-white/[0.03]"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={lot.isSelected}
                          onChange={() => handleToggleOne(lot)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                        {lot.lotNo}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {lot.masterSku}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {lot.productSku}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {lot.quantity}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            STATUS_BADGE[lot.status] ||
                            "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                          }`}
                        >
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
