import MaterialModulePlaceholder from "@/components/Dashboard/Purchase/Material/MaterialModulePlaceholder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return DN [ Purchase Material ] | OrderOS",
  description: "Manage purchase material return debit notes",
};

export default function MaterialReturnDebitNotePage() {
  return (
    <MaterialModulePlaceholder
      title="Return DN [ Purchase Material ]"
      subtitle="Manage purchase material return debit notes"
    />
  );
}
