"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { productCategoryOptions, defaultMarketplaceOptions } from "./constants/material.constants";

import DashboardLayout from "../../layout/DashboardLayout";

import MaterialHeader from "./components/MaterialHeader";
import MaterialStats from "./components/MaterialStats";
import MaterialToolbar, { type ImportType } from "./components/MaterialToolbar";
import MaterialTable from "./components/MaterialTable";
import AsinTable from "./components/AsinTable";
import AsinModal from "./components/AsinModal";
import MyntraModal from "./components/MyntraModal";
import type { Material } from "./types/material.types";
import type { AsinImportItem } from "./types/asinImport.types";
import type { MyntraImportItem } from "./types/myntraImport.types";
import DeleteMaterialModal from "./components/DeleteMaterialModal";
import MaterialPagination from "./components/MaterialPagination";
import MaterialModal from "./components/MaterialModal";
import {
  useMaterials,
  useMaterialStats,
  useDeleteMaterial,
  useUpdateMaterialStatus,
  useImportMaterialsExcel,
} from "./hooks/useMaterials";
import {
  useAsinImports,
  useImportAsinExcel,
  useDeleteAsinImport,
} from "./hooks/useAsinImports";
import {
  useMyntraImports,
  useImportMyntraExcel,
  useDeleteMyntraImport,
} from "./hooks/useMyntraImports";
import MyntraTable from "./components/MyntraTable";
import { useDropdownOptions } from "./hooks/useDropdownOptions";
import { useQueryClient } from "@tanstack/react-query";
import { downloadDemoSheet } from "./utils/downloadDemoSheet";
import { exportMaterialsExcel } from "./utils/exportMaterialsExcel";
import { toast } from "sonner";

