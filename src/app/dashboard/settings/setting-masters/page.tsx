import SettingMasters from "@/components/Dashboard/Settings/SettingMasters/SettingMasters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setting Masters | OrderOS",
  description: "Manage dynamic form dropdown options, field masters, and active option values.",
};

export default function SettingMastersPage() {
  return <SettingMasters />;
}

