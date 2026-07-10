"use client";

import Button from "@/components/ui/Button";

interface Props {
  page: number;
  totalPages: number;
  totalRecords: number;
  limit: number;

  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
}: Props) {
  const start =
    totalRecords === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, totalRecords);

  return (
    <div className="mt-6 flex flex-col gap-4 border border-slate-700 bg-[#0F172A] p-5 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="text-sm text-gray-400">
        Showing{" "}
        <span className="font-semibold text-white">
          {start}
        </span>{" "}
        -
        <span className="font-semibold text-white">
          {" "}
          {end}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-white">
          {totalRecords}
        </span>{" "}
        records
      </div>

      {/* Right */}

      <div className="flex items-center gap-3">

        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <div className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
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