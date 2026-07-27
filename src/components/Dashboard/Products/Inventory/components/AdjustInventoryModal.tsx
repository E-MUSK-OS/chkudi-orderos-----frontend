"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ReactSelect from "@/components/ui/ReactSelect";

import { adjustInventorySchema } from "../validations/inventory.validation";

import { useAdjustInventory } from "../hooks/useInventories";

import type { Inventory } from "../types/inventory.types";
import type { z } from "zod";

type FormValues = z.infer<typeof adjustInventorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
}

const adjustmentOptions = [
  {
    label: "Increase Stock",
    value: "IN",
  },
  {
    label: "Decrease Stock",
    value: "OUT",
  },
];

export default function AdjustInventoryModal({
  open,
  onOpenChange,
  inventory,
}: Props) {
  const { mutate, isPending } = useAdjustInventory();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(adjustInventorySchema),

    defaultValues: {
      quantity: 1,
      adjustmentType: "IN",
      reason: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!inventory) return;

    mutate(
      {
        id: inventory.id,
        payload: data,
      },
      {
        onSuccess: () => {
          reset();

          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();

        onOpenChange(false);
      }}
      title="Adjust Inventory"
      description="Increase or decrease available inventory."
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            onClick={() => {
              reset();

              onOpenChange(false);
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="adjust-inventory-form"
            loading={isPending}
            fullWidth={false}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form
        id="adjust-inventory-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        {/* Current Stock */}

        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <div>
            <p className="text-xs text-slate-500">Available Stock</p>

            <p className="text-lg font-semibold">
              {inventory?.availableStock ?? 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Reserved Stock</p>

            <p className="text-lg font-semibold">
              {inventory?.reservedStock ?? 0}
            </p>
          </div>
        </div>

        {/* Adjustment Type */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Adjustment Type
          </label>

          <Controller
            control={control}
            name="adjustmentType"
            render={({ field }) => (
              <ReactSelect
                options={adjustmentOptions}
                value={adjustmentOptions.find(
                  (item) => item.value === field.value,
                )}
                onChange={(option) => field.onChange(option?.value)}
              />
            )}
          />

          {errors.adjustmentType && (
            <p className="mt-1 text-sm text-red-500">
              {errors.adjustmentType.message}
            </p>
          )}
        </div>

        {/* Quantity */}

        <Input
          type="number"
          label="Quantity"
          min={1}
          {...register("quantity", {
            valueAsNumber: true,
          })}
          error={errors.quantity?.message}
        />

        {/* Reason */}

        <Input
          label="Reason"
          {...register("reason")}
          error={errors.reason?.message}
        />
      </form>
    </Modal>
  );
}
