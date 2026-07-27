"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useUpdateInventory } from "../hooks/useInventories";
import { updateInventorySchema } from "../validations/inventory.validation";

import type { Inventory } from "../types/inventory.types";
import type { z } from "zod";

type FormValues = z.infer<typeof updateInventorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
}

const InventoryModal = ({
  open,
  onOpenChange,
  inventory,
}: Props) => {
  const { mutate, isPending } = useUpdateInventory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateInventorySchema),
    defaultValues: {
      reorderLevel: 0,
    },
  });

  useEffect(() => {
    if (inventory) {
      reset({
        reorderLevel: inventory.reorderLevel,
      });
    }
  }, [inventory, reset]);

  const onSubmit = (data: FormValues) => {
    if (!inventory) return;

    mutate(
      {
        id: inventory.id,
        payload: data,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Update Reorder Level"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Reorder Level
          </label>

          <Input
            type="number"
            min={0}
            placeholder="Enter reorder level"
            {...register("reorderLevel", {
              valueAsNumber: true,
            })}
          />

          {errors.reorderLevel && (
            <p className="mt-1 text-sm text-red-500">
              {errors.reorderLevel.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InventoryModal;