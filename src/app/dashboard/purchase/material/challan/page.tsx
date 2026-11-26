import MaterialChallanPage from "@/components/Dashboard/Purchase/Material/Challan/MaterialChallanPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challan [ Purchase Material & Service ] | OrderOS",
  description: "Manage purchase materials challans",
};

export default function MaterialChallanRoutePage() {
  return <MaterialChallanPage />;
}