const ManageMaterials = () => {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [importType, setImportType] = useState<ImportType>("material");

  // Read URL type parameter after mount on client to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("type");
      if (param === "myntra" || param === "asin" || param === "material") {
        setImportType(param as ImportType);
      }
    }
  }, []);

  // Toolbar State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [marketplace, setMarketplace] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [materialModalOpen, setmaterialModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [asinModalOpen, setAsinModalOpen] = useState(false);
  const [selectedAsin, setSelectedAsin] = useState<AsinImportItem | null>(null);

  const [myntraModalOpen, setMyntraModalOpen] = useState(false);
  const [selectedMyntra, setSelectedMyntra] = useState<MyntraImportItem | null>(null);

  const updateMaterialStatusMutation = useUpdateMaterialStatus();
  const importMaterialExcelMutation = useImportMaterialsExcel();
  const importAsinExcelMutation = useImportAsinExcel();
  const deleteAsinMutation = useDeleteAsinImport();
  const importMyntraExcelMutation = useImportMyntraExcel();
  const deleteMyntraMutation = useDeleteMyntraImport();

  // ASIN Queries
  const { data: asinResponse, isLoading: asinLoading, refetch: refetchAsin } = useAsinImports(search);
  const asinItems = asinResponse?.data ?? [];

  // Myntra Queries
  const { data: myntraResponse, isLoading: myntraLoading, refetch: refetchMyntra } = useMyntraImports(search);
  const myntraItems = myntraResponse?.data ?? [];

  const handleImportExcel = async (file: File, type: ImportType) => {
    try {
      const activeType = type || importType;
      if (activeType === "myntra") {
        await importMyntraExcelMutation.mutateAsync(file);
        await refetchMyntra();
      } else if (activeType === "asin") {
        await importAsinExcelMutation.mutateAsync(file);
        await refetchAsin();
      } else {
        await importMaterialExcelMutation.mutateAsync(file);
        await refetchMaterials();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const {
    data: materialsResponse,
    isLoading: materialsLoading,
    refetch: refetchMaterials,
  } = useMaterials();

  const { data: statsResponse } = useMaterialStats();
  const materialStats = statsResponse?.data;
  const deleteMaterialMutation = useDeleteMaterial();

  // Category Options
  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...productCategoryOptions.filter((o: any) => o.value !== "other"),

  ];

  // Brand Options
  const brandOptions = [
    { label: "All Brands", value: "" },
    { label: "R.Code", value: "R.Code" },
    { label: "TOPLOT", value: "TOPLOT" },
  ];

  // Marketplace Options
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  const marketplaceOptions = useMemo(() => {
    const list = [
      { label: "All Marketplaces", value: "" },
      ...defaultMarketplaceOptions,
    ];
    const dbSaved = (dropdownData?.savedOptions || [])
      .filter((o) => o.field.toLowerCase() === "marketplace")
      .map((o) => ({ label: o.label || o.value, value: o.value }));

    const map = new Map<string, { label: string; value: string }>();
    [...list, ...dbSaved].forEach((o) => {
      const v = o.value?.trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: o.label || v, value: v });
      } else if (v === "" && !map.has("")) {
        map.set("", { label: o.label, value: "" });
      }
    });
    return Array.from(map.values());
  }, [dropdownData]);

  const materials = materialsResponse?.data ?? [];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      search === "" ||
      material.materialName.toLowerCase().includes(search.toLowerCase()) ||
      material.masterSku.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = status === "" || String(material.isActive) === status;
    const matchesCategory =
      !category ||
      category.trim() === "" ||
      (material.category &&
        material.category.toLowerCase().includes(category.toLowerCase().trim())) ||
      (material.subCategory &&
        material.subCategory.toLowerCase().includes(category.toLowerCase().trim()));
    const matchesBrand = brand === "" || material.brand === brand;

    const matchesMarketplace = (() => {
      if (!marketplace || marketplace.trim() === "") return true;
      const filterLower = marketplace.toLowerCase().trim();

      const rawMkt = (material as any)?.marketplace;
      let mkts: string[] = [];
      if (Array.isArray(rawMkt)) {
        mkts = rawMkt.map((m) => String(m).toLowerCase().trim()).filter(Boolean);
      } else if (typeof rawMkt === "string" && rawMkt.trim()) {
        mkts = rawMkt.split(",").map((m) => m.toLowerCase().trim()).filter(Boolean);
      } else {
        const mktAttr = (material.attributes || []).find(
          (a: any) => (a.attributeName || "").toLowerCase().trim() === "marketplace"
        );
        if (mktAttr?.attributeValue?.trim()) {
          mkts = mktAttr.attributeValue.split(",").map((s: string) => s.toLowerCase().trim()).filter(Boolean);
        }
      }

      if (mkts.length === 0) {
        mkts = ["all"];
      }

      if (filterLower === "all") {
        return mkts.includes("all");
      }

      return mkts.includes(filterLower) || mkts.includes("all");
    })();

    return matchesSearch && matchesStatus && matchesCategory && matchesBrand && matchesMarketplace;
  });

  const totalRecords =
    importType === "material"
      ? filteredMaterials.length
      : importType === "asin"
      ? asinItems.length
      : myntraItems.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedMaterials = filteredMaterials.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const paginatedAsinItems = asinItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const paginatedMyntraItems = myntraItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);

  const handleVariantToggle = (material: Material) => {
    if (expandedMaterialId === material.id) {
      setExpandedMaterialId(null);
    } else {
      setExpandedMaterialId(material.id);
    }
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = paginatedMaterials.map((p) => p.id);
    const isAllSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedMaterialIds.includes(id));

    if (isAllSelected) {
      setSelectedMaterialIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      setSelectedMaterialIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds]))
      );
    }
  };

  const handleExportMaterials = () => {
    const isSelectedOnly = selectedMaterialIds.length > 0;
    const targetProducts = isSelectedOnly
      ? materials.filter((p) => selectedMaterialIds.includes(p.id))
      : filteredMaterials.length > 0
      ? filteredMaterials
      : materials;

    if (targetProducts.length === 0) {
      toast.error("No materials to export.");
      return;
    }

    exportMaterialsExcel(targetProducts, isSelectedOnly);
  };

  const handleEdit = (material: Material) => {
    router.push(
      `/dashboard/settings/manage-material/material-profile/add-material?id=${material.id}`
    );
  };

  const handleEditAsin = (item: AsinImportItem) => {
    setSelectedAsin(item);
    setAsinModalOpen(true);
  };

  const handleEditMyntra = (item: MyntraImportItem) => {
    setSelectedMyntra(item);
    setMyntraModalOpen(true);
  };

  const handleStatus = async (material: Material) => {
    try {
      await updateMaterialStatusMutation.mutateAsync({
        id: material.id,
        data: {
          isActive: !material.isActive,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: ["material-variants", material.id],
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setStatus("");
    setCategory("");
    setBrand("");
    setMarketplace("");

    if (importType === "myntra") {
      refetchMyntra();
    } else if (importType === "asin") {
      refetchAsin();
    } else {
      refetchMaterials();
    }
  };

  const confirmDelete = async () => {
    if (!selectedMaterial) return;

    try {
      setDeleteLoading(true);
      await deleteMaterialMutation.mutateAsync(selectedMaterial.id);
      setDeleteModalOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDelete = (material: Material) => {
    setSelectedMaterial(material);
    setDeleteModalOpen(true);
  };

  const handleDeleteAsin = async (id: string) => {
    try {
      await deleteAsinMutation.mutateAsync(id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout title="Material Profile">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Information Banner matching Inventory */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <MaterialHeader
            buttonLabel={
              importType === "asin"
                ? "Add ASIN"
                : importType === "myntra"
                ? "Add Myntra"
                : "Add Material"
            }
            demoSheetLabel="Demo Sheet"
            onDownloadDemoSheet={() => downloadDemoSheet(importType)}
            onAddMaterial={() => {
              if (importType === "asin") {
                setSelectedAsin(null);
                setAsinModalOpen(true);
              } else if (importType === "myntra") {
                setSelectedMyntra(null);
                setMyntraModalOpen(true);
              } else if (importType === "material") {
                router.push("/dashboard/settings/manage-material/material-profile/add-material");



              }
            }}
          />

          <div className="mt-5 sm:mt-6 border-t border-[#E7E0D2] dark:border-white/[0.08] pt-5 sm:pt-6">
            <MaterialStats
              importType={importType}
              stats={materialStats}
              totalMaterials={materials.length}
              asinItems={asinItems}
              asinTotal={asinResponse?.total}
              myntraItems={myntraItems}
              myntraTotal={myntraResponse?.total}
              isLoading={
                importType === "asin"
                  ? asinLoading
                  : importType === "myntra"
                  ? myntraLoading
                  : materialsLoading
              }
            />
          </div>
        </div>

        <MaterialToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          brand={brand}
          onBrandChange={setBrand}
          marketplace={marketplace}
          onMarketplaceChange={setMarketplace}
          marketplaceOptions={marketplaceOptions}
          importType={importType}
          onImportTypeChange={(type) => {
            setImportType(type);
            setPage(1);
          }}
          categoryOptions={categoryOptions}
          brandOptions={brandOptions}
          onRefresh={handleRefresh}
          onImportExcel={handleImportExcel}
          isImporting={
            importType === "myntra"
              ? importMyntraExcelMutation.isPending
              : importType === "asin"
              ? importAsinExcelMutation.isPending
              : importMaterialExcelMutation.isPending
          }
          materialsData={materials}
          asinData={asinItems}
          myntraData={myntraItems}
          selectedCount={selectedMaterialIds.length}
          onExportMaterials={handleExportMaterials}
        />

        {/* Table Container matching Inventory */}
        <div className="border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col">
          {importType === "material" ? (
            <MaterialTable
              materials={paginatedMaterials}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatus}
              expandedMaterialId={expandedMaterialId}
              onVariantToggle={handleVariantToggle}
              selectedMaterialIds={selectedMaterialIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          ) : importType === "asin" ? (
            <AsinTable
              items={paginatedAsinItems}
              isLoading={asinLoading}
              onEdit={handleEditAsin}
              onDelete={handleDeleteAsin}
            />
          ) : (
            <MyntraTable
              items={paginatedMyntraItems}
              isLoading={myntraLoading}
              onEdit={handleEditMyntra}
              onDelete={async (id) => {
                try {
                  await deleteMyntraMutation.mutateAsync(id);
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          )}

          <MaterialPagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={pageSize}
            pageSize={pageSize}
            itemName={
              importType === "asin"
                ? "ASINs"
                : importType === "myntra"
                ? "Myntra SKUs"
                : "materials"
            }
            variant="dark"
            className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5 mt-auto"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <MaterialModal
        open={materialModalOpen}
        onDeleteClick={() => {
          setmaterialModalOpen(false);
          setDeleteModalOpen(true);
        }}
        mode={modalMode}
        material={selectedMaterial ?? undefined}
        onClose={() => {
          setmaterialModalOpen(false);
          setSelectedMaterial(null);
        }}
        onSuccess={() => {
          setmaterialModalOpen(false);
          setSelectedMaterial(null);
          refetchMaterials();
          refetchAsin();
        }}
      />

      <AsinModal
        open={asinModalOpen}
        item={selectedAsin}
        onClose={() => {
          setAsinModalOpen(false);
          setSelectedAsin(null);
        }}
      />

      <MyntraModal
        open={myntraModalOpen}
        item={selectedMyntra}
        onClose={() => {
          setMyntraModalOpen(false);
          setSelectedMyntra(null);
        }}
      />

      <DeleteMaterialModal
        open={deleteModalOpen}
        material={selectedMaterial}
        loading={deleteLoading}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedMaterial(null);
        }}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
};

export default ManageMaterials;


