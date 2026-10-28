import React, { Suspense } from "react";
import PurchaseInvoicePage from "@/components/Dashboard/Purchase/PurchaseInvoice/PurchaseInvoicePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Invoice | OrderOS",
  description: "Purchase Challan Invoice generation, statutory GST calculations, and export",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Loading Purchase Invoice...
          </p>
        </div>
      }
    >
      <PurchaseInvoicePage />
    </Suspense>
  );
}
