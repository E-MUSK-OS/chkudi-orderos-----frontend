"use client";

import { Fragment } from "react";
import { Package, ChevronDown, ChevronUp } from "lucide-react";

import type { Material } from "../types/material.types";
import MaterialStatusBadge from "./MaterialStatusBadge";
import MaterialActionMenu from "./MaterialActionMenu";
import MaterialVariantInline from "./MaterialVariantInline";

interface Props {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onStatusChange: (material: Material) => void;
  expandedMaterialId?: string | null;
  onVariantToggle?: (material: Material) => void;
  selectedMaterialIds?: string[];
  onToggleSelect?: (materialId: string) => void;
  onToggleSelectAll?: () => void;
}

export default function MaterialTable({
  materials,
  onEdit,
  onDelete,
  onStatusChange,
  expandedMaterialId,
  onVariantToggle,
  selectedMaterialIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const isAllCurrentPageSelected =
    materials.length > 0 &&
    materials.every((p) => selectedMaterialIds.includes(p.id));
  const isSomeCurrentPageSelected =
    materials.some((p) => selectedMaterialIds.includes(p.id)) &&
    !isAllCurrentPageSelected;

  if (!materials.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
          No materials Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm dark:text-slate-400">
          No Material records matched your search or filter criteria. Try clearing your filters or adding a new material.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
      <table className="w-full min-w-[1050px] border-collapse text-left font-sans">
        <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08] dark:bg-[#080B11] dark:text-[#F5C451]">
          <tr>
            <th className="px-3 sm:px-4 py-3.5 text-center w-12">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeCurrentPageSelected;
                  }}
                  onChange={() => onToggleSelectAll?.()}
                  className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                  title="Select all materials on this page"
                />
              </div>
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[200px]">
              Material Details
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[120px]">
              Master SKU
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[100px]">
              Brand & Unit
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[140px]">
              Category
            </th>

            {/* Kardex Pricing (Cost / MRP / Dealer / Retail) */}
            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[140px]">
              Kardex Pricing
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[90px]">
              Status
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Actions
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Variants
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans dark:divide-white/[0.06] dark:bg-[#0F1626]">
          {materials.map((material) => {
            const isSelected = selectedMaterialIds.includes(material.id);
            return (
              <Fragment key={material.id}>
                <tr
                  className={`transition-colors ${
                    isSelected
                      ? "bg-[#FFF9EC]/80 dark:bg-[#F5C451]/10 hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/15"
                      : "hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                  }`}
                >
                <td className="px-3 sm:px-4 py-3.5 text-center w-12 align-middle">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(material.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                      title={isSelected ? "Deselect row" : "Select row"}
                    />
                  </div>
                </td>

                {/* Material Details (Name, SKU, Description, Party) */}
                <td className="px-3 sm:px-4 py-3.5 align-middle max-w-[260px]">
                  <div>
                    <p className="font-bold text-[#0A0E1A] truncate dark:text-white" title={material.materialName}>
                      {material.materialName}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {material.sku && (
                        <span className="inline-flex items-center gap-1 font-mono rounded bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
                          SKU: {material.sku}
                        </span>
                      )}
                      {material.manufacturingGroup && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20">
                          Mfg: {material.manufacturingGroup}
                        </span>
                      )}
                      {material.hsnCode && (
                        <span className="inline-flex items-center gap-1 font-mono rounded bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
                          HSN: {material.hsnCode}
                        </span>
                      )}
                      {Boolean(material.width) && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 font-mono">
                          Width: {material.width}
                        </span>
                      )}
                      {Boolean(material.gsm) && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20 font-mono">
                          GSM: {material.gsm}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Master SKU */}
                <td className="px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap">
                  <span className="font-semibold text-slate-900 font-mono dark:text-slate-200">
                    {material.masterSku}
                  </span>
                </td>

                {/* Brand & Unit */}
                <td className="px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {material.brand || "No Brand"}
                    </span>
                    {material.unit && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Unit: {material.unit}
                      </p>
                    )}
                  </div>
                </td>

                {/* Category & Sub Category */}
                <td className="px-3 sm:px-4 py-3.5 align-middle">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {material.category}
                    </span>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-[#F5C451]/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono border border-amber-200/60 dark:border-[#F5C451]/20 shadow-2xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Sub Category
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-normal">:</span>
                        <span className="font-bold text-[#B88728] dark:text-[#F5C451]">
                          {material.subCategory || "No Sub Category"}
                        </span>
                      </span>
                    </div>
                  </div>
                </td>

                {/* Kardex Pricing (Material Cost, MRP, Sales Rate) */}
                <td className="px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap">
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 dark:text-slate-500">Cost:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{material.materialCost ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 dark:text-slate-500">MRP:</span>
                      <span className="font-semibold text-[#B88728] dark:text-[#F5C451]">
                        ₹{material.mrp || 0}
                      </span>
                    </div>
                    {Boolean(material.salesRate) && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 dark:text-slate-500">Sales:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          ₹{material.salesRate}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-3 sm:px-4 py-3.5 align-middle text-center whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <MaterialStatusBadge isActive={material.isActive} />
                  </div>
                </td>

                {/* Actions */}
                <td className="px-3 sm:px-4 py-3.5 align-middle text-center">
                  <div className="flex items-center justify-center">
                    <MaterialActionMenu
                      material={material}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                </td>

                {/* Variants */}
                <td className="px-3 sm:px-4 py-3.5 align-middle text-center">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onVariantToggle?.(material)}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] transition-all shadow-2xs active:scale-95 cursor-pointer dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#F5C451]/10 dark:hover:text-[#F5C451]"
                      title={expandedMaterialId === material.id ? "Collapse variants" : "Expand variants"}
                    >
                      {expandedMaterialId === material.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>

              {expandedMaterialId === material.id && (
                <tr>
                  <td
                    colSpan={9}
                    className="border-t border-[#E7E0D2] bg-slate-50/60 p-3 sm:p-5 dark:border-white/[0.08] dark:bg-[#080B11]/50"
                  >
                    <MaterialVariantInline
                      materialId={material.id}
                      attributes={
                        material.attributes && material.attributes.length > 0
                          ? material.attributes
                          : [{ attributeName: "Size" }]
                      }
                      masterSku={material.masterSku}
                      material={material}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}


