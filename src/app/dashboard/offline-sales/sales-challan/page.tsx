import SalesChallan from "@/components/Dashboard/OfflineSales/SalesChallan/SalesChallan";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Challan | OrderOS",
  description: "Manage Sales Challan and Party Ledgers",
};

export default function SalesChallanPage() {
  return <SalesChallan />;
}
