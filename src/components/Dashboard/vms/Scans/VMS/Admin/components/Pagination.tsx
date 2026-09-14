"use client";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";

interface Props {
  page: number;
  totalPages: number;
  totalRecords: number;
  limit: number;

  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalRecords,
  limit,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: Props) {
  const pageSizeOptions = [
    { label: "10", value: "10" },
    { label: "20", value: "20" },
    { label: "25", value: "25" },
    { label: "30", value: "30" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
  ];
  const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, totalRecords);

  return (
    <div className="mt-6 flex flex-col gap-4 border border-[#E7E0D2] bg-white p-4 sm:p-5 rounded-xl shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="text-sm text-slate-500">
        Showing <span className="font-bold text-[#0A0E1A]">{start}</span> -
        <span className="font-bold text-[#0A0E1A]"> {end}</span> of{" "}
        <span className="font-bold text-[#0A0E1A]">{totalRecords}</span> records
      </div>

      {/* Right */}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Rows</span>

          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="
              h-10
              border
              border-[#E7E0D2]
              bg-white
              px-3
              text-sm
              font-semibold
              text-slate-800
              rounded-lg
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          >
            {[10, 20, 25, 30, 50, 100].map((size) => (
              <option key={size} value={size}>
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
          className="border border-[#E7E0D2] bg-white text-slate-800 font-semibold hover:bg-[#FDFBF7] rounded-lg"
        >
          Previous
        </Button>

        <div className="bg-[#0A0E1A] px-4 py-2 text-sm font-bold text-[#E8C16D] rounded-lg shadow-xs">
          {page} / {Math.max(totalPages, 1)}
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="border border-[#E7E0D2] bg-white text-slate-800 font-semibold hover:bg-[#FDFBF7] rounded-lg"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
