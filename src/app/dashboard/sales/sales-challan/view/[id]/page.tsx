import SalesChallanViewPage from "@/components/Dashboard/OfflineSales/SalesChallan/SalesChallanViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Sales Challan | OrderOS",
  description: "View and print Sales Delivery Challan",
};

export default function Page() {
  return <SalesChallanViewPage />;
}
