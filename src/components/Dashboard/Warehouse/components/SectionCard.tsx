import { ReactNode } from "react";

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({
  icon,
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-xl sm:rounded-2xl border border-[#E7E0D2] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626] overflow-hidden ${className}`}
    >
      <div className="flex items-start gap-3 sm:gap-4 border-b border-[#E7E0D2] px-3.5 sm:px-6 py-3.5 sm:py-5 dark:border-white/[0.08]">
        <div className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>

          {description && (
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 p-3.5 sm:p-6">
        {children}
      </div>
    </section>
  );
}