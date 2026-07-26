"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type FieldArrayWithId,
} from "react-hook-form";
import { Plus, Trash2, Tags } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import SectionCard from "./SectionCard";

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
  return (
    <SectionCard
      icon={<Tags size={20} />}
      title="Product Attributes"
      description="Define the attributes that will be used while creating variants."
    >
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-3">
            <div className="flex-1">
              <Controller
                control={control}
                name={`attributes.${index}.attributeName`}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={`Attribute ${index + 1}`}
                    // placeholder="Color / Size / Storage"
                    error={errors.attributes?.[index]?.attributeName?.message}
                  />
                )}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => remove(index)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          onClick={() =>
            append({
              attributeName: "",
            })
          }
        >
          <Plus size={16} />
          Add Attribute
        </Button>
      </div>
    </SectionCard>
  );
}
