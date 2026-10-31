"use client";

import React from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import UserProfileDetailView from "@/components/Dashboard/Settings/ManageUsers/UserProfileDetailView";

export default function UserDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  return (
    <DashboardLayout title="User Profile">
      <UserProfileDetailView userId={id} />
    </DashboardLayout>
  );
}

