"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

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
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";
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

  // Fetch dynamic dropdown options from DB / Setting Masters
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  // Category Options dynamically from Setting Masters / DB
  const categoryOptions = useMemo(() => [
    { label: "All Categories", value: "" },
    ...buildMergedOptions("materialcategory", [], dropdownData?.savedOptions, dropdownData?.distinctFromMaterials?.categories),
  ], [dropdownData]);

  // Brand Options dynamically from Setting Masters / DB
  const brandOptions = useMemo(() => [
    { label: "All Brands", value: "" },
    ...buildMergedOptions("brand", [], dropdownData?.savedOptions, dropdownData?.distinctFromMaterials?.brands),
  ], [dropdownData]);

  // Marketplace Options dynamically from Setting Masters / DB
  const marketplaceOptions = useMemo(() => {
    const activeMarketplaces = buildMergedOptions("marketplace", [], dropdownData?.savedOptions)
      .filter((o) => o.value.toLowerCase() !== "all" && o.label.toLowerCase() !== "all");
    return [
      { label: "All Marketplaces", value: "" },
      ...activeMarketplaces,
    ];
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

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Calculate available height inside the scroll container so that when scrolled
  // past the Header Card and KPI Stats Cards on desktop (>= 1024px), the lower section
  // (Toolbar + Table) fills the visible viewport exactly, stopping at Toolbar as shown in img.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));

      const toolbarHeight = toolbarRef.current?.offsetHeight || 60;
      const gap = 24; // gap-4 sm:gap-6
      const maxForTable = available - toolbarHeight - gap;
      if (maxForTable > 160) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  useEffect(() => {
    calculateHeight();
  }, [filteredMaterials.length, asinItems.length, myntraItems.length, importType, calculateHeight]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until Header Card and KPI Stats Cards are hidden and stops at the fixed position (Toolbar + Table as shown in img).
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals KPI Stats Cards and Header Card.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      const tableContainer = tableContainerRef.current;
      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;
      const isPageAtTop = scrollContainer.scrollTop <= 2;

      const isOverTable =
        tableContainer &&
        (e.composedPath().includes(tableContainer) ||
          tableContainer.contains(e.target as Node));

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isPageAtBottom) {
          // Outer page has not reached the fixed view yet -> scroll page down
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + e.deltaY
          );
        } else if (!isOverTable) {
          // At the fixed point and outside the table -> forward scroll to table
          if (tableContainer) {
            tableContainer.scrollTop += e.deltaY;
          }
        }
        // If isPageAtBottom and isOverTable, allow table to scroll natively
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (!isOverTable) {
          // Cursor is outside table -> scroll outer page up if not at top
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          // Cursor is inside table
          const isTableAtTop = !tableContainer || tableContainer.scrollTop <= 1;
          if (isTableAtTop && !isPageAtTop) {
            // Table is at top row -> scroll outer page up to reveal Header Card
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
          // If table is not at top, allow table to scroll natively upwards
        }
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, pageSize, importType]);

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
      <div ref={containerRef} className="flex flex-col gap-4 sm:gap-6 font-sans text-slate-900 dark:text-slate-100 pb-8">
        {/* Header Information Banner */}
        <div
          ref={headerCardRef}
          className="shrink-0 rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]"
        >
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
        </div>

        {/* KPI Stats Cards (scrolls off when scrolling down) */}
        <div ref={statsRef} className="shrink-0">
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

        {/* Lower Section (Toolbar + MaterialTable) - stops scrolling from Toolbar as shown in img */}
        <div
          className="flex flex-col gap-4 sm:gap-6 min-h-0"
          style={{
            maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
        >
          {/* Toolbar */}
          <div ref={toolbarRef} className="shrink-0">
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
          </div>

          {/* Table Container */}
          <div
            className="flex flex-col min-h-0 flex-1"
            style={{
              maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
            }}
          >
            <div className="border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col min-h-0 max-h-full">
              <div
                ref={tableContainerRef}
                className="w-full overflow-x-auto min-h-0 overflow-y-auto custom-scrollbar overscroll-contain flex-1"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
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
                    tableWrapperClassName="w-full min-w-max"
                  />
                ) : (
                  <MyntraTable
                    items={paginatedMyntraItems}
                    isLoading={myntraLoading}
                    onEdit={handleEditMyntra}
                    tableWrapperClassName="w-full min-w-max"
                    onDelete={async (id) => {
                      try {
                        await deleteMyntraMutation.mutateAsync(id);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                )}
              </div>

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
                className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </div>
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
