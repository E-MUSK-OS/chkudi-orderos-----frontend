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
      className={`border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6">
        {children}
      </div>
    </section>
  );
}