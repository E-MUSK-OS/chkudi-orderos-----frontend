"use client";

import { Pencil, Trash2 } from "lucide-react";
import ActionMenu from "@/components/ui/ActionMenu";
import type { MyntraImportItem } from "../types/myntraImport.types";

interface Props {
  items: MyntraImportItem[];
  isLoading?: boolean;
  onEdit: (item: MyntraImportItem) => void;
  onDelete: (id: string) => void;
}

export default function MyntraTable({
  items,
  isLoading = false,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#E7EAF0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Rack Address</th>
              <th className="px-4 py-3 text-left">Myntra SKU</th>
              <th className="px-4 py-3 text-left">Seller SKU</th>
              <th className="px-4 py-3 text-left">Generate Barcode</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7EAF0]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </td>
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
                  No Myntra SKU mapping records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-semibold text-[#0A0E1A]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      {item.rackAddress || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#0A0E1A]">
                    {item.myntraSku || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.sellerSku || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {item.generateBarcode || item.generatedBarcode || item.sellerSku || item.myntraSku || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-700 text-xs">
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
                            label: "Edit Myntra Record",
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
