import React from "react";
import { ShoppingBag } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

interface MaterialModulePlaceholderProps {
  title: string;
  subtitle: string;
}

/**
 * Placeholder view for Purchase -> Material menu routes until each module is built.
 */
export default function MaterialModulePlaceholder({
  title,
  subtitle,
}: MaterialModulePlaceholderProps) {
  return (
    <DashboardLayout title={title}>
      <div className="w-full space-y-4">
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
