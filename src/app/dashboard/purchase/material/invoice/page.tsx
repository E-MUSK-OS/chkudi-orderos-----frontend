import MaterialModulePlaceholder from "@/components/Dashboard/Purchase/Material/MaterialModulePlaceholder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice [ Purchase Material ] | OrderOS",
  description: "Manage purchase material invoices",
};

export default function MaterialInvoicePage() {
  return (
    <MaterialModulePlaceholder
      title="Invoice [ Purchase Material ]"
      subtitle="Manage purchase material invoices"
    />
  );
}
