import { redirect } from "next/navigation";

export default function SkuMappingRedirectPage() {
  redirect("/dashboard/settings/labels/label-print");
}
