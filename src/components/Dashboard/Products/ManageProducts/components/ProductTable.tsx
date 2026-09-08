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
    <div className="w-full overflow-hidden rounded-lg border border-[#E7EAF0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Product Name
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Master SKU
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Brand
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Category
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-xs font-semibold uppercase tracking-wider text-white">
                Sub Category
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center text-xs font-semibold uppercase tracking-wider text-white">
                Status
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">
                Created
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center text-xs font-semibold uppercase tracking-wider text-white">
                Actions
              </th>

              <th className="px-5 py-3.5 sm:px-6 sm:py-4 text-center text-xs font-semibold uppercase tracking-wider text-white">
                Variants
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7EAF0]">
            {products.map((product) => (
              <Fragment key={product.id}>
                <tr className="transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <div>
                      <p className="font-semibold text-[#0A0E1A]">
                        {product.productName}
                      </p>

                      {product.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          {product.description}
                        </p>
                      )}

                      {(product.rackAddress || (product.mrp !== undefined && product.mrp !== null)) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          {product.rackAddress && (
                            <span>
                              Rack: <strong className="font-medium text-slate-700">{product.rackAddress}</strong>
                            </span>
                          )}
                          {product.mrp !== undefined && product.mrp !== null && (
                            <span>
                              MRP: <strong className="font-medium text-slate-700">₹{product.mrp}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="font-medium text-slate-700">
                      {product.masterSku}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="text-slate-700">{product.brand}</span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="text-slate-700">{product.category}</span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle">
                    <span className="text-slate-700">
                      {product.subCategory}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-center">
                    <div className="flex items-center justify-center">
                      <ProductStatusBadge isActive={product.isActive} />
                    </div>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-slate-700">
                    {new Date(product.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-center">
                    <div className="flex items-center justify-center">
                      <ProductActionMenu
                        product={product}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4 sm:px-6 sm:py-5 align-middle text-center">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onVariantToggle(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#C89B3C] hover:text-[#C89B3C] cursor-pointer"
                      >
                        {expandedProductId === product.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedProductId === product.id && (
                  <tr>
                    <td
                      colSpan={9}
                      className="border-t border-[#E7EAF0] bg-slate-50/70 p-0"
                    >
                      <div className="p-3 sm:p-5">
                        <ProductVariantInline
                          productId={product.id}
                          attributes={product.attributes}
                          masterSku={product.masterSku}
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
