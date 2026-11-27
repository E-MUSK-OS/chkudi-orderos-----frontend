import { redirect } from "next/navigation";

export default function LegacyProductsInventoryRedirectPage() {
  redirect("/dashboard/inventory/product");
}
