"use client";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface WalletTableProps {
  title: string;
  columns: Column[];
  rows: Record<string, string>[];
}

const badgeStyles: Record<string, string> = {
  Credit: "bg-emerald-50 text-emerald-700",
  Debit: "bg-red-50 text-red-600",
  Success: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-red-50 text-red-700",
};

export default function WalletTable({
  title,
  columns,
  rows,
}: WalletTableProps) {
  return (
    <section className="mt-6 overflow-hidden border border-[#E7E0D2] bg-white shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-[#E7E0D2] px-6 py-4">
        <h3 className="text-xl font-bold text-[#0A0E1A]">
          {title}
        </h3>

        <span className="text-sm font-semibold text-[#C89B3C]">
          {rows.length} Records
        </span>
      </div>

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#FBFAF7] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 font-semibold uppercase ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEE8DC]">
            {rows.map((row, index) => (
              <tr
                key={index}
                className="transition hover:bg-[#FBFAF7]"
              >
                {columns.map((column) => {
                  const value = row[column.key];

                  const badge =
                    badgeStyles[value];

                  return (
                    <td
                      key={column.key}
                      className={`px-6 py-4 ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : ""
                      }`}
                    >
                      {badge ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}
                        >
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}