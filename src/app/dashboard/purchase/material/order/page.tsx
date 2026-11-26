import MaterialOrderPage from "@/components/Dashboard/Purchase/Material/Order/MaterialOrderPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order [ Purchase Material & Service ] | OrderOS",
  description: "Manage purchase materials orders",
};

export default function MaterialOrderRoutePage() {
  return <MaterialOrderPage />;
}
