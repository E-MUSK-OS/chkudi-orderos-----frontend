"use client";

import React, { Suspense } from "react";
import PurchaseReportView from "@/components/Dashboard/Report/components/PurchaseReportView";

export default function PurchaseAccountReportPage() {
  return (
    <Suspense fallback={null}>
      <PurchaseReportView />
    </Suspense>
  );
}
