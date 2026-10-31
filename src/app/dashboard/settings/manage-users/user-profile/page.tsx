import React from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import UserProfileList from "@/components/Dashboard/Settings/ManageUsers/UserProfileList";

export const metadata = {
  title: "User Profile | Manage Users | OrderOS",
};

export default function UserProfilePage() {
  return (
    <DashboardLayout title="User Profile">
      <UserProfileList />
    </DashboardLayout>
  );
}

