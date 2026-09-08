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
import { Pencil, Trash2 } from "lucide-react";
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
    string | "sku" | "asin" | null
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

  const handleStartAdd = (focusKey: string | "sku" | "asin" = "sku") => {
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
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-[#FAFAFA] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-[#0F172A] text-white">
            <tr>
              {/* Dynamic Attributes FIRST */}
              {attributes.map((attribute) => (
                <th
                  key={attribute.id}
                  className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-200"
                >
                  {attribute.attributeName}
                </th>
              ))}

              {/* Variant SKU */}
              <th className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-200">
                Variant SKU
              </th>

              {/* ASIN RIGHT NEXT TO VARIANT SKU */}
              <th className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-200">
                ASIN
              </th>

              <th className="px-4 py-3 sm:px-6 sm:py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-200">
                Status
              </th>

              <th className="px-4 py-3 sm:px-6 sm:py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-200">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={attributes.length + 4}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  Loading variants...
                </td>
              </tr>
            ) : (
              data?.data?.map((variant) => (
                <tr
                  key={variant.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {/* Dynamic Attributes FIRST */}
                  {attributes.map((attribute) => {
                    const value = variant.attributes.find(
                      (a) => a.productAttributeId === attribute.id,
                    );

                    return (
                      <td
                        key={attribute.id}
                        className="px-6 py-4 align-middle text-sm text-slate-700"
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
                            className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
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
                  <td className="px-6 py-4 align-middle text-sm font-medium text-slate-700">
                    {editingId === variant.id ? (
                      <input
                        value={editSku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                      />
                    ) : (
                      variant.variantSku
                    )}
                  </td>

                  {/* ASIN RIGHT NEXT TO VARIANT SKU */}
                  <td className="px-6 py-4 align-middle text-sm text-slate-700">
                    {editingId === variant.id ? (
                      <input
                        value={editAsin}
                        onChange={(e) => setEditAsin(e.target.value)}
                        placeholder="ASIN"
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                      />
                    ) : (
                      <span className="font-mono text-slate-700">
                        {variant.asin || "--"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 align-middle text-center">
                    <div className="flex items-center justify-center">
                      {editingId === variant.id ? (
                        <Switch
                          checked={editStatus}
                          onCheckedChange={setEditStatus}
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            variant.isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle text-center">
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
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                              setEditingId(variant.id);
                              setEditSku(variant.variantSku);
                              setEditAsin(variant.asin || "");
                              setEditStatus(variant.isActive);

                              const values: Record<string, string> = {};

                              variant.attributes.forEach((attr) => {
                                values[attr.productAttributeId] =
                                  attr.attributeValue;
                              });

                              setEditAttributes(values);
                            }}
                          >
                            <Pencil size={16} />
                          </Button>

                          <Button
                            size="icon"
                            variant="primary"
                            onClick={() => {
                              setSelectedVariant(variant);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}

            <tr className="transition-colors hover:bg-slate-50/80">
              {/* Dynamic Attributes FIRST */}
              {attributes.map((attribute) => {
                const attrId = attribute.id ?? attribute.attributeName;
                const isFocused =
                  activeFocusKey === attrId || activeFocusKey === attribute.id;

                return (
                  <td
                    key={attrId}
                    className={`px-6 py-4 align-middle text-sm ${
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
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                      />
                    ) : (
                      <span className="text-slate-400 transition-colors hover:text-slate-600">
                        --
                      </span>
                    )}
                  </td>
                );
              })}

              {/* Variant SKU */}
              <td
                className={`px-6 py-4 align-middle text-sm ${
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
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                  />
                ) : (
                  <span className="font-medium text-slate-700 transition-colors hover:text-[#C89B3C]">
                    {variantSku || masterSku || "--"}
                  </span>
                )}
              </td>

              {/* ASIN RIGHT NEXT TO VARIANT SKU */}
              <td
                className={`px-6 py-4 align-middle text-sm ${
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
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                  />
                ) : (
                  <span className="font-mono text-slate-400 transition-colors hover:text-slate-600">
                    {asin || "--"}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4 align-middle text-center">
                <div className="flex items-center justify-center">
                  {editing ? (
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  ) : (
                    <span className="text-slate-400">--</span>
                  )}
                </div>
              </td>

              {/* Action */}
              <td className="px-6 py-4 align-middle text-center">
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
                          setIsSkuManuallyEdited(false);
                          setAttributeValues({});
                          setIsActive(true);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      fullWidth={false}
                      onClick={() =>
                        handleStartAdd(attributes[0]?.id ?? "sku")
                      }
                    >
                      Add Variant
                    </Button>
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
