import React, { Suspense } from "react";
import UploadExcelPage from "@/components/Dashboard/Settings/UploadExcel/UploadExcelPage";

export const metadata = {
  title: "Upload Excel | OrderOS Settings",
  description: "Bulk upload, update, and manage Excel records across company entities, materials, and products.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Upload Excel...</div>}>
      <UploadExcelPage />
    </Suspense>
  );
}

