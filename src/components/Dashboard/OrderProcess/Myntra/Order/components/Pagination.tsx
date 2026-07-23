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
    <div className="mt-6 flex flex-col gap-4 border border-border bg-[#0A0E1A] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <div className="text-sm text-white">
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Rows */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-white">
            Rows
          </span>

          <select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
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
          className="bg-[#E8C16D] border-[#E8C16D] hover:bg-[#E8C16D] w-30"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        {/* Page */}
        <div className="flex h-9 min-w-[80px] items-center justify-center border border-border bg-muted px-4 text-sm font-semibold text-foreground">
          {page} / {Math.max(totalPages, 1)}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="bg-[#E8C16D] border-[#E8C16D] hover:bg-[#E8C16D] w-30"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}