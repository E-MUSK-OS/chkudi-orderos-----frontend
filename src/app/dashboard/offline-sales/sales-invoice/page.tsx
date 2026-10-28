import React, { Suspense } from "react";
import SalesInvoicePage from "@/components/Dashboard/OfflineSales/SalesInvoice/SalesInvoicePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Invoice | OrderOS",
  description: "Offline Sales Tax Invoice generation, statutory GST calculations, and export",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Loading Sales Invoice...
          </p>
        </div>
      }
    >
      <SalesInvoicePage />
    </Suspense>
  );
}
