"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface Props<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
}

export default function DataTable<TData>({
  columns,
  data,
  loading = false,
}: Props<TData>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-xl border border-[#E7E0D2] bg-white shadow-sm">
        <div className="flex h-80 items-center justify-center text-slate-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E0D2] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-[#0A0E1A] text-[#E8C16D] border-b border-[#E7E0D2]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[#E7E0D2]"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="
                      whitespace-nowrap
                      px-5
                      py-4
                      text-left
                      text-xs sm:text-sm
                      font-bold
                      uppercase
                      tracking-wider
                      text-[#E8C16D]
                    "
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-[#E7E0D2]">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-slate-500"
                >
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0A0E1A] border-r-transparent mb-3" />
                  <p className="text-sm font-medium">Loading VMS records...</p>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-slate-500 font-semibold text-base"
                >
                  No VMS Records Found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="
                    transition-colors
                    hover:bg-[#FDFBF7]
                  "
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="
                        px-5
                        py-4
                        align-middle
                        text-sm sm:text-base
                        text-slate-700
                      "
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}