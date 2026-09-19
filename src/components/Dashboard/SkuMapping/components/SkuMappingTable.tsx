"use client";

import { useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";

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
//   const limit = 10;

  const { data, isLoading } = useSkuMappings({
    page,
    limit: pageSize,
    search,
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">Loading...</div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C89B3C] mb-4">
          <Download size={26} />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No Godown Inventory Records Found
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500 mb-5">
          Get started by downloading the demo Excel template and importing your SKU mappings.
        </p>
        <Button
          variant="outline"
          fullWidth={false}
          onClick={() => downloadDemoSheet()}
          className="h-10 px-4 text-sm rounded-lg flex items-center gap-2 border-[#C89B3C]/50 text-[#C89B3C] hover:bg-[#FFF8E7] hover:border-[#C89B3C]"
        >
          <Download size={16} />
          Download Demo Sheet
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Short SKU</th>

              <th className="px-4 py-3 text-left">Full SKU</th>

              <th className="px-4 py-3 text-left">Barcode SKU</th>

              <th className="px-4 py-3 text-left">OrderCook SKU</th>

              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.shortSku}</td>

                <td className="px-4 py-3 text-slate-700">{item.fullSku || "-"}</td>

                <td className="px-4 py-3">{item.barcodeSku}</td>

                <td className="px-4 py-3">{item.ordercookSku}</td>

                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      size="icon"
                      variant="primary"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalPages={data.pagination.totalPages}
        totalRecords={data.pagination.total}
        itemName="Records"
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
