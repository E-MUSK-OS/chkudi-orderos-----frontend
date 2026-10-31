import CompanyProfileViewPage from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/CompanyProfileViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Company Profile | OrderOS",
  description: "View full company profile details, addresses, taxation, bank details, and branches.",
};

export default async function ViewCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyProfileViewPage id={id} />;
}
