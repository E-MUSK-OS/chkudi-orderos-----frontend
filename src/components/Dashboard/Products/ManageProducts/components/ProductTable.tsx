"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

import type { Product } from "../types/product.types";
import ProductStatusBadge from "./ProductStatusBadge";
import ProductActionMenu from "./ProductActionMenu";
import ProductVariantInline from "./ProductVariantInline";

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
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A]">
          No Products Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm">
          No product records matched your search or filter criteria. Try clearing your filters or adding a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
      <table className="w-full min-w-[950px] lg:min-w-[1100px] border-collapse text-left font-sans">
        <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
          <tr>
            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[220px]">
              Product Name
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[130px]">
              Master SKU
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[100px]">
              Brand
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[110px]">
              Category
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-left font-semibold whitespace-nowrap min-w-[110px]">
              Sub Category
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
              Status
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[100px]">
              Created
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Actions
            </th>

            <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Variants
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
          {products.map((product) => (
            <Fragment key={product.id}>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3 sm:px-4 py-3.5 align-middle max-w-[280px]">
                  <div>
                    <p className="font-bold text-[#0A0E1A] truncate" title={product.productName}>
                      {product.productName}
                    </p>

                    {product.description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] sm:text-xs text-slate-500">
                        {product.description}
                      </p>
                    )}

                    {(product.rackAddress || (product.mrp !== undefined && product.mrp !== null) || product.generateBarcode) && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-slate-500">
                        {product.rackAddress && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 border border-slate-200/60 font-mono">
                            Rack: <strong>{product.rackAddress}</strong>
                          </span>
                        )}
                        {product.mrp !== undefined && product.mrp !== null && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-[#B88728] border border-amber-200/60">
                            MRP: <strong>₹{product.mrp}</strong>
                          </span>
                        )}
                        {product.generateBarcode && (
                          <span className="inline-flex items-center gap-1">
                            Barcode:{" "}
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                product.generateBarcode.toLowerCase() === "yes"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {product.generateBarcode.toLowerCase() === "yes" ? "Yes" : "No"}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle whitespace-nowrap">
                  <span className="font-semibold text-slate-900 font-mono">
                    {product.masterSku}
                  </span>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle">
                  <span className="font-medium text-slate-800">{product.brand}</span>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle">
                  <span className="font-medium text-slate-800">{product.category}</span>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle">
                  <span className="font-medium text-slate-800">
                    {product.subCategory}
                  </span>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle text-center whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <ProductStatusBadge isActive={product.isActive} />
                  </div>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle text-center whitespace-nowrap text-slate-700 font-medium text-xs sm:text-sm">
                  {new Date(product.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle text-center">
                  <div className="flex items-center justify-center">
                    <ProductActionMenu
                      product={product}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                </td>

                <td className="px-3 sm:px-4 py-3.5 align-middle text-center">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onVariantToggle(product)}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title={expandedProductId === product.id ? "Collapse variants" : "Expand variants"}
                    >
                      {expandedProductId === product.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedProductId === product.id && (
                <tr>
                  <td
                    colSpan={9}
                    className="border-t border-[#E7E0D2] bg-slate-50/60 p-3 sm:p-5"
                  >
                    <ProductVariantInline
                      productId={product.id}
                      attributes={product.attributes}
                      masterSku={product.masterSku}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
