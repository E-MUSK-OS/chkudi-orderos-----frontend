"use client";

import { useEffect, useState } from "react";
import { Fragment } from "react";

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
}

export default function ProductVariantInline({ productId, attributes }: Props) {
  const [editing, setEditing] = useState(false);

  const [variantSku, setVariantSku] = useState("");
  const [attributeValues, setAttributeValues] = useState<
    Record<string, string>
  >({});
  const [isActive, setIsActive] = useState(true);
  const { data, isLoading } = useProductVariants(productId);

  const createVariant = useCreateProductVariant();

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editSku, setEditSku] = useState("");
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

  const handleSave = async () => {
    const payload = {
      productId,

      variantSku,

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

    setVariantSku("");

    setAttributeValues({});

    setIsActive(true);
  };

  const handleUpdate = async (id: string) => {
    await updateVariant.mutateAsync({
      id,
      data: {
        productId,
        variantSku: editSku,
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

  // const handleDelete = async (id: string) => {
  //   if (!confirm("Delete this variant?")) return;

  //   await deleteVariant.mutateAsync({
  //     id,
  //     productId,
  //   });
  // };

  useEffect(() => {
    console.log("Variants =>", data);
  }, [data]);

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <table className="min-w-full">
        <thead className="border-b bg-[#0F172A] text-white">
          <tr>
            <th className="px-5 py-3 text-left text-md uppercase tracking-wider">
              Variant SKU
            </th>

            {attributes.map((attribute) => (
              <th
                key={attribute.id}
                className="px-5 py-3 text-left text-md uppercase tracking-wider"
              >
                {attribute.attributeName}
              </th>
            ))}

            <th className="px-5 py-3 text-center text-md uppercase tracking-wider">
              Status
            </th>

            <th className="px-5 py-3 text-center text-md uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={attributes.length + 3}
                className="py-4 text-center text-slate-500"
              >
                Loading...
              </td>
            </tr>
          ) : (
            data?.data?.map((variant) => (
              <tr
                key={variant.id}
                className="border-b transition-colors hover:bg-slate-50"
              >
                {/* <td className="px-5 py-4">{variant.variantSku}</td> */}
                <td className="px-5 py-4">
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

                {attributes.map((attribute) => {
                  const value = variant.attributes.find(
                    (a) => a.productAttributeId === attribute.id,
                  );

                  return (
                    // <td key={attribute.id} className="px-5 py-4">
                    //   {value?.attributeValue ?? "--"}
                    // </td>
                    <td key={attribute.id} className="px-5 py-4">
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
                        (value?.attributeValue ?? "--")
                      )}
                    </td>
                  );
                })}

                {/* <td className="px-5 py-4 text-center">
                  {variant.isActive ? "Active" : "Inactive"}
                </td> */}
                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    {editingId === variant.id ? (
                      <Switch
                        checked={editStatus}
                        onCheckedChange={setEditStatus}
                      />
                    ) : (
                      <span>{variant.isActive ? "Active" : "Inactive"}</span>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
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

          <tr className="transition-colors hover:bg-slate-50">
            {/* Variant SKU */}
            <td
              className="cursor-pointer px-5 py-4"
              onClick={() => setEditing(true)}
            >
              {editing ? (
                <input
                  autoFocus
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  placeholder="Variant SKU"
                  className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                />
              ) : (
                <span className="text-slate-400 transition-colors hover:text-[#C89B3C]">
                  --
                </span>
              )}
            </td>

            {/* Dynamic Attributes */}
            {attributes.map((attribute) => (
              <td
                key={attribute.id ?? attribute.attributeName}
                className="px-5 py-4"
              >
                {editing ? (
                  <input
                    value={attributeValues[attribute.id ?? ""] || ""}
                    onChange={(e) =>
                      setAttributeValues((prev) => ({
                        ...prev,
                        [attribute.id ?? ""]: e.target.value,
                      }))
                    }
                    placeholder={attribute.attributeName}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none focus:border-[#C89B3C]"
                  />
                ) : (
                  <span className="text-slate-400">--</span>
                )}
              </td>
            ))}

            {/* Status */}
            <td className="px-5 py-4">
              <div className="flex justify-center">
                {editing ? (
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                ) : (
                  <span className="text-slate-400">--</span>
                )}
              </div>
            </td>

            {/* Action */}
            <td className="px-5 py-4">
              <div className="flex justify-center gap-2">
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
                        setVariantSku("");
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
                    onClick={() => setEditing(true)}
                  >
                    Add Variant
                  </Button>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
