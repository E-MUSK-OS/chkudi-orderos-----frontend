"use client";

import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type FieldArrayWithId,
  useWatch,
} from "react-hook-form";
import { Plus, Trash2, Tags } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

import SectionCard from "./SectionCard";
import DeleteAttributeConfirmModal from "./DeleteAttributeConfirmModal";

import type { ProductFormValues } from "../validations/product.validation";

interface Props {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  fields: FieldArrayWithId<ProductFormValues, "attributes", "id">[];
  append: UseFieldArrayAppend<ProductFormValues, "attributes">;
  remove: UseFieldArrayRemove;
}

export default function ProductAttributes({
  control,
  errors,
  fields,
  append,
  remove,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    name: string;
  } | null>(null);

  const attributesValues = useWatch({
    control,
    name: "attributes",
  });
  return (
    <SectionCard
      icon={<Tags size={20} />}
      title="Product Attributes"
      description="Define the attributes and initial values for this product."
    >
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_56px] items-start gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05]"
          >
            {/* Attribute Name */}
            <div className="w-full min-w-0">
              <Controller
                control={control}
                name={`attributes.${index}.attributeName`}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    label={`Attribute ${index + 1}`}
                    placeholder={
                      index === 0
                        ? "e.g. Colour"
                        : index === 1
                          ? "e.g. Size"
                          : "e.g. Material"
                    }
                    error={errors.attributes?.[index]?.attributeName?.message}
                  />
                )}
              />
            </div>

            {/* Attribute Value */}
            <div className="w-full min-w-0">
              <Controller
                control={control}
                name={`attributes.${index}.attributeValue`}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    label={`Value ${index + 1}`}
                    placeholder={
                      index === 0
                        ? "e.g. Black"
                        : index === 1
                          ? "e.g. XL"
                          : "e.g. Cotton"
                    }
                    error={errors.attributes?.[index]?.attributeValue?.message}
                  />
                )}
              />
            </div>

            {/* Delete Button */}
            <div className="flex items-center justify-end sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  const currentName =
                    attributesValues?.[index]?.attributeName?.trim() ||
                    `Attribute ${index + 1}`;
                  setDeleteTarget({ index, name: currentName });
                }}
                title="Remove attribute"
                className="h-14 w-full sm:w-14 flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/60 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-5 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
          onClick={() =>
            append({
              attributeName: "",
              attributeValue: "",
            })
          }
        >
          <Plus size={16} />
          Add Attribute
        </Button>
      </div>

      <DeleteAttributeConfirmModal
        open={deleteTarget !== null}
        attributeName={deleteTarget?.name || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget !== null) {
            remove(deleteTarget.index);
            setDeleteTarget(null);
          }
        }}
      />
    </SectionCard>
  );
}
