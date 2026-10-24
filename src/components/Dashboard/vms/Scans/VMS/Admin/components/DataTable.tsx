"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface Props<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  loading?: boolean;
  pagination?: React.ReactNode;
}

export default function DataTable<TData>({
  columns,
  data,
  loading = false,
  pagination,
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
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
        <div className="flex h-80 items-center justify-center text-slate-400 text-xs sm:text-sm font-medium">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[1020px] border-collapse text-center font-sans">
          {/* Header */}
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { headerClassName?: string; cellClassName?: string }
                    | undefined;

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap px-3 sm:px-4 py-3.5 font-semibold text-[#E8C16D]",
                        meta?.headerClassName || "text-center",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-[#E7E0D2] text-xs sm:text-sm font-sans">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-slate-500"
                >
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0A0E1A] border-r-transparent mb-3" />
                  <p className="text-xs sm:text-sm font-medium">Loading VMS records...</p>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-slate-500 font-semibold text-xs sm:text-sm"
                >
                  No VMS Records Found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition hover:bg-[#FAF8F5]"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { headerClassName?: string; cellClassName?: string }
                      | undefined;

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 sm:px-4 py-3.5 align-middle text-slate-700",
                          meta?.cellClassName || "text-center",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  );
}