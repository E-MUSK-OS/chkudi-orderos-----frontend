"use client";

import { useEffect, useState } from "react";
import { Barcode, Tag, MapPin, Pencil, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { MyntraImportItem } from "../types/myntraImport.types";
import {
  useCreateMyntraImport,
  useUpdateMyntraImport,
} from "../hooks/useMyntraImports";

interface Props {
  open: boolean;
  item: MyntraImportItem | null;
  onClose: () => void;
}

export default function MyntraModal({ open, item, onClose }: Props) {
  const createMutation = useCreateMyntraImport();
  const updateMutation = useUpdateMyntraImport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [myntraSku, setMyntraSku] = useState("");
  const [sellerSku, setSellerSku] = useState("");
  const [asin, setAsin] = useState("");
  const [generatedBarcode, setGeneratedBarcode] = useState("");
  const [rackAddress, setRackAddress] = useState("");

  useEffect(() => {
    if (open) {
      if (item) {
        setMyntraSku(item.myntraSku || "");
        setSellerSku(item.sellerSku || "");
        setAsin(item.asin || "");
        setGeneratedBarcode(item.generatedBarcode || "");
        setRackAddress(item.rackAddress || "");
      } else {
        setMyntraSku("");
        setSellerSku("");
        setAsin("");
        setGeneratedBarcode("");
        setRackAddress("");
      }
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!myntraSku.trim()) {
      return;
    }

    try {
      if (item) {
        await updateMutation.mutateAsync({
          id: item.id,
          data: {
            myntraSku: myntraSku.trim(),
            sellerSku: sellerSku.trim() || undefined,
            asin: asin.trim() || undefined,
            generatedBarcode: generatedBarcode.trim() || undefined,
            rackAddress: rackAddress.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          myntraSku: myntraSku.trim(),
          sellerSku: sellerSku.trim() || undefined,
          asin: asin.trim() || undefined,
          generatedBarcode: generatedBarcode.trim() || undefined,
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
        form="myntra-form"
        fullWidth={false}
        disabled={isPending}
      >
        {isPending
          ? item
            ? "Updating..."
            : "Saving..."
          : item
            ? "Update Myntra Record"
            : "Save Myntra Record"}
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
              {item ? "Edit Myntra Record" : "Add Myntra Record"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {item
                ? "Update Myntra SKU, Seller SKU, barcode, and rack address information."
                : "Create a new Myntra SKU mapping record manually."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="myntra-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Myntra SKU"
          value={myntraSku}
          onChange={(e) => setMyntraSku(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter Myntra SKU (e.g. MYN-TSHIRT-BLK-M)"
          required
        />

        <Input
          label="Seller SKU"
          value={sellerSku}
          onChange={(e) => setSellerSku(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter Seller SKU (e.g. TS-BLK-M)"
        />

        <Input
          label="Rack Address"
          value={rackAddress}
          onChange={(e) => setRackAddress(e.target.value)}
          leftIcon={<MapPin size={18} />}
          placeholder="Enter Rack Address (e.g. A-01-02)"
        />

        <Input
          label="ASIN"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          leftIcon={<Tag size={18} />}
          placeholder="Enter ASIN (optional)"
        />

        <Input
          label="Generated Barcode"
          value={generatedBarcode}
          onChange={(e) => setGeneratedBarcode(e.target.value)}
          leftIcon={<Barcode size={18} />}
          placeholder="Enter Generated Barcode (optional)"
        />
      </form>
    </Modal>
  );
}
