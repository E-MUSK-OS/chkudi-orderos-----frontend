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
        border
        p-5
        transition-all
        ${
          checked
                ? "border-[#0A0E1A] bg-[#E8C16D]/20"
            : "border-slate-200 bg-white"
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

            <h4 className="font-semibold text-slate-900">
              {title}
            </h4>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}