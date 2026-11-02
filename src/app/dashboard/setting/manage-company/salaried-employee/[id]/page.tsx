import SalariedEmployeeDetailPage from "@/components/Dashboard/Settings/ManageCompany/SalariedEmployee/SalariedEmployeeDetailPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salaried Employee Details | OrderOS",
  description: "Manage salaried employee working details and absent hours.",
};

export default async function SalariedEmployeePageById({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SalariedEmployeeDetailPage id={id} />;
}

