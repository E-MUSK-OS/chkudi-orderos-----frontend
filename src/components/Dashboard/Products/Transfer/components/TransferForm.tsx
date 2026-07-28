"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import ReactSelect from "@/components/ui/ReactSelect";

import TransferItemsTable from "./TransferItemsTable";

import type { TransferItem } from "../types/transfer.types";
import Input from "@/components/ui/Input";
import { useSearchInventory } from "@/components/Dashboard/Products/Inventory/hooks/useInventories";
import { toast } from "sonner";
import { useWarehouses } from "@/components/Dashboard/Warehouse/hooks/useWarehouse";

import type { SelectOption } from "@/components/ui/ReactSelect";
import { Inventory } from "../../Inventory/types/inventory.types";
import { useCreateTransfer } from "../hooks/useTransfer";

interface Props {
  onClose: () => void;
}

export default function TransferForm({ onClose }: Props) {
  const [searchSku, setSearchSku] = useState("");
  const searchInventory = useSearchInventory();

  const [items, setItems] = useState<TransferItem[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState("");

  const [toWarehouseId, setToWarehouseId] = useState("");

  const [notes, setNotes] = useState("");
  const { data: warehouseResponse } = useWarehouses();
  const warehouseOptions: SelectOption[] =
    warehouseResponse?.data?.map((warehouse) => ({
      label: warehouse.warehouseName,
      value: warehouse.id,
    })) ?? [];

  const [searchResults, setSearchResults] = useState<Inventory[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const createTransfer = useCreateTransfer();

  const addInventoryItem = (inventory: Inventory) => {
    const exists = items.some(
      (item) => item.productVariantId === inventory.productVariant.id,
    );

    if (exists) {
      toast.error("Product already added.");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        inventoryId: inventory.id,
        productVariantId: inventory.productVariant.id,
        sku: inventory.productVariant.variantSku,
        product: inventory.productVariant.product.productName,
        available: inventory.availableStock,
        qty: 1,
      },
    ]);

    setSearchSku("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSearch = async (value: string) => {
    setSearchSku(value);

    if (!fromWarehouseId) return;

    if (value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const response = await searchInventory.mutateAsync({
        warehouseId: fromWarehouseId,
        search: value,
        page: 1,
        limit: 10,
      });

      setSearchResults(response.data);

      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    }
  };

  const handleAddProduct = async () => {
    if (!fromWarehouseId) {
      toast.error("Please select From Warehouse.");
      return;
    }

    if (!searchSku.trim()) {
      toast.error("Please enter SKU.");
      return;
    }

    try {
      const response = await searchInventory.mutateAsync({
        warehouseId: fromWarehouseId,
        search: searchSku.trim(),
        page: 1,
        limit: 1,
      });

      if (!response.data.length) {
        toast.error("Product not found.");
        return;
      }

      const inventory = response.data[0];

      const exists = items.some(
        (item) => item.productVariantId === inventory.productVariant.id,
      );

      if (exists) {
        toast.error("Product already added.");
        return;
      }

      setItems((prev) => [
        ...prev,
        {
          inventoryId: inventory.id,

          productVariantId: inventory.productVariant.id,

          sku: inventory.productVariant.variantSku,

          product: inventory.productVariant.product.productName,

          available: inventory.availableStock,

          qty: 1,
        },
      ]);

      setSearchSku("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ?? "Failed to search product.",
      );
    }
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId) {
      toast.error("Please select From Warehouse.");
      return;
    }

    if (!toWarehouseId) {
      toast.error("Please select To Warehouse.");
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error("From Warehouse and To Warehouse cannot be same.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one product.");
      return;
    }

    await createTransfer.mutateAsync({
      fromWarehouseId,
      toWarehouseId,
      notes,
      items: items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.qty,
      })),
    });

    onClose();
  };
  return (
    <div className="space-y-6 p-6">
      {/* ====================================================== */}
      {/* Warehouse Selection */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            From Warehouse
          </label>

          <ReactSelect
            options={warehouseOptions}
            placeholder="Select Warehouse"
            value={
              warehouseOptions.find((item) => item.value === fromWarehouseId) ??
              null
            }
            onChange={(option) => setFromWarehouseId(option?.value ?? "")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            To Warehouse
          </label>

          <ReactSelect
            options={warehouseOptions}
            placeholder="Select Warehouse"
            value={
              warehouseOptions.find((item) => item.value === toWarehouseId) ??
              null
            }
            onChange={(option) => setToWarehouseId(option?.value ?? "")}
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* Notes */}
      {/* ====================================================== */}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Enter transfer notes..."
          className="
            w-full
            resize-none
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            outline-none
            transition
            focus:border-[#E8C16D]
          "
        />
      </div>

      {/* ====================================================== */}
      {/* Products */}
      {/* ====================================================== */}

      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b bg-slate-50 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Products</h3>

            <p className="mt-1 text-sm text-slate-500">
              Search SKU and add products to transfer.
            </p>
          </div>

          <div className="flex w-full gap-3 lg:w-auto">
            {/* <Input
              placeholder="Enter SKU..."
              value={searchSku}
              onChange={(e) => setSearchSku(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddProduct();
                }
              }}
              className="w-full lg:w-80"
            /> */}
            <div className="relative w-full lg:w-80">
              <Input
                placeholder="Search SKU..."
                value={searchSku}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {showDropdown && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">
                      No products found.
                    </div>
                  ) : (
                    searchResults.map((inventory) => (
                      <button
                        key={inventory.id}
                        type="button"
                        onClick={() => addInventoryItem(inventory)}
                        className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium">
                            {inventory.productVariant.variantSku}
                          </p>

                          <p className="text-sm text-slate-500">
                            {inventory.productVariant.product.productName}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-green-600">
                          {inventory.availableStock}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <Button
                onClick={handleAddProduct}
                loading={searchInventory.isPending}
              >
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <TransferItemsTable items={items} setItems={setItems} />
        </div>
      </div>

      {/* ====================================================== */}
      {/* Footer */}
      {/* ====================================================== */}

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button onClick={handleSubmit} loading={createTransfer.isPending}>
          Create Transfer
        </Button>
      </div>
    </div>
  );
}
