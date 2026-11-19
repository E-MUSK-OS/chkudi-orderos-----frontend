"use client";

import { useEffect, useState } from "react";
import { Tag, MapPin, Pencil, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { FlipcartImportItem } from "../types/flipcartImport.types";
import { useCreateFlipcartImport, useUpdateFlipcartImport } from "../hooks/useFlipcartImports";

interface Props {
  open: boolean;
  item: FlipcartImportItem | null;
  onClose: () => void;
}

export default function FlipcartModal({ open, item, onClose }: Props) {
  const createMutation = useCreateFlipcartImport();
  const updateMutation = useUpdateFlipcartImport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [fsn, setFsn] = useState("");
  const [sku, setSku] = useState("");
  const [rackAddress, setRackAddress] = useState("");

  useEffect(() => {
    if (open) {
      if (item) {
        setFsn(item.fsn || "");
        setSku(item.sku || "");
        setRackAddress(item.rackAddress || "");
      } else {
        setFsn("");
        setSku("");
        setRackAddress("");
      }
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (item) {
        await updateMutation.mutateAsync({
          id: item.id,
          data: {
            fsn: fsn.trim(),
            sku: sku.trim(),
            rackAddress: rackAddress.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          fsn: fsn.trim(),
          sku: sku.trim(),
          rackAddress: rackAddress.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 w-full">
      <Button
        variant="secondary"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        onClick={onClose}
        disabled={isPending}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        form="flipcart-form"
        fullWidth={false}
        className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        disabled={isPending}
      >
        {isPending
          ? item
            ? "Updating..."
            : "Saving..."
          : item
            ? "Update Flipcart Record"
            : "Save Flipcart Record"}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      showHeader={false}
      footer={footer}
    >
      {/* Header */}
      <div className="-mx-3.5 sm:-mx-6 -mt-3.5 sm:-mt-6 border-b border-[#E7EAF0] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] px-4 sm:px-6 py-3.5 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#0A0E1A] dark:bg-[#131926] text-[#E8C16D] dark:text-[#F5C451]">
            {item ? (
              <Pencil size={20} className="sm:w-[22px] sm:h-[22px]" />
            ) : (
              <Plus size={20} className="sm:w-[22px] sm:h-[22px]" />
            )}
          </div>

          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
              {item ? "Edit Flipcart Record" : "Add Flipcart Record"}
            </h2>

            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {item
                ? "Update FSN code, SKU, and rack address information."
                : "Create a new Flipcart FSN-to-SKU mapping record."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        id="flipcart-form"
        onSubmit={handleSubmit}
        className="px-0.5 sm:px-2 py-4 sm:py-6 space-y-4"
      >
        <Input
          label="FSN Code"
          value={fsn}
          onChange={(e) => setFsn(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter FSN Code"
          required
        />

        <Input
          label="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter SKU"
          required
        />

        <Input
          label="Rack Address"
          value={rackAddress}
          onChange={(e) => setRackAddress(e.target.value)}
          leftIcon={<MapPin size={18} />}
          placeholder="Enter Rack Address"
        />
      </form>
    </Modal>
  );
}
