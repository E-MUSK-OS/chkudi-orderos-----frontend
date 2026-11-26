import PurchaseChallanViewPage from "@/components/Dashboard/Purchase/PurchaseChallan/PurchaseChallanViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Purchase Challan | OrderOS",
  description: "View and print Purchase Challan",
};

export default function Page() {
  return <PurchaseChallanViewPage />;
}
