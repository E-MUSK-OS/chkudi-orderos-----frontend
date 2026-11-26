import SalesInvoiceViewPage from "@/components/Dashboard/OfflineSales/SalesInvoice/SalesInvoiceViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Sales Invoice | OrderOS",
  description: "View and print Sales Tax Invoice",
};

export default function Page() {
  return <SalesInvoiceViewPage />;
}
