import CompanyProfile from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/CompanyProfile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Profile | OrderOS",
  description: "Manage company information, GST credentials, and profile registrations.",
};

export default function CompanyProfilePage() {
  return <CompanyProfile />;
}
