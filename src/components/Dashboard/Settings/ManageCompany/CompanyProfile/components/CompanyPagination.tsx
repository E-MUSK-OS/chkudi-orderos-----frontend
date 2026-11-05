"use client";

import React from "react";
import Pagination, { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/ui/Pagination";

interface CompanyPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  options?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  className?: string;
}

export default function CompanyPagination({
  total,
  page,
  pageSize,
  totalPages: propTotalPages,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  className = "",
}: CompanyPaginationProps) {
  const totalPages = propTotalPages || Math.max(1, Math.ceil(total / pageSize));

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      totalRecords={total}
      total={total}
      pageSize={pageSize}
      limit={pageSize}
      itemName="entries"
      variant="dark"
      options={options}
      className={
        className ||
        "border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
      }
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onLimitChange={onPageSizeChange}
    />
  );
}
