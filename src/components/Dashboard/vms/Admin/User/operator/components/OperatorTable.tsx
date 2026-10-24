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
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent mx-auto mb-2" />
        <p className="text-sm font-bold text-[#0A0E1A]">Loading operators...</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF9EC] border border-[#E8C16D]/30">
          <Users className="h-7 w-7 text-[#B88728]" />
        </div>
        <p className="text-base font-bold text-[#0A0E1A]">No Operators Found</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col justify-between">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[650px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
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

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
            {paginatedOperators.map((operator) => (
              <tr
                key={operator.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-5 py-3.5 sm:py-4 font-semibold text-slate-900">
                  {operator.operatorName}
                </td>

                <td className="px-5 py-3.5 sm:py-4 font-mono text-xs sm:text-sm text-slate-700">
                  {operator.employeeCode}
                </td>

                <td className="px-5 py-3.5 sm:py-4">
                  {operator.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
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
                      className="rounded-xl p-2 text-slate-600 hover:text-[#B88728] hover:bg-[#FFF9EC] transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(operator)}
                      className="rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
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