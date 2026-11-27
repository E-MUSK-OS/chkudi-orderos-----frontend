import type { Metadata } from "next";
import UpdateInventoryPage from "@/components/Dashboard/Settings/UpdateInventory/UpdateInventoryPage";

export const metadata: Metadata = {
  title: "Update Inventory | OrderOS",
  description: "Manage and update inventory settings and stock adjustments.",
};

export default function Page() {
  return <UpdateInventoryPage />;
}
