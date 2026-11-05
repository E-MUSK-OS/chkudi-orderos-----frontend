import type { ReactNode } from "react";

interface Props {
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
}: Props) {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-visible shadow-sm">
      <div className="rounded-t-2xl sm:rounded-t-3xl border-b border-[#E7E0D2] dark:border-white/[0.08] p-4 sm:p-6 bg-[#FAF8F5]/50 dark:bg-[#080B11]/50">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            {icon}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
              {title}
            </h3>

            {description && (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}
