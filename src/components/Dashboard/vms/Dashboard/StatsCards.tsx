"use client";

const stats = [
  {
    title: "VMS Scans",
    value: "128",
  },
  {
    title: "Feeds",
    value: "Rs. 84,320",
    change: "+8.2%",
  },
  {
    title: "Users",
    value: "19",
  },
];

export default function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <article
          key={item.title}
          className="border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-xl font-medium text-slate-500">
            {item.title}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <h3 className="text-4xl text-[#0A0E1A]">
              {item.value}
            </h3>

            {item.change && (
              <span
                className={`rounded px-2 py-1 text-xs font-bold ${
                  item.change.startsWith("+")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.change}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}