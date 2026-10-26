import { Checkbox } from "@/components/ui/checkbox";
import { ReactNode } from "react";

interface SettingCardProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
  icon?: ReactNode;
}

export default function SettingCard({
  checked,
  onCheckedChange,
  title,
  description,
  icon,
}: SettingCardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-5
        transition-all
        ${
          checked
            ? "border-[#E8C16D] bg-[#FFF9EC]/50 dark:border-[#F5C451]/50 dark:bg-[#F5C451]/10"
            : "border-[#E7E0D2] bg-white dark:border-white/[0.08] dark:bg-[#0F1626]"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon}

            <h4 className="font-semibold text-slate-900 dark:text-white">
              {title}
            </h4>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}