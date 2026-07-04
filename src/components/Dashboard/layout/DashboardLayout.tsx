"use client";

import { ReactNode, useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import LogoutModal from "./LogoutModal";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [logoutModalOpen, setLogoutModalOpen] =
    useState(false);

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#0A0E1A]">
      <div className="flex min-h-screen">

        <Sidebar
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
        />

        <section className="flex min-w-0 flex-1 flex-col">

          <Header
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            setLogoutOpen={setLogoutModalOpen}
          />

          <div className="flex-1 px-4 py-6 md:px-8 lg:py-8">
            {children}
          </div>

        </section>

      </div>

      <LogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </main>
  );
}