"use client";

import Button from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;

  itemName?: string;

  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalRecords,
  pageSize,
  itemName = "records",
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start =
    totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;

  const end = Math.min(page * pageSize, totalRecords);

  return (
    <div className="mt-6 flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm text-gray-400">
        Showing{" "}
        <span className="font-semibold text-white">{start}</span>
        {" - "}
        <span className="font-semibold text-white">{end}</span>
        {" of "}
        <span className="font-semibold text-white">
          {totalRecords}
        </span>{" "}
        {itemName}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            Rows
          </span>

          <select
            value={pageSize}
            onChange={(e) =>
              onPageSizeChange(Number(e.target.value))
            }
            className="h-10 border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none"
          >
            {[10, 20, 25, 30, 50, 100].map((size) => (
              <option
                key={size}
                value={size}
              >
                {size}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <div className="bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
          {page} / {Math.max(totalPages, 1)}
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}