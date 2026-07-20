"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import NotificationList from "./components/NotificationList";

export default function NotificationsPage() {
  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6">
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}