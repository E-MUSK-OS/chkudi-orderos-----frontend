import MaterialModulePlaceholder from "@/components/Dashboard/Purchase/Material/MaterialModulePlaceholder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discount DN [ Purchase Material ] | OrderOS",
  description: "Manage purchase material discount debit notes",
};

export default function MaterialDiscountDebitNotePage() {
  return (
    <MaterialModulePlaceholder
      title="Discount DN [ Purchase Material ]"
      subtitle="Manage purchase material discount debit notes"
    />
  );
}
