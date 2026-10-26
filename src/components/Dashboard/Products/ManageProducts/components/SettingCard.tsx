"use client";

import type { ReactNode } from "react";

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SectionCard({
  icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C89B3C]/10 text-[#C89B3C] dark:text-[#F5C451]">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5 p-6">
        {children}
      </div>
    </div>
  );
}