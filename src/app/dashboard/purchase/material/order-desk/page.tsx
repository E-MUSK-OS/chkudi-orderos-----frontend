import MaterialModulePlaceholder from "@/components/Dashboard/Purchase/Material/MaterialModulePlaceholder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Desk [ Purchase Material ] | OrderOS",
  description: "Manage purchase material order desk",
};

export default function MaterialOrderDeskPage() {
  return (
    <MaterialModulePlaceholder
      title="Order Desk [ Purchase Material ]"
      subtitle="Manage purchase material order desk"
    />
  );
}
