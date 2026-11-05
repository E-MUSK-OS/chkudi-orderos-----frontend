import UploadRequestedPOPage from "@/components/Dashboard/Transaction/Sales/PoBased/UploadRequestedPO/UploadRequestedPOPage";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Upload Requested PO | OrderOS",
  description: "Upload and manage requested purchase orders for webstores.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UploadRequestedPOPage />
    </Suspense>
  );
}
