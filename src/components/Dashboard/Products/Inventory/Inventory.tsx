"use client";

import { useState } from "react";

// import { useInventories } from "./hooks/useInventories";
import {
  useInventories,
  useUpdateInventory,
  useAdjustInventory,
  useDeleteInventory,
  useExportInventory,
} from "./hooks/useInventories";

import type { Inventory, InventoryFilters } from "./types/inventory.types";

import InventoryToolbar from "./components/InventoryToolbar";
import DashboardLayout from "../../layout/DashboardLayout";
import InventoryTable from "./components/InventoryTable";
import InventoryModal from "./components/InventoryModal";
import AdjustInventoryModal from "./components/AdjustInventoryModal";
import DeleteInventoryModal from "./components/DeleteInventoryModal";
// import InventoryTable from "./components/InventoryTable";
// import InventoryModal from "./components/InventoryModal";
// import AdjustInventoryModal from "./components/AdjustInventoryModal";
// import DeleteInventoryModal from "./components/DeleteInventoryModal";

const InventoryPage = () => {
  // ======================================================
  // Filters
  // ======================================================

  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // ======================================================
  // Selected Inventory
  // ======================================================

  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null,
  );

  // ======================================================
  // Modals
  // ======================================================

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [search, setSearch] = useState("");

  // ======================================================
  // Query
  // ======================================================

  const { data, isLoading, isError, refetch } = useInventories(filters);
  const exportInventoryMutation = useExportInventory();

  // ======================================================
  // Render
  // ======================================================

  return (
    <DashboardLayout title="Inventory">
      <div className="space-y-6">
        <InventoryToolbar
          filters={filters}
          setFilters={setFilters}
          onRefresh={refetch}
          onExport={() => exportInventoryMutation.mutate()}
          isExporting={exportInventoryMutation.isPending}
        />

        <InventoryTable
          inventories={data?.data ?? []}
          pagination={data?.pagination}
          isLoading={isLoading}
          isError={isError}
          onEdit={(inventory) => {
            setSelectedInventory(inventory);
            setIsUpdateOpen(true);
          }}
          onAdjust={(inventory) => {
            setSelectedInventory(inventory);
            setIsAdjustOpen(true);
          }}
          onDelete={(inventory) => {
            setSelectedInventory(inventory);
            setIsDeleteOpen(true);
          }}
          onPageChange={(page) =>
            setFilters((prev) => ({
              ...prev,
              page,
            }))
          }
          onPageSizeChange={(limit) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              limit,
            }))
          }
        />

        <InventoryModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          inventory={selectedInventory}
        />

        <AdjustInventoryModal
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          inventory={selectedInventory}
        />

        <DeleteInventoryModal
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          inventory={selectedInventory}
        />
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
