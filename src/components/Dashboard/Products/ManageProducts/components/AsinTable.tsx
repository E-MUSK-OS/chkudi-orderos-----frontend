"use client";

import { Pencil, Trash2 } from "lucide-react";
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
  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#E7EAF0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                ASIN
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                SKU
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Generate Barcode
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Rack Address
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                Created
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center text-xs font-semibold uppercase tracking-wider text-white">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7EAF0]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-4 sm:px-6 sm:py-5">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
                  <td className="px-5 py-4 sm:px-6 sm:py-5 text-center">
                    <div className="mx-auto h-9 w-9 rounded-md bg-slate-200" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm font-medium text-slate-500"
                >
                  No ASIN import records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <p className="font-semibold text-[#0A0E1A]">
                      {item.asin || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="font-medium text-slate-700">
                      {item.sku || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="text-slate-700">
                      {item.generateBarcode || item.sku || item.asin || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="text-slate-700">
                      {item.rackAddress || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-slate-700">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-center">
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
    </div>
  );
}

