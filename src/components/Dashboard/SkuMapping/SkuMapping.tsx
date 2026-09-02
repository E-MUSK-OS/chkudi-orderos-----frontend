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
    <DashboardLayout title="SKU Mapping">
      <div className="space-y-6">
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
