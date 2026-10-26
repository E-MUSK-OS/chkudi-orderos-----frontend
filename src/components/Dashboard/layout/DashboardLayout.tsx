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
    <main className="h-screen w-screen overflow-hidden bg-[#F7F5F0] text-[#0A0E1A] dark:bg-[#080B11] dark:text-slate-100 selection:bg-[#E8C16D]/30 selection:text-[#0A0E1A] dark:selection:bg-[#F5C451]/25 dark:selection:text-[#FCD34D] relative font-sans transition-colors duration-200">
      {/* Ambient top light mesh (dark theme only) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,196,81,0.06),transparent_70%)] z-0 hidden dark:block" />

      <div className="relative z-10 flex h-screen w-full overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
        />

        <section className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
          <Header
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            setLogoutOpen={setLogoutModalOpen}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 md:px-8 py-4 sm:py-6 lg:py-8 custom-scrollbar">
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