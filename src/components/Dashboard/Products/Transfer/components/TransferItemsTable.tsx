"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import ProductSearchModal from "./ProductSearch";
import QuantityInput from "./QuantityInput";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { TransferItem } from "../types/transfer.types";

// export interface TransferItem {
//   sku: string;
//   product: string;
//   available: number;
//   qty: number;
// }

interface Props {
  items: TransferItem[];

  setItems: React.Dispatch<React.SetStateAction<TransferItem[]>>;
}

export default function TransferItemsTable({ items, setItems }: Props) {
  //   const [searchOpen, setSearchOpen] = useState(false);
  //   const [searchSku, setSearchSku] = useState("");

  //   const [items, setItems] = useState<TransferItem[]>([
  //     {
  //       sku: "ABC-101",
  //       product: "iPhone 16 Pro",
  //       available: 45,
  //       qty: 5,
  //     },
  //     {
  //       sku: "XYZ-202",
  //       product: "AirPods Pro",
  //       available: 18,
  //       qty: 2,
  //     },
  //   ]);

  const handleQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              qty,
            }
          : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (items.length === 0) {
    return (
      <>
        <div className="border border-slate-200">
          <div className="flex h-56 items-center justify-center">
            <div className="text-center">
              <p className="text-base font-semibold text-slate-700">
                No products added
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Click "Add Product" to add products.
              </p>
            </div>
          </div>
        </div>

        {/* <ProductSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
        /> */}
      </>
    );
  }

  return (
    <>
      <div className="overflow-hidden border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="border-b">
              <th className="w-14 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                #
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                SKU
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                Product
              </th>

              <th className="w-36 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Available
              </th>

              <th className="w-44 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Transfer Qty
              </th>

              <th className="w-24 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.sku}
                className="border-b transition hover:bg-slate-50"
              >
                <td className="text-center text-sm text-slate-500">
                  {index + 1}
                </td>

                <td className="px-4 py-4 font-medium">{item.sku}</td>

                <td className="px-4 py-4">{item.product}</td>

                <td className="text-center font-semibold text-green-600">
                  {item.available}
                </td>

                <td className="text-center">
                  <QuantityInput
                    value={item.qty}
                    max={item.available}
                    onChange={(qty) => handleQtyChange(index, qty)}
                  />
                </td>

                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-md p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* <ProductSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      /> */}
    </>
  );
}
