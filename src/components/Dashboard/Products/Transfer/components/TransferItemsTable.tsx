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
        <div className="border border-slate-200 dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex h-56 items-center justify-center">
            <div className="text-center">
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No products added
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
      <div className="overflow-hidden border border-slate-200 dark:border-white/[0.08]">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-[#080B11]">
            <tr className="border-b border-slate-200 dark:border-white/[0.08]">
              <th className="w-14 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                #
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                SKU
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                Product
              </th>

              <th className="w-36 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                Available
              </th>

              <th className="w-44 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                Transfer Qty
              </th>

              <th className="w-24 px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {items.map((item, index) => (
              <tr
                key={item.sku}
                className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/[0.06] dark:hover:bg-white/[0.06]"
              >
                <td className="text-center text-sm text-slate-500 dark:text-slate-400">
                  {index + 1}
                </td>

                <td className="px-4 py-4 font-medium text-slate-900 dark:text-white font-mono">{item.sku}</td>

                <td className="px-4 py-4 text-slate-800 dark:text-slate-200">{item.product}</td>

                <td className="text-center font-semibold text-green-600 dark:text-emerald-400">
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
                    className="rounded-md p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/15 dark:text-red-400 cursor-pointer"
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
