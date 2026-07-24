interface Props {
  isActive: boolean;
}

export default function WarehouseStatusBadge({
  isActive,
}: Props) {
  if (isActive) {
    return (
      <span
        className="
          inline-flex
          items-center
          rounded-full
          bg-emerald-100
          px-3
          py-1
          text-xs
          font-semibold
          text-emerald-700
        "
      >
        Active
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        bg-red-100
        px-3
        py-1
        text-xs
        font-semibold
        text-red-700
      "
    >
      Inactive
    </span>
  );
}