import EmployeeProfileForm from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/components/EmployeeProfileForm";

export const metadata = {
  title: "Create Employee - Manage Company",
};

export default function NewEmployeePage() {
  return <EmployeeProfileForm mode="create" />;
}

