"use client";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const styles = {
    COMPLETED:
      "bg-green-500/15 text-green-400 border border-green-500/30",

    PENDING:
      "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",

    FAILED:
      "bg-red-500/15 text-red-400 border border-red-500/30",

    UPLOADING:
      "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status as keyof typeof styles] ||
        "bg-gray-700 text-white"
      }`}
    >
      {status}
    </span>
  );
}