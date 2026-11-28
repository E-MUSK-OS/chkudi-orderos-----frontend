import { redirect } from "next/navigation";

export default function ProductInventoryRedirectPage() {
  redirect("/dashboard/inventory/product/product-inventory");
}
