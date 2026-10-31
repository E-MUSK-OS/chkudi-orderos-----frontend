"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { SkuMapping } from "./types/skuMapping.types";

import Toolbar from "./components/Toolbar";
import SkuMappingTable from "./components/SkuMappingTable";
import ImportSkuMappingModal from "./components/ImportModal";
import SkuMappingModal from "./components/SkuMappingModal";
import DeleteSkuMappingModal from "./components/DeleteSkuMappingModal";
import { useSkuMappings } from "./hooks/useSkuMappings";
import GenerateSheetModal from "./components/GenerateSheetModal";
// import SkuMappingModal from "./components/SkuMappingModal";
// import DeleteSkuMappingModal from "./components/DeleteSkuMappingModal";

export default function SkuMappingPage() {
  const [importOpen, setImportOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedSku, setSelectedSku] = useState<SkuMapping | null>(null);
  const [search, setSearch] = useState("");

  const [page] = useState(1);
  const [pageSize] = useState(10);

  const { data } = useSkuMappings({
    page,
    limit: pageSize,
    search,
  });
  useEffect(() => {
    console.log(
      "sku-generate-sheet =>",
      localStorage.getItem("sku-generate-sheet"),
    );
  }, []);

  return (
    <DashboardLayout title="Godown Inventory Sheet">
      <div className="space-y-6">
        {/* Top Header Card matching OrderOS theme */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Manege Label Printing and SKU Mappings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage SKU barcode mappings and generate godown inventory sheets for warehouse operations.
              </p>
            </div>
          </div>
        </div>

        <Toolbar
          search={search}
          total={data?.pagination.total ?? 0}
          onSearchChange={setSearch}
          onImport={() => setImportOpen(true)}
          onGenerateSheet={() => setGenerateSheetOpen(true)}
        />

        <SkuMappingTable
          search={search}
          onEdit={(row) => {
            setSelectedSku(row);
            setEditOpen(true);
          }}
          onDelete={(row) => {
            setSelectedSku(row);
            setDeleteOpen(true);
          }}
        />
      </div>

      <ImportSkuMappingModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <SkuMappingModal
        open={editOpen}
        skuMapping={selectedSku}
        onClose={() => setEditOpen(false)}
      />

      {/* <SkuMappingModal
        open={editOpen}
        skuMapping={selectedSku}
        onClose={() => setEditOpen(false)}
      /> */}

      <DeleteSkuMappingModal
        open={deleteOpen}
        skuMapping={selectedSku}
        onClose={() => setDeleteOpen(false)}
      />

      <GenerateSheetModal
        open={generateSheetOpen}
        onClose={() => setGenerateSheetOpen(false)}
      />
    </DashboardLayout>
  );
}
