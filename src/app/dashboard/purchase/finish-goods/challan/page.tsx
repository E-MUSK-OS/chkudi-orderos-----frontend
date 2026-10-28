import PurchaseChallan from "@/components/Dashboard/Purchase/PurchaseChallan/PurchaseChallan";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Challan [Finish Goods] | OrderOS",
  description: "Manage Finish Goods Purchase Challans and Inward Shipments",
};

export default function PurchaseChallanPage() {
  return <PurchaseChallan />;
}
