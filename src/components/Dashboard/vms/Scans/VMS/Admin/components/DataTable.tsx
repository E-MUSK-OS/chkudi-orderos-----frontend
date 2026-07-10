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
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0F172A] shadow-lg">
        <div className="flex h-80 items-center justify-center text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-700 bg-[#0F172A] shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-[#111827]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-700"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="
                      whitespace-nowrap
                      px-5
                      py-4
                      text-left
                      text-sm
                      font-semibold
                      text-gray-200
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
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-16 text-center text-gray-400"
                >
                  No VMS Records Found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="
                    border-b
                    border-slate-800
                    transition-colors
                    hover:bg-slate-800/40
                  "
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="
                        px-5
                        py-4
                        align-middle
                        text-sm
                        text-gray-300
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