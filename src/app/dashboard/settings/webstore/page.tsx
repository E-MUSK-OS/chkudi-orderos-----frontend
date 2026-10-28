import Webstore from "@/components/Dashboard/Settings/Webstore/Webstore";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webstore | OrderOS",
  description: "Manage Marketplace Webstores, SP-API credentials, and channel configurations.",
};

export default function SettingsWebstorePage() {
  return <Webstore />;
}
