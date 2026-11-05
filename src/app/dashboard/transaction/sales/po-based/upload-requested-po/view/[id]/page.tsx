import POViewPage from "@/components/Dashboard/Transaction/Sales/PoBased/UploadRequestedPO/POViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Order Details | OrderOS",
  description: "View parsed purchase order line items and quantities.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <POViewPage id={id} />;
}

