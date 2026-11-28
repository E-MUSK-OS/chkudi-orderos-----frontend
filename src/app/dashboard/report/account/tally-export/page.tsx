"use client";

import React, { Suspense } from "react";
import TallyExportView from "@/components/Dashboard/Report/components/TallyExportView";

export default function TallyExportReportPage() {
  return (
    <Suspense fallback={null}>
      <TallyExportView />
    </Suspense>
  );
}
