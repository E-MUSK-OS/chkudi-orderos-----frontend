"use client";

import { Pencil, Trash2, Package } from "lucide-react";
import ActionMenu from "@/components/ui/ActionMenu";
import type { AsinImportItem } from "../types/asinImport.types";

interface Props {
  items: AsinImportItem[];
  isLoading?: boolean;
  onEdit: (item: AsinImportItem) => void;
  onDelete: (id: string) => void;
}

export default function AsinTable({
  items,
  isLoading = false,
  onEdit,
  onDelete,
}: Props) {
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A]">
          No ASIN Records Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
          No ASIN import records matched your criteria. Try importing an ASIN sheet or adding a new record.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
      <table className="w-full min-w-[950px] lg:min-w-[1100px] border-collapse text-left font-sans">
        <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
          <tr>
            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">
              ASIN
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">
              SKU
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">
              Generate Barcode
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[140px]">
              Rack Address
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[120px]">
              Created
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-28 rounded bg-slate-100" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-20 rounded bg-slate-100" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="mx-auto h-4 w-20 rounded bg-slate-100" />
                </td>
                <td className="px-3 sm:px-4 py-3.5 text-center">
                  <div className="mx-auto h-7 w-7 rounded-xl bg-slate-100" />
                </td>
              </tr>
            ))
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-3 sm:px-4 py-3.5 font-bold text-[#0A0E1A] font-mono">
                  {item.asin || "—"}
                </td>

                <td className="px-3 sm:px-4 py-3.5 text-slate-800 font-mono font-medium">
                  {item.sku || "—"}
                </td>

                <td className="px-3 sm:px-4 py-3.5">
                  <span className="inline-flex items-center rounded-lg bg-[#FFF9EC] px-2 py-0.5 text-xs font-bold text-[#B88728] border border-[#E8C16D]/30 font-mono">
                    {item.generateBarcode || item.sku || item.asin || "—"}
                  </span>
                </td>

                <td className="px-3 sm:px-4 py-3.5">
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200/60 font-mono">
                    {item.rackAddress || "—"}
                  </span>
                </td>

                <td className="px-3 sm:px-4 py-3.5 text-center whitespace-nowrap text-slate-700 font-medium">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>

                <td className="px-3 sm:px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center">
                    <ActionMenu
                      items={[
                        {
                          label: "Edit ASIN Record",
                          icon: Pencil,
                          onClick: () => onEdit(item),
                        },
                        {
                          label: "Delete Record",
                          icon: Trash2,
                          variant: "danger",
                          onClick: () => onDelete(item.id),
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

