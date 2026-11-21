"use client";

import { Pencil, Trash2, Package } from "lucide-react";
import ActionMenu from "@/components/ui/ActionMenu";
import type { FlipkartImportItem } from "../types/flipkartImport.types";

interface Props {
  items: FlipkartImportItem[];
  isLoading?: boolean;
  onEdit: (item: FlipkartImportItem) => void;
  onDelete: (id: string) => void;
  tableWrapperClassName?: string;
}

export default function FlipkartTable({
  items,
  isLoading = false,
  onEdit,
  onDelete,
  tableWrapperClassName,
}: Props) {
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#E8C16D]/10 text-[#B88728] dark:text-[#F5C451] border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
          No Flipkart Records Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          No Flipkart import records matched your criteria. Try importing a Flipkart sheet or adding a new record.
        </p>
      </div>
    );
  }

  return (
    <div
      className={tableWrapperClassName || "w-full overflow-x-auto"}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table className="w-full min-w-[850px] lg:min-w-[1000px] border-collapse text-left font-sans">
        <thead className="lg:sticky lg:top-0 z-10 bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] shadow-xs">
          <tr>
            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[180px]">
              FSN Code
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[180px]">
              SKU
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">
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

        <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-28 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-24 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="h-4 w-20 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </td>
                <td className="px-3 sm:px-4 py-3.5">
                  <div className="mx-auto h-4 w-20 rounded bg-slate-100 dark:bg-white/[0.05]" />
                </td>
                <td className="px-3 sm:px-4 py-3.5 text-center">
                  <div className="mx-auto h-7 w-7 rounded-xl bg-slate-100 dark:bg-white/[0.05]" />
                </td>
              </tr>
            ))
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.06] transition-colors"
              >
                <td className="px-3 sm:px-4 py-3.5 font-bold text-[#0A0E1A] dark:text-white font-mono">
                  {item.fsn || "—"}
                </td>

                <td className="px-3 sm:px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 font-mono">
                  {item.sku || <span className="italic text-slate-400">N/A</span>}
                </td>

                <td className="px-3 sm:px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                  {item.rackAddress || <span className="italic text-slate-400">Not assigned</span>}
                </td>

                <td className="px-3 sm:px-4 py-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(undefined, {
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
                          label: "Edit Record",
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
