"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Pencil, RefreshCw, Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { useSkuMappings } from "../hooks/useSkuMappings";
import { SkuMapping } from "../types/skuMapping.types";
import { downloadDemoSheet } from "../utils/skuExcelUtils";

interface Props {
  search: string;
  onEdit: (sku: SkuMapping) => void;
  onDelete: (sku: SkuMapping) => void;
}

export default function SkuMappingTable({ search, onEdit, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useSkuMappings({
    page,
    limit: pageSize,
    search,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
        <RefreshCw className="h-8 w-8 animate-spin text-[#B88728]" />
        <p className="mt-4 text-xs sm:text-sm text-slate-500 font-medium">Loading inventory records...</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#E7E0D2] bg-white p-8 sm:p-12 md:p-16 text-center shadow-sm">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF9EC] border border-[#E8C16D]/20">
          <FileSpreadsheet size={32} className="text-[#B88728]" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-[#0A0E1A]">
          No Godown Inventory Records Found
        </h3>
        <p className="mb-8 max-w-md text-xs sm:text-sm text-slate-500">
          {search
            ? "No records found matching your search query. Try searching with different keywords."
            : "Get started by downloading the demo Excel template and importing your SKU barcode mappings."}
        </p>
        <button
          type="button"
          onClick={() => downloadDemoSheet()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-5 sm:px-6 font-bold text-[#0A0E1A] transition-all shadow-sm active:scale-[0.98] cursor-pointer ring-2 ring-[#E8C16D]/30 text-xs sm:text-sm"
        >
          <Download size={18} className="text-[#B88728]" />
          <span>Download Demo Sheet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[750px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-4 sm:px-5 py-3.5 text-left font-semibold whitespace-nowrap min-w-[140px]">Short SKU</th>
              <th className="px-4 sm:px-5 py-3.5 text-left font-semibold whitespace-nowrap min-w-[180px]">Full SKU</th>
              <th className="px-4 sm:px-5 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">Barcode SKU</th>
              <th className="px-4 sm:px-5 py-3.5 text-left font-semibold whitespace-nowrap min-w-[160px]">OrderCook SKU</th>
              <th className="px-4 sm:px-5 py-3.5 text-left font-semibold whitespace-nowrap w-28">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
            {data.data.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 sm:px-5 py-3.5 text-left">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {item.shortSku}
                  </span>
                </td>

                <td className="px-4 sm:px-5 py-3.5 text-left">
                  {item.fullSku ? (
                    <span className="text-xs sm:text-sm font-medium text-slate-800">{item.fullSku}</span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">-</span>
                  )}
                </td>

                <td className="px-4 sm:px-5 py-3.5 text-left">
                  <span className="text-xs sm:text-sm font-medium text-slate-800">
                    {item.barcodeSku}
                  </span>
                </td>

                <td className="px-4 sm:px-5 py-3.5 text-left">
                  {item.ordercookSku ? (
                    <span className="text-xs sm:text-sm font-medium text-slate-800">{item.ordercookSku}</span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">-</span>
                  )}
                </td>

                <td className="px-4 sm:px-5 py-3.5 text-left">
                  <div className="flex items-center justify-start gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                      title="Edit SKU Mapping"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-red-200 bg-red-50/60 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                      title="Delete SKU Mapping"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        limit={pageSize}
        itemName="records"
        variant="dark"
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setPageSize(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
}
