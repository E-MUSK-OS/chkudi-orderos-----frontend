import { useState, useMemo, useEffect } from "react";
import { Star, WarehouseIcon } from "lucide-react";
import type { Warehouse } from "../types/warehouse.types";
import WarehouseActionMenu from "./WarehouseActionMenu";
import { Switch } from "@/components/ui/switch";
import Pagination from "@/components/ui/Pagination";

interface Props {
  warehouses: Warehouse[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onStatusChange: (warehouse: Warehouse, checked: boolean) => void;
}

export default function WarehouseTable({
  warehouses,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const sortedWarehouses = useMemo(() => {
    return [...warehouses].sort((a, b) => {
      if (a.isDefault === b.isDefault) return 0;

      return a.isDefault ? -1 : 1;
    });
  }, [warehouses]);

  const total = sortedWarehouses.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, warehouses]);

  const paginatedWarehouses = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return sortedWarehouses.slice(startIndex, startIndex + limit);
  }, [sortedWarehouses, page, limit]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="border-b border-[#E7E0D2] bg-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#080B11]">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D]">
                Warehouse
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D]">
                Contact
              </th>

              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D]">
                Default
              </th>

              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D]">
                Active
              </th>

              <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white dark:text-[#E8C16D]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {paginatedWarehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
              >
                {/* Warehouse */}
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                      <WarehouseIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{warehouse.warehouseName}</p>

                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {warehouse.warehouseCode}
                      </p>

                      {warehouse.description && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {warehouse.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{warehouse.contactPerson}</p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">{warehouse.phone}</p>
                  </div>
                </td>

                {/* Default */}
                <td className="px-6 py-4 text-center">
                  {warehouse.isDefault ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9EC] px-2.5 py-1 text-xs font-semibold text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                      <Star size={13} />
                      Default
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <Switch
                      checked={warehouse.isActive}
                      onCheckedChange={(checked: boolean) => {
                        console.log("Switch:", checked);
                        onStatusChange(warehouse, checked);
                      }}
                    />
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <WarehouseActionMenu
                      isActive={warehouse.isActive}
                      onEdit={() => onEdit(warehouse)}
                      onDelete={() => onDelete(warehouse)}
                      onStatusChange={() => {}}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        options={[5, 10, 20, 50]}
        itemName="warehouses"
        variant="dark"
        className="border-t border-[#E7E0D2] bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#090D17]"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
}
