import MaterialInvoicePage from "@/components/Dashboard/Purchase/Material/Invoice/MaterialInvoicePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice [ Purchase Material & Service ] | OrderOS",
  description: "Manage purchase materials bills",
};

export default function MaterialInvoiceListPage() {
  return <MaterialInvoicePage />;
}
