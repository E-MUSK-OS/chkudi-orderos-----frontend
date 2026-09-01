"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";

import { useSkuMappings } from "../hooks/useSkuMappings";
import { SkuMapping } from "../types/skuMapping.types";

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
      <div className="flex h-40 items-center justify-center text-slate-500">
        No SKU Mapping Found
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Short SKU</th>

              <th className="px-4 py-3 text-left">Barcode SKU</th>

              <th className="px-4 py-3 text-left">OrderCook SKU</th>

              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.shortSku}</td>

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
        itemName="SKU Mappings"
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
