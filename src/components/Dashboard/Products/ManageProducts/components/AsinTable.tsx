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
        <table className="w-full min-w-[950px]">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-4 py-3 text-left">
                ASIN
              </th>

              <th className="px-4 py-3 text-left">
                SKU
              </th>

              <th className="px-4 py-3 text-left">
                Generate Barcode
              </th>

              <th className="px-4 py-3 text-left">
                Rack Address
              </th>

              <th className="px-4 py-3 text-left">
                Created
              </th>

              <th className="px-4 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7EAF0]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="mx-auto h-8 w-8 rounded-md bg-slate-200" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No ASIN import records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-[#0A0E1A]">
                    {item.asin || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.sku || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.generateBarcode || item.sku || item.asin || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.rackAddress || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-center">
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

