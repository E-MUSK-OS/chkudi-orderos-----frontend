"use client";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const styles = {
    COMPLETED:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",

    PENDING:
      "bg-amber-50 text-amber-700 border border-amber-200",

    FAILED:
      "bg-rose-50 text-rose-700 border border-rose-200",

    UPLOADING:
      "bg-blue-50 text-blue-700 border border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status as keyof typeof styles] ||
        "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}