import PurchaseInvoiceViewPage from "@/components/Dashboard/Purchase/PurchaseInvoice/PurchaseInvoiceViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Purchase Invoice | OrderOS",
  description: "View and print Purchase Tax Invoice",
};

export default function Page() {
  return <PurchaseInvoiceViewPage />;
}
