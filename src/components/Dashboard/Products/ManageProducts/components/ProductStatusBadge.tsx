"use client";

interface Props {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function ProductStatusBadge({
  isActive,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition-colors
        ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}