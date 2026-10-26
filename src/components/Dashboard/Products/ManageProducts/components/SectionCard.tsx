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
    <section className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden">
      <div className="border-b border-slate-200 dark:border-white/[0.08] p-3.5 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-[#C89B3C]/10 text-[#C89B3C] dark:text-[#F5C451]">
            {icon}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
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

      <div className="space-y-4 sm:space-y-5 p-3.5 sm:p-5">
        {children}
      </div>
    </section>
  );
}