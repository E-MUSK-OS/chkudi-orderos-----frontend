"use client";

const orders = [
  {
    id: "#ORD-1048",
    customer: "Ravi Patel",
    status: "Delivered",
    amount: "Rs. 1,240",
  },
  {
    id: "#ORD-1047",
    customer: "Nisha Shah",
    status: "Preparing",
    amount: "Rs. 860",
  },
  {
    id: "#ORD-1046",
    customer: "Amit Kumar",
    status: "Pending",
    amount: "Rs. 1,920",
  },
  {
    id: "#ORD-1045",
    customer: "Meera Joshi",
    status: "Delivered",
    amount: "Rs. 740",
  },
];

const statusStyles: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700",
  Preparing: "bg-amber-50 text-amber-700",
  Pending: "bg-slate-100 text-slate-700",
};

export default function RecentOrders() {
  return (
    <section className="border border-[#E7E0D2] bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-[#E7E0D2] px-5 py-4">
        <h3 className="text-xl font-bold">
          Recent Orders
        </h3>

        <span className="text-sm font-semibold text-[#C89B3C]">
          {orders.length} Items
        </span>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[650px] text-left">

          <thead className="bg-[#FBFAF7]">

            <tr className="text-xs uppercase text-slate-500">

              <th className="px-5 py-4">Order ID</th>

              <th className="px-5 py-4">Customer</th>

              <th className="px-5 py-4">Status</th>

              <th className="px-5 py-4 text-right">
                Amount
              </th>

            </tr>

          </thead>

          <tbody>

            {orders.map((order) => (

              <tr
                key={order.id}
                className="border-t border-[#EEE8DC] hover:bg-[#FBFAF7]"
              >
                <td className="px-5 py-4 font-bold">
                  {order.id}
                </td>

                <td className="px-5 py-4 text-slate-600">
                  {order.customer}
                </td>

                <td className="px-5 py-4">

                  <span
                    className={`inline-flex rounded px-3 py-1 text-xs font-bold ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>

                </td>

                <td className="px-5 py-4 text-right font-bold">
                  {order.amount}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>
  );
}