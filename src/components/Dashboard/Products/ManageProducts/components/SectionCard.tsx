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
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-[#C89B3C]">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {children}
      </div>
    </section>
  );
}