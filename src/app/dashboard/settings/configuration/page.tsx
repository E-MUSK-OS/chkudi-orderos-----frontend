import { redirect } from "next/navigation";

export default function ConfigurationIndexPage() {
  redirect("/dashboard/settings/configuration/client");
}

