"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { Order } from "../types";

interface Props {
  orders: Order[];
  selectedRows: number[];
  onSelectionChange: (rows: number[]) => void;
}

const OrderTable = ({ orders, selectedRows, onSelectionChange }: Props) => {
  //   const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const allSelected =
    orders.length > 0 && selectedRows.length === orders.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map((order) => order.id));
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  return (
    <div className="overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0A0E1A] text-lg text-[#E8C16D]">
            <tr className="border-b border-border">
              <th className="w-14 px-4 py-4 text-left">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>

              <th className="px-4 py-4 text-left font-semibold">Order ID</th>

              <th className="px-4 py-4 text-left font-semibold">Ordered On</th>

              <th className="px-4 py-4 text-center font-semibold">On Hold</th>

              <th className="px-4 py-4 text-center font-semibold">Quantity</th>

              <th className="px-4 py-4 text-center font-semibold">
                Process Start Time
              </th>

              <th className="px-4 py-4 text-center font-semibold">Store</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border transition hover:bg-muted/30"
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedRows.includes(order.id)}
                    onCheckedChange={() => toggleRow(order.id)}
                  />
                </td>

                <td className="px-4 py-4 font-medium">{order.orderId}</td>

                <td className="px-4 py-4">{order.orderedOn}</td>

                <td className="px-4 py-4 text-center">
                  {order.onHold ? (
                    <span className=" bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                      Yes
                    </span>
                  ) : (
                    <span className=" bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                      No
                    </span>
                  )}
                </td>

                <td className="px-4 py-4 text-center">{order.quantity}</td>

                <td className="px-4 py-4 text-center">
                  {order.processStartTime}
                </td>

                <td className="px-4 py-4 text-center">
                  <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-500">
                    {order.store}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
