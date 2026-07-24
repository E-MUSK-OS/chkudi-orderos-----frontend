"use client";

import { useState } from "react";

import DashboardLayout from "../layout/DashboardLayout";

import WarehouseHeader from "./components/WarehouseHeader";
import WarehouseStats from "./components/WarehouseStats";
import WarehouseToolbar from "./components/WarehouseToolbar";
import WarehouseTable from "./components/WarehouseTable";
import WarehouseModal from "./components/WarehouseModal";
import {
  useDeleteWarehouse,
  useUpdateWarehouseStatus,
  useWarehouses,
  useWarehouseStats,
} from "./hooks/useWarehouse";
import type { Warehouse } from "./types/warehouse.types";
import DeleteWarehouseModal from "./components/DeleteWarehouseModal";

const countryOptions = [
  {
    label: "All Countries",
    value: "",
  },
  {
    label: "India",
    value: "India",
  },
  {
    label: "UAE",
    value: "UAE",
  },
  {
    label: "USA",
    value: "USA",
  },
];

export default function Warehouse() {
  const { data, isLoading, isError, refetch } = useWarehouses();
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [country, setCountry] = useState("");

  const [isDefault, setIsDefault] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedWarehouse, setSelectedWarehouse] = useState<
    Warehouse | undefined
  >();

  const { mutateAsync: deleteWarehouseApi, isPending: isDeleting } =
    useDeleteWarehouse();

  const handleEdit = (warehouse: Warehouse) => {
    setMode("edit");
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(
    null,
  );

  const { mutateAsync: updateWarehouseStatus, isPending: isStatusUpdating } =
    useUpdateWarehouseStatus();

  const [statusWarehouse, setStatusWarehouse] = useState<Warehouse | null>(
    null,
  );

  const handleDelete = (warehouse: Warehouse) => {
    setDeleteWarehouse(warehouse);
  };

  const handleConfirmDelete = async () => {
    if (!deleteWarehouse) return;

    await deleteWarehouseApi(deleteWarehouse.id);

    setDeleteWarehouse(null);
  };

  const handleStatusChange = async (warehouse: Warehouse, checked: boolean) => {
    await updateWarehouseStatus({
      id: warehouse.id,
      data: {
        isActive: checked,
      },
    });
  };

  const { data: statsData, isLoading: statsLoading } = useWarehouseStats();

  const filteredWarehouses = (data?.data ?? []).filter((warehouse) => {
    // Search
    const matchesSearch =
      warehouse.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.warehouseCode.toLowerCase().includes(search.toLowerCase());

    // Status
    const matchesStatus =
      status === "" ? true : warehouse.isActive === (status === "true");

    // Default
    const matchesDefault =
      isDefault === "" ? true : warehouse.isDefault === (isDefault === "true");

    return matchesSearch && matchesStatus && matchesDefault;
  });

  return (
    <DashboardLayout title="Warehouse">
      <div className="space-y-6">
        <WarehouseHeader
          onAddWarehouse={() => {
            setMode("create");
            setSelectedWarehouse(undefined);
            setIsModalOpen(true);
          }}
        />

        <WarehouseStats stats={statsData?.data} />

        <WarehouseToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          country={country}
          onCountryChange={setCountry}
          isDefault={isDefault}
          onIsDefaultChange={setIsDefault}
          countryOptions={countryOptions}
          onDownload={() => {}}
          onRefresh={refetch}
        />

        <WarehouseTable
          warehouses={filteredWarehouses}
          isLoading={isLoading}
          isError={isError}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />

        <WarehouseModal
          open={isModalOpen}
          mode={mode}
          warehouse={selectedWarehouse}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
          }}
        />

        <DeleteWarehouseModal
          open={!!deleteWarehouse}
          warehouse={deleteWarehouse}
          loading={isDeleting}
          onClose={() => setDeleteWarehouse(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
