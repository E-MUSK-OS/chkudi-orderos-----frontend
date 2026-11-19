import React from "react";
import { Metadata } from "next";
import AmazonIntegration from "@/components/Dashboard/Settings/Amazon/AmazonIntegration";

export const metadata: Metadata = {
  title: "Amazon SP-API Integration | Chkudi OrderOS",
  description: "Manage Amazon Seller Central SP-API connections, OAuth tokens, order sync, inventory, and listings.",
};

export default function AmazonSettingsPage() {
  return <AmazonIntegration />;
}
