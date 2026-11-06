"use client";

import React from "react";
import Pagination from "@/components/ui/Pagination";

interface SalariedEmployeePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export default function SalariedEmployeePagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}: SalariedEmployeePaginationProps) {
  return (
    <Pagination
      page={currentPage}
      totalPages={totalPages}
      totalRecords={totalRecords}
      total={totalRecords}
      pageSize={pageSize}
      limit={pageSize}
      itemName="entries"
      variant="dark"
      options={[10, 20, 50, 100]}
      className={
        className ||
        "border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
      }
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onLimitChange={onPageSizeChange}
    />
  );
}
