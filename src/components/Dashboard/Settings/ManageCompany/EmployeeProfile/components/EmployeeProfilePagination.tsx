"use client";

import React from "react";
import Pagination from "@/components/ui/Pagination";

interface EmployeeProfilePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  className?: string;
}

export default function EmployeeProfilePagination({
  page,
  pageSize,
  total,
  totalPages: propTotalPages,
  onPageChange,
  onPageSizeChange,
  className = "",
}: EmployeeProfilePaginationProps) {
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
      options={[10, 20, 50, 100]}
      className={
        className ||
        "border-t border-[#E7E0D2] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
      }
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onLimitChange={onPageSizeChange}
    />
  );
}
