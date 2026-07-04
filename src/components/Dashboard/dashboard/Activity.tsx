"use client";

const activities = [
  {
    title: "Accepted",
    progress: 82,
  },
  {
    title: "Preparing",
    progress: 56,
  },
  {
    title: "Delivered",
    progress: 74,
  },
];

export default function Activity() {
  return (
    <aside className="space-y-6">
      {/* Activity Card */}

      <section className="border border-[#E7E0D2] bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold">
          Activity
        </h3>

        <div className="mt-5 space-y-5">
          {activities.map((item) => (
            <div key={item.title}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {item.title}
                </span>

                <span className="text-sm text-slate-500">
                  {item.progress}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-[#EFE8D8]">
                <div
                  className="h-full rounded-full bg-[#C89B3C] transition-all duration-500"
                  style={{
                    width: `${item.progress}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary Card */}

      <section className="bg-[#0A0E1A] p-5 text-white shadow-sm">

        <p className="text-sm font-semibold uppercase text-[#E8C16D]">
          Dashboard
        </p>

        <h3 className="mt-3 text-2xl font-bold">
          19 Orders Need Attention
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Monitor recent activity, pending orders and business
          performance from your dashboard.
        </p>

      </section>
    </aside>
  );
}