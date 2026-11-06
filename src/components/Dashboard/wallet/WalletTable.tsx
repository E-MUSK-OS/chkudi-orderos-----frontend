"use client";

import { useState, useMemo, useEffect } from "react";
import Pagination from "@/components/ui/Pagination";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface WalletTableProps {
  title: string;
  columns: Column[];
  rows: Record<string, string>[];
}

const badgeStyles: Record<string, string> = {
  Credit: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
  Debit: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30",
  Success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
  Pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/30",
  Failed: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400 dark:border dark:border-red-500/30",
};

export default function WalletTable({
  title,
  columns,
  rows,
}: WalletTableProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, rows]);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return rows.slice(startIndex, startIndex + limit);
  }, [rows, page, limit]);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-[#E7E0D2] px-6 py-4.5 dark:border-white/[0.08]">
        <h3 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
          {title}
        </h3>

        <span className="rounded-full bg-[#FFF9EC] px-3 py-1 text-xs font-semibold text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
          {rows.length} Records
        </span>
      </div>

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#F5E6BE] bg-[#FEFAEE] dark:bg-none dark:border-white/[0.08] dark:bg-[#080B11]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {paginatedRows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
              >
                {columns.map((column) => {
                  const value = row[column.key];

                  const badge =
                    badgeStyles[value];

                  return (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-slate-800 dark:text-slate-200 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {badge ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}
                        >
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
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
        itemName="records"
        variant="dark"
        className="border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#090D17]"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </section>
  );
}
