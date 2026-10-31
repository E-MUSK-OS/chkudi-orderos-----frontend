import EmployeeProfileViewPage from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/EmployeeProfileViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Employee Profile | OrderOS",
  description: "View detailed employee profile and organizational records.",
};

export default async function ViewEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeProfileViewPage id={id} />;
}

