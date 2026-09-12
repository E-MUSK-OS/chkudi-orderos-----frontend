"use client";

import { useEffect, useState } from "react";
import { Barcode, Tag, MapPin, Pencil, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { AsinImportItem } from "../types/asinImport.types";
import { useCreateAsinImport, useUpdateAsinImport } from "../hooks/useAsinImports";

interface Props {
  open: boolean;
  item: AsinImportItem | null;
  onClose: () => void;
}

export default function AsinModal({ open, item, onClose }: Props) {
  const createMutation = useCreateAsinImport();
  const updateMutation = useUpdateAsinImport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [asin, setAsin] = useState("");
  const [sku, setSku] = useState("");
  const [generateBarcode, setGenerateBarcode] = useState("");
  const [rackAddress, setRackAddress] = useState("");

  useEffect(() => {
    if (open) {
      if (item) {
        setAsin(item.asin || "");
        setSku(item.sku || "");
        setGenerateBarcode(item.generateBarcode || "");
        setRackAddress(item.rackAddress || "");
      } else {
        setAsin("");
        setSku("");
        setGenerateBarcode("");
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
            asin: asin.trim(),
            sku: sku.trim(),
            generateBarcode: generateBarcode.trim() || undefined,
            rackAddress: rackAddress.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          asin: asin.trim(),
          sku: sku.trim(),
          generateBarcode: generateBarcode.trim() || undefined,
          rackAddress: rackAddress.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="secondary"
        fullWidth={false}
        onClick={onClose}
        disabled={isPending}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        form="asin-form"
        fullWidth={false}
        disabled={isPending}
      >
        {isPending
          ? item
            ? "Updating..."
            : "Saving..."
          : item
            ? "Update ASIN Record"
            : "Save ASIN Record"}
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
      <div className="border-b border-[#E7EAF0] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A0E1A] text-[#E8C16D]">
            {item ? <Pencil size={22} /> : <Plus size={22} />}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#0A0E1A]">
              {item ? "Edit ASIN Record" : "Add ASIN Record"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {item
                ? "Update ASIN code, SKU, barcode, and rack address information."
                : "Create a new ASIN-to-SKU mapping record."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="asin-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="ASIN"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter ASIN"
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
          label="Generate Barcode"
          value={generateBarcode}
          onChange={(e) => setGenerateBarcode(e.target.value)}
          leftIcon={<Barcode size={18} />}
          placeholder="Enter Generate Barcode"
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
