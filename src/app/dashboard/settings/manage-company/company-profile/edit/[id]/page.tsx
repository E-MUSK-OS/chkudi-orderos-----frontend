import CompanyProfileEditPage from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/CompanyProfileEditPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Company Profile | OrderOS",
};

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyProfileEditPage id={id} />;
}
