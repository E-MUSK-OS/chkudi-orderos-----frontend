"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  available: number;
}

const dummyProducts: Product[] = [
  {
    id: "1",
    sku: "SKU-101",
    name: "iPhone 16 Pro 256GB",
    available: 45,
  },
  {
    id: "2",
    sku: "SKU-102",
    name: "AirPods Pro 2",
    available: 18,
  },
  {
    id: "3",
    sku: "SKU-103",
    name: "Samsung Galaxy S25",
    available: 62,
  },
  {
    id: "4",
    sku: "SKU-104",
    name: "Apple Watch Ultra",
    available: 9,
  },
];

export default function ProductSearchModal({
  open,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const filteredProducts = dummyProducts.filter(
    (product) =>
      product.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      product.sku
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Products"
      size="4xl"
    >
      <div className="space-y-5 p-6">
        {/* Search */}

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            placeholder="Search Product / SKU..."
            className="pl-10"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        {/* Table */}

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08]">
          <table className="w-full">
            <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11]">
              <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08]">
                <th className="w-16 py-3"></th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#6A4D1D] dark:text-slate-400">
                  SKU
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#6A4D1D] dark:text-slate-400">
                  Product
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#6A4D1D] dark:text-slate-400">
                  Available
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredProducts.map((product) => {
                const selected =
                  selectedProducts.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    onClick={() =>
                      toggleProduct(product.id)
                    }
                    className={`cursor-pointer border-t border-slate-100 dark:border-white/[0.06] transition hover:bg-slate-50 dark:hover:bg-white/[0.06] ${
                      selected
                        ? "bg-amber-50 dark:bg-[#F5C451]/10"
                        : ""
                    }`}
                  >
                    <td className="text-center">
                      <div
                        className={`
                        mx-auto
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                        rounded
                        border
                        ${
                          selected
                            ? "border-amber-500 bg-amber-500 text-white dark:border-[#F5C451] dark:bg-[#F5C451] dark:text-black"
                            : "border-slate-300 dark:border-white/20"
                        }
                      `}
                      >
                        {selected && (
                          <Check size={14} />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-white font-mono">
                      {product.sku}
                    </td>

                    <td className="px-4 py-4 text-slate-800 dark:text-slate-200">
                      {product.name}
                    </td>

                    <td className="text-center font-semibold text-green-600 dark:text-emerald-400">
                      {product.available}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selected : {selectedProducts.length}
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              fullWidth={false}
              className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              fullWidth={false}
              className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
            >
              Add Selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}