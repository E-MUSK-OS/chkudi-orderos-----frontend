"use client";

interface Props {
  status: "PENDING" | "SCANNED";
}

export default function ScanStatusBadge({ status }: Props) {
  if (status === "SCANNED") {
    return (
      <span
        className="
          inline-flex
          items-center
          rounded-full
          border
          border-green-500/30
          bg-green-500/15
          px-3
          py-1
          text-xs
          font-semibold
          text-green-400
        "
      >
        Scanned
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        border
        border-yellow-500/30
        bg-yellow-500/15
        px-3
        py-1
        text-xs
        font-semibold
        text-yellow-400
      "
    >
      Pending
    </span>
  );
}