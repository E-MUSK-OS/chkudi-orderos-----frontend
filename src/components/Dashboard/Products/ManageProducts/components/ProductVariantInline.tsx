"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import type { ProductAttribute } from "../types/product.types";
import type { ProductVariant } from "../types/productVariant.types";
import {
  useCreateProductVariant,
  useDeleteProductVariant,
  useProductVariants,
  useUpdateProductVariant,
} from "../hooks/useProductVariants";
import { Pencil, Trash2, Plus } from "lucide-react";
import DeleteVariantModal from "./DeleteVariantModal";

interface Props {
  productId: string;
  attributes: ProductAttribute[];
  masterSku?: string;
}

export default function ProductVariantInline({
  productId,
  attributes,
  masterSku,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [variantSku, setVariantSku] = useState("");
  const [asin, setAsin] = useState("");
  const [rackAddress, setRackAddress] = useState("");
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string>
  >({});
  const [isActive, setIsActive] = useState(true);
  const { data, isLoading } = useProductVariants(productId);

  const createVariant = useCreateProductVariant();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSku, setEditSku] = useState("");
  const [editAsin, setEditAsin] = useState("");
  const [editRackAddress, setEditRackAddress] = useState("");
  const [editAttributes, setEditAttributes] = useState<Record<string, string>>(
    {},
  );
  const [editStatus, setEditStatus] = useState(true);
  const updateVariant = useUpdateProductVariant();
  const deleteVariant = useDeleteProductVariant();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  const [activeFocusKey, setActiveFocusKey] = useState<
    string | "sku" | "asin" | "rack" | null
  >(null);

  const handleAttributeChange = (attrId: string, value: string) => {
    const nextValues = {
      ...attributeValues,
      [attrId]: value,
    };
    setAttributeValues(nextValues);

    if (!isSkuManuallyEdited && masterSku) {
      const attrParts = attributes
        .map((attr) => nextValues[attr.id ?? ""]?.trim())
        .filter(Boolean);

      const autoSku =
        attrParts.length > 0
          ? `${masterSku}-${attrParts.join("-")}`
          : masterSku;
      setVariantSku(autoSku);
    }
  };

  const handleStartAdd = (focusKey: string | "sku" | "asin" | "rack" = "sku") => {
    setEditing(true);
    setActiveFocusKey(focusKey);
    if (!variantSku && masterSku) {
      setVariantSku(masterSku);
    }
  };

  const handleSave = async () => {
    const payload = {
      productId,
      variantSku,
      asin: asin.trim() || undefined,
      rackAddress: rackAddress.trim() || undefined,
      isActive,
      attributes: Object.entries(attributeValues).map(
        ([productAttributeId, attributeValue]) => ({
          productAttributeId,
          attributeValue,
        }),
      ),
    };

    await createVariant.mutateAsync(payload);

    setEditing(false);
    setActiveFocusKey(null);
    setVariantSku("");
    setAsin("");
    setRackAddress("");
    setIsSkuManuallyEdited(false);
    setAttributeValues({});
    setIsActive(true);
  };

  const handleUpdate = async (id: string) => {
    await updateVariant.mutateAsync({
      id,
      data: {
        productId,
        variantSku: editSku,
        asin: editAsin.trim() || undefined,
        rackAddress: editRackAddress.trim() || undefined,
        isActive: editStatus,
        attributes: Object.entries(editAttributes).map(
          ([productAttributeId, attributeValue]) => ({
            productAttributeId,
            attributeValue,
          }),
        ),
      },
    });

    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!selectedVariant) return;

    await deleteVariant.mutateAsync({
      id: selectedVariant.id,
      productId,
    });

    setDeleteOpen(false);
    setSelectedVariant(null);
  };

  useEffect(() => {
    console.log("Variants =>", data);
  }, [data]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] dark:bg-[#080B11] text-xs font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <tr>
              {/* Dynamic Attributes FIRST */}
              {attributes.map((attribute) => (
                <th
                  key={attribute.id}
                  className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap"
                >
                  {attribute.attributeName}
                </th>
              ))}

              {/* Variant SKU */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                Variant SKU
              </th>

              {/* ASIN RIGHT NEXT TO VARIANT SKU */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                ASIN
              </th>

              {/* RACK ADDRESS */}
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                Rack Address
              </th>

              <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                Status
              </th>

              <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
            {isLoading ? (
              <tr>
                <td
                  colSpan={attributes.length + 5}
                  className="py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Loading variants...
                </td>
              </tr>
            ) : (
              data?.data?.map((variant) => (
                <tr
                  key={variant.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                >
                  {/* Dynamic Attributes FIRST */}
                  {attributes.map((attribute) => {
                    const value = variant.attributes.find(
                      (a) => a.productAttributeId === attribute.id,
                    );

                    return (
                      <td
                        key={attribute.id}
                        className="px-3 sm:px-4 py-3 align-middle text-slate-700 dark:text-slate-200"
                      >
                        {editingId === variant.id ? (
                          <input
                            value={editAttributes[attribute.id ?? ""] || ""}
                            onChange={(e) =>
                              setEditAttributes((prev) => ({
                                ...prev,
                                [attribute.id ?? ""]: e.target.value,
                              }))
                            }
                            className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                          />
                        ) : (
                          <span className="font-normal">
                            {value?.attributeValue ?? "--"}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Variant SKU */}
                  <td className="px-3 sm:px-4 py-3 align-middle font-semibold text-slate-900 dark:text-white font-mono">
                    {editingId === variant.id ? (
                      <input
                        value={editSku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    ) : (
                      variant.variantSku
                    )}
                  </td>

                  {/* ASIN RIGHT NEXT TO VARIANT SKU */}
                  <td className="px-3 sm:px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                    {editingId === variant.id ? (
                      <input
                        value={editAsin}
                        onChange={(e) => setEditAsin(e.target.value)}
                        placeholder="ASIN"
                        className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    ) : (
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {variant.asin || "--"}
                      </span>
                    )}
                  </td>

                  {/* RACK ADDRESS */}
                  <td className="px-3 sm:px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                    {editingId === variant.id ? (
                      <input
                        value={editRackAddress}
                        onChange={(e) => setEditRackAddress(e.target.value)}
                        placeholder="Rack Address"
                        className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    ) : (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {variant.rackAddress || "--"}
                      </span>
                    )}
                  </td>

                  <td className="px-3 sm:px-4 py-3 align-middle text-center">
                    <div className="flex items-center justify-center">
                      {editingId === variant.id ? (
                        <Switch
                          checked={editStatus}
                          onCheckedChange={setEditStatus}
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            variant.isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 sm:px-4 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === variant.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(variant.id)}
                          >
                            Save
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(variant.id);
                              setEditSku(variant.variantSku);
                              setEditAsin(variant.asin || "");
                              setEditRackAddress(variant.rackAddress || "");
                              setEditStatus(variant.isActive);

                              const values: Record<string, string> = {};

                              variant.attributes.forEach((attr) => {
                                values[attr.productAttributeId] =
                                  attr.attributeValue;
                              });

                              setEditAttributes(values);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#E8C16D]/10 hover:text-[#B88728] dark:hover:text-[#F5C451] transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Edit variant"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setDeleteOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Delete variant"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}

            <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06]">
              {/* Dynamic Attributes FIRST */}
              {attributes.map((attribute) => {
                const attrId = attribute.id ?? attribute.attributeName;
                const isFocused =
                  activeFocusKey === attrId || activeFocusKey === attribute.id;

                return (
                  <td
                    key={attrId}
                    className={`px-3 sm:px-4 py-3 align-middle text-xs sm:text-sm ${
                      !editing ? "cursor-pointer" : ""
                    }`}
                    onClick={!editing ? () => handleStartAdd(attrId) : undefined}
                  >
                    {editing ? (
                      <input
                        autoFocus={isFocused}
                        value={attributeValues[attribute.id ?? ""] || ""}
                        onChange={(e) =>
                          handleAttributeChange(
                            attribute.id ?? "",
                            e.target.value,
                          )
                        }
                        placeholder={attribute.attributeName}
                        className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                        --
                      </span>
                    )}
                  </td>
                );
              })}

              {/* Variant SKU */}
              <td
                className={`px-3 sm:px-4 py-3 align-middle text-xs sm:text-sm ${
                  !editing ? "cursor-pointer" : ""
                }`}
                onClick={!editing ? () => handleStartAdd("sku") : undefined}
              >
                {editing ? (
                  <input
                    autoFocus={
                      activeFocusKey === "sku" ||
                      (!activeFocusKey && attributes.length === 0)
                    }
                    value={variantSku}
                    onChange={(e) => {
                      setIsSkuManuallyEdited(true);
                      setVariantSku(e.target.value);
                    }}
                    placeholder="Variant SKU"
                    className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                ) : (
                  <span className="font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:text-[#B88728] dark:hover:text-[#F5C451] font-mono">
                    {variantSku || masterSku || "--"}
                  </span>
                )}
              </td>

              {/* ASIN RIGHT NEXT TO VARIANT SKU */}
              <td
                className={`px-3 sm:px-4 py-3 align-middle text-xs sm:text-sm ${
                  !editing ? "cursor-pointer" : ""
                }`}
                onClick={!editing ? () => handleStartAdd("asin") : undefined}
              >
                {editing ? (
                  <input
                    autoFocus={activeFocusKey === "asin"}
                    value={asin}
                    onChange={(e) => setAsin(e.target.value)}
                    placeholder="ASIN"
                    className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                ) : (
                  <span className="font-mono text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    {asin || "--"}
                  </span>
                )}
              </td>

              {/* RACK ADDRESS */}
              <td
                className={`px-3 sm:px-4 py-3 align-middle text-xs sm:text-sm ${
                  !editing ? "cursor-pointer" : ""
                }`}
                onClick={!editing ? () => handleStartAdd("rack") : undefined}
              >
                {editing ? (
                  <input
                    autoFocus={activeFocusKey === "rack"}
                    value={rackAddress}
                    onChange={(e) => setRackAddress(e.target.value)}
                    placeholder="Rack Address"
                    className="w-full border-0 border-b border-slate-300 dark:border-white/20 bg-transparent px-0 py-1 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                ) : (
                  <span className="font-medium text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    {rackAddress || "--"}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-3 sm:px-4 py-3 align-middle text-center">
                <div className="flex items-center justify-center">
                  {editing ? (
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">--</span>
                  )}
                </div>
              </td>

              {/* Action */}
              <td className="px-3 sm:px-4 py-3 align-middle text-center">
                <div className="flex items-center justify-center gap-2">
                  {editing ? (
                    <>
                      <Button
                        size="sm"
                        fullWidth={false}
                        onClick={handleSave}
                        disabled={createVariant.isPending}
                      >
                        {createVariant.isPending ? "Saving..." : "Save"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        onClick={() => {
                          setEditing(false);
                          setActiveFocusKey(null);
                          setVariantSku("");
                          setAsin("");
                          setRackAddress("");
                          setIsSkuManuallyEdited(false);
                          setAttributeValues({});
                          setIsActive(true);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleStartAdd(attributes[0]?.id ?? "sku")
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#E8C16D]/10 px-3.5 py-1.5 sm:py-2 text-xs font-bold text-[#0A0E1A] dark:text-[#F5C451] hover:bg-[#FFF3D6] dark:hover:bg-[#E8C16D]/20 ring-1 ring-[#E8C16D]/30 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Add Variant</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <DeleteVariantModal
        open={deleteOpen}
        variant={selectedVariant}
        loading={deleteVariant.isPending}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedVariant(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
