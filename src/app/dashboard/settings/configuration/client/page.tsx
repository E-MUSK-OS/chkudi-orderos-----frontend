import ClientConfiguration from "@/components/Dashboard/Settings/Configuration/ClientConfiguration";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Configuration | OrderOS",
  description: "Create & Manage Client wise Productxpert and OrderOS Route Configuration.",
};

export default function ClientConfigurationPage() {
  return <ClientConfiguration />;
}

