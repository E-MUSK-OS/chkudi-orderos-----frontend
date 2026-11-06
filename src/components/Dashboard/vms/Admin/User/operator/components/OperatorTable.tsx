"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Edit, Trash2, Users } from "lucide-react";

import { Operator } from "../types/operator";
import Pagination from "@/components/ui/Pagination";

interface Props {
  operators: Operator[];
  loading?: boolean;

  onEdit: (operator: Operator) => void;
  onDelete: (operator: Operator) => void;
}

const OperatorTable: React.FC<Props> = ({
  operators,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = operators.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit;

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedOperators = useMemo(() => {
    return operators.slice(startIndex, startIndex + limit);
  }, [operators, startIndex, limit]);

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center shadow-sm">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent mx-auto mb-2" />
        <p className="text-sm font-bold text-[#0A0E1A] dark:text-white">Loading operators...</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center shadow-sm">
        <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
          <Users className="h-7 w-7 text-[#B88728] dark:text-[#E8C16D]" />
        </div>
        <p className="text-base font-bold text-[#0A0E1A] dark:text-white">No Operators Found</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col justify-between">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[650px] border-collapse text-left font-sans">
          <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
            <tr>
              <th className="px-5 py-3.5 sm:py-4 text-left font-semibold">
                Operator Name
              </th>

              <th className="px-5 py-3.5 sm:py-4 text-left font-semibold">
                Employee Code
              </th>

              <th className="px-5 py-3.5 sm:py-4 text-left font-semibold">
                Status
              </th>

              <th className="px-5 py-3.5 sm:py-4 text-center font-semibold w-32">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
            {paginatedOperators.map((operator) => (
              <tr
                key={operator.id}
                className="hover:bg-slate-50/80 dark:hover:bg-white/[0.06] transition-colors"
              >
                <td className="px-5 py-3.5 sm:py-4 font-semibold text-slate-900 dark:text-white">
                  {operator.operatorName}
                </td>

                <td className="px-5 py-3.5 sm:py-4 font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {operator.employeeCode}
                </td>

                <td className="px-5 py-3.5 sm:py-4">
                  {operator.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Inactive
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5 sm:py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(operator)}
                      className="rounded-xl p-2 text-slate-600 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(operator)}
                      className="rounded-xl p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        options={[5, 10, 20, 50]}
        itemName="operators"
        isLoading={loading}
        variant="dark"
        className="border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
};

export default OperatorTable;
