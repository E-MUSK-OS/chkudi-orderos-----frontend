"use client";

import { Pencil, Trash2, RefreshCcw } from "lucide-react";
import { Fragment } from "react";

import type { Product } from "../types/product.types";
import ProductStatusBadge from "./ProductStatusBadge";
import ProductActionMenu from "./ProductActionMenu";
import ProductVariantInline from "./ProductVariantInline";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  products: Product[];

  onEdit: (product: Product) => void;

  onDelete: (product: Product) => void;

  onStatusChange: (product: Product) => void;

  expandedProductId: string | null;

  onVariantToggle: (product: Product) => void;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onStatusChange,
  expandedProductId,
  onVariantToggle,
}: Props) {
  return (
    <div className="border border-[#E7EAF0] bg-white shadow-sm">
      <div className="">
        <table className="min-w-full">
          <thead className="bg-[#0A0E1A]">
            <tr>
              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Product Name
              </th>

              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Master SKU
              </th>

              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Brand
              </th>

              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Category
              </th>

              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Sub Category
              </th>

              <th className="px-6 py-4 text-center text-md font-semibold uppercase tracking-wider text-white">
                Status
              </th>

              <th className="px-6 py-4 text-left text-md font-semibold uppercase tracking-wider text-white">
                Created
              </th>

              <th className="px-6 py-4 text-center text-md font-semibold uppercase tracking-wider text-white">
                Actions
              </th>

              <th className="px-6 py-4 text-center text-md font-semibold uppercase tracking-wider text-white">
                Variants
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product, index) => (
              <Fragment key={product.id}>
                <tr
                  key={product.id}
                  className={`transition-colors hover:bg-slate-50 ${
                    index !== products.length - 1
                      ? "border-b border-[#E7EAF0]"
                      : ""
                  }`}
                >
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-semibold text-[#0A0E1A]">
                        {product.productName}
                      </p>

                      {product.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-medium text-slate-700">
                      {product.masterSku}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-slate-700">{product.brand}</span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-slate-700">{product.category}</span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-slate-700">
                      {product.subCategory}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <ProductStatusBadge isActive={product.isActive} />
                  </td>

                  <td className="px-6 py-5 text-slate-700">
                    {new Date(product.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <ProductActionMenu
                        product={product}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onVariantToggle(product)}
                      className="flex h-8 w-8 items-center justify-center border border-slate-200 transition-colors hover:bg-slate-100 cursor-pointer"
                    >
                      {expandedProductId === product.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedProductId === product.id && (
                  <tr>
                    <td
                      colSpan={9}
                      className="border-t border-[#E7EAF0] bg-slate-50 p-0"
                    >
                      <div className="p-5">
                        <ProductVariantInline
                          productId={product.id}
                          attributes={product.attributes}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
