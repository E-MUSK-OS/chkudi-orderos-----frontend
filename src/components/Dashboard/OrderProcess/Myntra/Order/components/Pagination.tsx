"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import Button from "@/components/ui/Button";

interface Props {
  page: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-[#0A0E1A] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
      {/* Left */}
      <div className="text-xs sm:text-sm text-center sm:text-left text-white">
        Showing{" "}
        <span className="font-semibold text-white">{start}</span>
        {" - "}
        <span className="font-semibold text-white">{end}</span>
        {" of "}
        <span className="font-semibold text-white">
          {totalRecords}
        </span>{" "}
        records
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Rows */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs sm:text-sm text-white">
            Rows
          </span>

          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded border border-border bg-slate-800 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-white outline-none transition-colors focus:border-[#E8C16D]"
          >
            {[10, 20, 25, 30, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="bg-[#E8C16D] border-[#E8C16D] hover:bg-[#E8C16D] text-[#0A0E1A] font-semibold text-xs sm:text-sm"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Previous
        </Button>

        {/* Page */}
        <div className="flex h-9 min-w-[70px] sm:min-w-[80px] items-center justify-center rounded border border-border bg-slate-800 px-3 text-xs sm:text-sm font-semibold text-white">
          {page} / {Math.max(totalPages, 1)}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="bg-[#E8C16D] border-[#E8C16D] hover:bg-[#E8C16D] text-[#0A0E1A] font-semibold text-xs sm:text-sm"
        >
          Next
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}