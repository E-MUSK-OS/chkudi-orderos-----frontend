"use client";

const stats = [
  {
    title: "Today Orders",
    value: "128",
    change: "+12.5%",
  },
  {
    title: "Revenue",
    value: "Rs. 84,320",
    change: "+8.2%",
  },
  {
    title: "Pending",
    value: "19",
    change: "-4.1%",
  },
  {
    title: "Customers",
    value: "2,846",
    change: "+18.4%",
  },
];

export default function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.title}
          className="border border-[#E7E0D2] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">
            {item.title}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <h3 className="text-3xl font-bold text-[#0A0E1A]">
              {item.value}
            </h3>

            <span
              className={`rounded px-2 py-1 text-xs font-bold ${
                item.change.startsWith("+")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {item.change}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}