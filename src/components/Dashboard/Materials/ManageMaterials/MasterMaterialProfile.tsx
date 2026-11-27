"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Copy,
  DollarSign,
  Download,
  EyeOff,
  Filter,
  Layers,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "../../layout/DashboardLayout";
import ActionMenu from "@/components/ui/ActionMenu";
import Pagination from "@/components/ui/Pagination";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
import { API_BASE_URL } from "@/lib/config";
import { materialService } from "./services/material.service";
import { useMaterials } from "./hooks/useMaterials";
import type { Material } from "./types/material.types";
import type { MaterialVariant } from "./types/materialVariant.types";

type ColKey = "no" | "sku" | "category" | "hsn" | "gst";

interface MaterialListingRow {
  rowId: string;
  rowType: "variant" | "master";
  sku: string;
  category: string;
  hsnCode: string;
  gstRate: number | string | null | undefined;
  color: string;
  size: string;
  rackAddress: string;
  isActive: boolean;
  imageUrl?: string;
  material: Material;
  variant?: MaterialVariant;
}

const toFullImageUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  let cleanPath = url.startsWith("/") ? url : `/${url}`;
  if (!cleanPath.startsWith("/api/v1")) {
    cleanPath = `/api/v1${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
};

const getVariantAttr = (variant: MaterialVariant, names: string[]): string => {
  const matched = variant.attributes?.find((a) =>
    names.includes((a.materialAttribute?.attributeName || "").toLowerCase().trim())
  );
  return matched?.attributeValue || "";
};

function MaterialThumbnail({
  variantDirectUrl,
  materialFallbackUrl,
  masterSku,
  variantSku,
  color,
  isVariant,
  alt,
}: {
  variantDirectUrl?: string;
  materialFallbackUrl?: string;
  masterSku?: string;
  variantSku?: string;
  color?: string;
  isVariant?: boolean;
  alt: string;
}) {
  const [imgError, setImgError] = useState(false);
  const cleanMasterSku = (masterSku || "").trim();

  const { data: imagesRes } = useQuery({
    queryKey: ["Material-images", cleanMasterSku],
    queryFn: () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
      return materialService.getProductImages(cleanMasterSku, token);
    },
    enabled: !variantDirectUrl && !!cleanMasterSku,
    staleTime: 1000 * 60 * 5,
  });

  const resolvedUrl = useMemo(() => {
    if (variantDirectUrl) return variantDirectUrl;
    const map = imagesRes?.data;
    if (map) {
      const cleanVariantSku = (variantSku || "").toLowerCase().trim();
      if (isVariant && cleanVariantSku) {
        const skuMatch = Object.entries(map).find(
          ([k]) => k.toLowerCase().trim() === cleanVariantSku
        );
        if (skuMatch?.[1]) return toFullImageUrl(skuMatch[1]);
      }

      const cleanColor = (color || "").toLowerCase().trim();
      if (cleanColor) {
        const match = Object.entries(map).find(
          ([k]) => k.toLowerCase().trim() === cleanColor
        );
        if (match?.[1]) return toFullImageUrl(match[1]);
      } else if (!isVariant) {
        const first = Object.values(map)[0];
        if (first) return toFullImageUrl(first);
      } else {
        const defaultMatch = Object.entries(map).find(([k]) =>
          ["default", "standard"].includes(k.toLowerCase().trim())
        );
        if (defaultMatch?.[1]) return toFullImageUrl(defaultMatch[1]);
      }
    }
    return materialFallbackUrl;
  }, [variantDirectUrl, materialFallbackUrl, imagesRes, variantSku, color, isVariant]);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8C16D]/30 bg-[#FFF9EC] text-[#B88728] dark:border-[#F5C451]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] overflow-hidden">
      {resolvedUrl && !imgError ? (
        <img
          src={resolvedUrl}
          alt={alt}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Layers className="h-4 w-4" />
      )}
    </div>
  );
}

export default function MasterMaterialProfile() {
  const router = useRouter();
  const { data, isLoading, isError } = useMaterials();

  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
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

  // Stop page scrolling once Global Search reaches the top, then scroll table internally
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      coordinateTableWheelScroll({
        e,
        scrollContainer,
        tableContainer: tableContainerRef.current,
      });
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [openHeaderMenu, setOpenHeaderMenu] = useState<ColKey | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const [sortConfig, setSortConfig] = useState<{
    key: ColKey | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    no: true,
    sku: true,
    category: true,
    hsn: true,
    gst: true,
  });

  const [pinnedCols, setPinnedCols] = useState<Record<ColKey, "left" | "right" | null>>({
    no: null,
    sku: null,
    category: null,
    hsn: null,
    gst: null,
  });

  const materials: Material[] = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  // If material has variants (> 0), list each variant SKU row; if 0 variants, show master SKU row
  const rows: MaterialListingRow[] = useMemo(() => {
    const result: MaterialListingRow[] = [];
    for (const m of materials) {
      const variants: MaterialVariant[] = Array.isArray(m.variants) ? m.variants : [];
      if (variants.length > 0) {
        for (const v of variants) {
          result.push({
            rowId: `variant:${v.id}`,
            rowType: "variant",
            sku: v.variantSku || m.masterSku || m.sku || "",
            category: m.category || "--",
            hsnCode: m.hsnCode || "--",
            gstRate: m.gstRate,
            color: getVariantAttr(v, ["color", "colour"]),
            size: getVariantAttr(v, ["size", "dimension"]),
            rackAddress: v.rackAddress || m.rackAddress || "",
            isActive: v.isActive ?? true,
            imageUrl: toFullImageUrl(
              v.imageUrl || v.imgfileurl || m.imageUrl || m.imgfileurl
            ),
            material: m,
            variant: v,
          });
        }
      } else {
        result.push({
          rowId: `master:${m.id}`,
          rowType: "master",
          sku: m.masterSku || m.sku || "",
          category: m.category || "--",
          hsnCode: m.hsnCode || "--",
          gstRate: m.gstRate,
          color: Array.isArray(m.colors) ? m.colors.join(", ") : "",
          size: m.sizeList || "",
          rackAddress: m.rackAddress || "",
          isActive: m.isActive ?? true,
          imageUrl: toFullImageUrl(m.imageUrl || m.imgfileurl),
          material: m,
        });
      }
    }
    return result;
  }, [materials]);

  const filteredRows = useMemo(() => {
    const globQ = globalSearch.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      if (!globQ) return true;
      const gstText =
        r.gstRate !== undefined && r.gstRate !== null ? `${r.gstRate}%` : "";
      const hay = `${r.sku} ${r.category} ${r.hsnCode} ${gstText} ${r.color} ${r.size} ${r.rackAddress}`.toLowerCase();
      return hay.includes(globQ);
    });

    if (!sortConfig.key || !sortConfig.direction) {
      return filtered;
    }

    const dir = sortConfig.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let valA = "";
      let valB = "";
      switch (sortConfig.key) {
        case "sku":
          valA = a.sku || "";
          valB = b.sku || "";
          break;
        case "category":
          valA = a.category || "";
          valB = b.category || "";
          break;
        case "hsn":
          valA = a.hsnCode || "";
          valB = b.hsnCode || "";
          break;
        case "gst":
          valA = String(a.gstRate ?? "");
          valB = String(b.gstRate ?? "");
          break;
        default:
          return 0;
      }
      return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [rows, globalSearch, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const handleCopySku = (sku: string) => {
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    toast.success(`Copied ${sku}`);
  };

  const handleToggleSort = (key: ColKey) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
    setCurrentPage(1);
  };

  const handleClearAllSorting = () => {
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
    setSettingsMenuOpen(false);
    toast.success("Cleared all sorting");
  };

  const handleClearAllFilters = () => {
    setGlobalSearch("");
    setCurrentPage(1);
    setSettingsMenuOpen(false);
    toast.success("Cleared all filters");
  };

  const handleResetAllPinning = () => {
    setPinnedCols({
      no: null,
      sku: null,
      category: null,
      hsn: null,
      gst: null,
    });
    setSettingsMenuOpen(false);
    toast.success("Reset all column pinning");
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedRows.map((r) => r.rowId);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedRowIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handleDownloadSelectedExcel = async () => {
    const selectedSet = new Set(selectedRowIds);
    const selectedRows = rows.filter((r) => selectedSet.has(r.rowId));
    if (selectedRows.length === 0) return;

    const extraAttrNames = Array.from(
      new Set(
        selectedRows.flatMap((r) =>
          (r.variant?.attributes || [])
            .map((a) => a.materialAttribute?.attributeName?.trim() || "")
            .filter(
              (name) =>
                name &&
                !["color", "colour", "size", "dimension"].includes(name.toLowerCase())
            )
        )
      )
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Material Variant Data");

    const headers = [
      "SKU",
      "Color",
      "Size",
      ...extraAttrNames,
      "Rack Address",
      "Status",
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A0E1A" },
    };

    selectedRows.forEach((r) => {
      const extraVals = extraAttrNames.map(
        (name) =>
          r.variant?.attributes?.find(
            (a) =>
              (a.materialAttribute?.attributeName || "").toLowerCase().trim() ===
              name.toLowerCase()
          )?.attributeValue || ""
      );

      sheet.addRow([
        r.sku || "",
        r.color || "",
        r.size || "",
        ...extraVals,
        r.rackAddress || "",
        r.isActive ? "Active" : "Inactive",
      ]);
    });

    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Master_Material_Variants_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );
    toast.success(`Downloaded ${selectedRows.length} item(s)`);
  };

  const hasActiveSorting = Boolean(sortConfig.key && sortConfig.direction);
  const hasActiveFilters = Boolean(globalSearch.trim());
  const hasActivePinning = Object.values(pinnedCols).some(Boolean);

  const COLUMN_META: { key: ColKey; label: string; minWidth: string; center?: boolean }[] = [
    { key: "no", label: "No.", minWidth: "w-14", center: true },
    { key: "sku", label: "SKU.", minWidth: "min-w-[260px]" },
    { key: "category", label: "Category", minWidth: "min-w-[170px]" },
    { key: "hsn", label: "HSN", minWidth: "min-w-[150px]" },
    { key: "gst", label: "GST", minWidth: "min-w-[120px]" },
  ];

  const orderedColumns = useMemo(() => {
    const visible = COLUMN_META.filter((c) => visibleCols[c.key]);
    const left = visible.filter((c) => pinnedCols[c.key] === "left");
    const center = visible.filter((c) => !pinnedCols[c.key]);
    const right = visible.filter((c) => pinnedCols[c.key] === "right");
    return [...left, ...center, ...right];
  }, [visibleCols, pinnedCols]);

  const getPinnedHeaderClass = (pin: "left" | "right" | null) =>
    pin === "left"
      ? "sticky left-0 z-20 bg-[#FEFAEE] dark:bg-[#080B11]"
      : pin === "right"
        ? "sticky right-0 z-20 bg-[#FEFAEE] dark:bg-[#080B11]"
        : "";

  const getPinnedCellClass = (pin: "left" | "right" | null) =>
    pin === "left"
      ? "sticky left-0 z-10 bg-white dark:bg-[#0F1626]"
      : pin === "right"
        ? "sticky right-0 z-10 bg-white dark:bg-[#0F1626]"
        : "";

  const renderColumnHeader = (key: ColKey, label: string, minWidthClass: string, center = false) => {
    const isSorted = sortConfig.key === key;
    const isMenuOpen = openHeaderMenu === key;
    const pinSide = pinnedCols[key];

    return (
      <th
        className={`relative px-4 py-3.5 border-r border-[#F5E6BE] dark:border-white/[0.08] ${minWidthClass} ${getPinnedHeaderClass(
          pinSide
        )}`}
      >
        <div className={`flex items-center justify-between gap-2 ${center ? "justify-center" : ""}`}>
          {key !== "no" ? (
            <button
              type="button"
              onClick={() => handleToggleSort(key)}
              title={`Sort by ${label}`}
              className="truncate text-left hover:text-[#B88728] dark:hover:text-[#F5C451] transition-colors cursor-pointer"
            >
              {label}
            </button>
          ) : (
            <span className="truncate">{label}</span>
          )}

          {key !== "no" && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleSort(key)}
                title="Sort column"
                className={`p-1 rounded-md transition-colors cursor-pointer ${isSorted
                  ? "text-[#B88728] dark:text-[#F5C451] bg-[#FFF9EC] dark:bg-white/[0.08]"
                  : "text-slate-400 hover:text-[#6A4D1D] dark:hover:text-[#E8C16D] hover:bg-black/5 dark:hover:bg-white/[0.06]"
                  }`}
              >
                {isSorted && sortConfig.direction === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : isSorted && sortConfig.direction === "desc" ? (
                  <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpenHeaderMenu(isMenuOpen ? null : key)}
                title="Column options"
                className="p-1 rounded-md text-slate-400 hover:text-[#6A4D1D] dark:hover:text-[#E8C16D] hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div className="absolute right-2 top-full mt-1 w-44 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] p-1.5 shadow-xl z-40 space-y-0.5 text-xs font-semibold normal-case tracking-normal text-slate-700 dark:text-slate-200">
            <button
              type="button"
              onClick={() => {
                setSortConfig({ key, direction: "asc" });
                setOpenHeaderMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
            >
              <ArrowUp className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
              <span>Sort Ascending</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSortConfig({ key, direction: "desc" });
                setOpenHeaderMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
            >
              <ArrowDown className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
              <span>Sort Descending</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPinnedCols((prev) => ({ ...prev, [key]: "left" }));
                setOpenHeaderMenu(null);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left ${pinSide === "left" ? "text-[#B88728] dark:text-[#F5C451]" : ""
                }`}
            >
              <Pin className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
              <span>Pin to Left</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPinnedCols((prev) => ({ ...prev, [key]: "right" }));
                setOpenHeaderMenu(null);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left ${pinSide === "right" ? "text-[#B88728] dark:text-[#F5C451]" : ""
                }`}
            >
              <Pin className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] rotate-90" />
              <span>Pin to Right</span>
            </button>
            {pinSide && (
              <button
                type="button"
                onClick={() => {
                  setPinnedCols((prev) => ({ ...prev, [key]: null }));
                  setOpenHeaderMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
              >
                <PinOff className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                <span>Unpin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setVisibleCols((prev) => ({ ...prev, [key]: false }));
                setOpenHeaderMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer text-left"
            >
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
              <span>Hide Column</span>
            </button>
          </div>
        )}
      </th>
    );
  };

  return (
    <DashboardLayout title="Master Material Profile">
      <div className="space-y-4 sm:space-y-6 font-sans text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto">
        {/* Header Card */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Master Material Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Create &amp; Manage material after activation
            </p>
          </div>
        </div>

        {/* Main Table Card Container (stops at top when Global Search reaches top) */}
        <div
          ref={containerRef}
          style={isDesktop && targetHeight ? { height: targetHeight } : undefined}
          className="flex flex-col rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-visible"
        >
          {/* Toolbar */}
          <div className="shrink-0 p-3.5 sm:p-5 border-b border-[#EAE4D8] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Single Global Search matching OrderOS theme */}
            <div className="w-full sm:w-auto sm:max-w-md sm:flex-1 transition-all">
              <div className="group flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 sm:px-4 h-9 sm:h-10 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451] dark:focus-within:ring-[#F5C451]/30 dark:focus-within:bg-[#0B0F17]">
                <div className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Global search..."
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearch("");
                      setCurrentPage(1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0 dark:text-slate-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {selectedRowIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadSelectedExcel}
                  className="inline-flex h-10 items-center gap-1.5 px-3.5 rounded-xl bg-[#E8C16D] hover:bg-[#d8b05c] text-xs font-bold text-[#0A0E1A] shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download ({selectedRowIds.length})</span>
                </button>
              )}

              {/* Columns Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setColumnsMenuOpen((o) => !o);
                    setSettingsMenuOpen(false);
                    setOpenHeaderMenu(null);
                  }}
                  className="inline-flex h-10 items-center gap-1.5 px-3.5 rounded-xl border border-[#E7E0D2] bg-white text-xs font-bold text-[#0A0E1A] hover:border-[#E8C16D] hover:bg-[#FFF9EC]/50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] transition-all cursor-pointer shadow-2xs"
                >
                  <Columns3 className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                  <span>Columns</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>

                {columnsMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] p-2 shadow-xl z-30 space-y-1">
                    {COLUMN_META.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleCols[col.key]}
                          onChange={(e) =>
                            setVisibleCols((prev) => ({
                              ...prev,
                              [col.key]: e.target.checked,
                            }))
                          }
                          className="accent-[#B88728] dark:accent-[#F5C451]"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Table Settings & Column Pinning Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsMenuOpen((o) => !o);
                    setColumnsMenuOpen(false);
                    setOpenHeaderMenu(null);
                  }}
                  title="Table Settings"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:text-[#F5C451] transition-all cursor-pointer shadow-2xs"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>

                {settingsMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] p-2.5 shadow-xl z-30 space-y-2.5">
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Table Settings
                      </p>
                      <button
                        type="button"
                        disabled={!hasActiveSorting}
                        onClick={handleClearAllSorting}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                        <span>Clear All Sorting</span>
                      </button>
                      <button
                        type="button"
                        disabled={!hasActiveFilters}
                        onClick={handleClearAllFilters}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <Filter className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                        <span>Clear All Filter</span>
                      </button>
                    </div>

                    <div className="border-t border-[#EAE4D8] dark:border-white/[0.08]" />

                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Column Pinning
                      </p>
                      <button
                        type="button"
                        disabled={!hasActivePinning}
                        onClick={handleResetAllPinning}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <PinOff className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                        <span>Reset All Pinning</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            ref={tableContainerRef}
            className="lg:flex-1 lg:min-h-0 overflow-x-auto overflow-y-auto"
          >
            <table className="w-full border-collapse text-left font-sans">
              <thead className="sticky top-0 z-10 bg-[#FEFAEE] dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] border-b border-[#F5E6BE] dark:border-white/[0.08] dark:text-[#E8C16D] select-none">
                <tr>
                  {orderedColumns.map((col) => (
                    <Fragment key={col.key}>
                      {renderColumnHeader(col.key, col.label, col.minWidth, col.center)}
                      {col.key === "no" && (
                        <th className="px-3 py-3.5 text-center w-11 border-r border-[#F5E6BE] dark:border-white/[0.08]">
                          <input
                            type="checkbox"
                            checked={
                              paginatedRows.length > 0 &&
                              paginatedRows.every((r) => selectedRowIds.includes(r.rowId))
                            }
                            ref={(el) => {
                              if (el) {
                                const some =
                                  paginatedRows.some((r) =>
                                    selectedRowIds.includes(r.rowId)
                                  ) &&
                                  !paginatedRows.every((r) =>
                                    selectedRowIds.includes(r.rowId)
                                  );
                                el.indeterminate = some;
                              }
                            }}
                            onChange={handleToggleSelectAll}
                            className="h-4 w-4 rounded accent-[#B88728] dark:accent-[#F5C451] cursor-pointer"
                            title="Select all on page"
                          />
                        </th>
                      )}
                    </Fragment>
                  ))}
                  {!visibleCols.no && (
                    <th className="px-3 py-3.5 text-center w-11 border-r border-[#F5E6BE] dark:border-white/[0.08]">
                      <input
                        type="checkbox"
                        checked={
                          paginatedRows.length > 0 &&
                          paginatedRows.every((r) => selectedRowIds.includes(r.rowId))
                        }
                        onChange={handleToggleSelectAll}
                        className="h-4 w-4 rounded accent-[#B88728] dark:accent-[#F5C451] cursor-pointer"
                        title="Select all on page"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3.5 text-center w-16" />
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAE4D8]/80 dark:divide-white/[0.06] text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-rose-500 font-semibold"
                    >
                      Failed to load materials.
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                          <Layers className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                          No Materials Found
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          No materials or variants matched your search criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const rowNumber = (safePage - 1) * pageSize + idx + 1;
                    const gstVal =
                      row.gstRate !== undefined && row.gstRate !== null
                        ? `${row.gstRate}%`
                        : "--";

                    return (
                      <tr
                        key={row.rowId}
                        className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.025] transition-colors"
                      >
                        {orderedColumns.map((col) => {
                          const pinClass = getPinnedCellClass(pinnedCols[col.key]);
                          if (col.key === "no") {
                            return (
                              <Fragment key="no">
                                <td
                                  className={`px-4 py-3.5 text-center font-semibold text-slate-500 dark:text-slate-400 border-r border-[#EAE4D8]/80 dark:border-white/[0.06] ${pinClass}`}
                                >
                                  {rowNumber}
                                </td>
                                <td className="px-3 py-3.5 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                                  <input
                                    type="checkbox"
                                    checked={selectedRowIds.includes(row.rowId)}
                                    onChange={() => handleToggleSelectRow(row.rowId)}
                                    className="h-4 w-4 rounded accent-[#B88728] dark:accent-[#F5C451] cursor-pointer"
                                  />
                                </td>
                              </Fragment>
                            );
                          }
                          if (col.key === "sku") {
                            return (
                              <td
                                key="sku"
                                className={`px-4 py-3.5 border-r border-[#EAE4D8]/80 dark:border-white/[0.06] ${pinClass}`}
                              >
                                <div className="flex items-center gap-3">
                                  <MaterialThumbnail
                                    variantDirectUrl={toFullImageUrl(
                                      row.variant?.imageUrl || row.variant?.imgfileurl
                                    )}
                                    materialFallbackUrl={toFullImageUrl(
                                      row.material.imageUrl || row.material.imgfileurl
                                    )}
                                    masterSku={row.material.masterSku || row.material.sku}
                                    variantSku={row.sku}
                                    color={row.color}
                                    isVariant={row.rowType === "variant"}
                                    alt={row.sku}
                                  />

                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-slate-500 dark:text-slate-400">
                                      SKU.
                                    </span>
                                    {row.sku ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          row.variant
                                            ? router.push(
                                              `/dashboard/settings/manage-material/material-profile/edit-material-varient/${row.variant.id}?from=master-material-profile`
                                            )
                                            : router.push(
                                              `/dashboard/settings/manage-material/material-profile/edit/${row.material.id}`
                                            )
                                        }
                                        className="font-bold text-[#0A0E1A] dark:text-white truncate hover:underline hover:text-[#B88728] dark:hover:text-[#F5C451] cursor-pointer text-left transition-colors"
                                        title={row.variant ? "Edit variant" : "Edit material"}
                                      >
                                        {row.sku}
                                      </button>
                                    ) : (
                                      <span className="font-bold text-[#0A0E1A] dark:text-white truncate">
                                        --
                                      </span>
                                    )}
                                    {row.sku && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopySku(row.sku)}
                                        title="Copy SKU"
                                        className="p-1 rounded-md text-slate-400 hover:text-[#B88728] dark:hover:text-[#F5C451] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer shrink-0 transition-colors"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          }
                          if (col.key === "category") {
                            return (
                              <td
                                key="category"
                                className={`px-4 py-3.5 font-semibold text-[#0A0E1A] dark:text-white border-r border-[#EAE4D8]/80 dark:border-white/[0.06] ${pinClass}`}
                              >
                                {row.category}
                              </td>
                            );
                          }
                          if (col.key === "hsn") {
                            return (
                              <td
                                key="hsn"
                                className={`px-4 py-3.5 font-mono font-semibold text-[#0A0E1A] dark:text-white border-r border-[#EAE4D8]/80 dark:border-white/[0.06] ${pinClass}`}
                              >
                                {row.hsnCode}
                              </td>
                            );
                          }
                          return (
                            <td
                              key="gst"
                              className={`px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 border-r border-[#EAE4D8]/80 dark:border-white/[0.06] ${pinClass}`}
                            >
                              {gstVal}
                            </td>
                          );
                        })}

                        {!visibleCols.no && (
                          <td className="px-3 py-3.5 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.includes(row.rowId)}
                              onChange={() => handleToggleSelectRow(row.rowId)}
                              className="h-4 w-4 rounded accent-[#B88728] dark:accent-[#F5C451] cursor-pointer"
                            />
                          </td>
                        )}

                        <td className="px-4 py-3.5 text-center">
                          <ActionMenu
                            items={[
                              {
                                label: "Edit",
                                icon: Pencil,
                                onClick: () =>
                                  row.variant
                                    ? router.push(
                                      `/dashboard/settings/manage-material/material-profile/edit-material-varient/${row.variant.id}?from=master-material-profile`
                                    )
                                    : router.push(
                                      `/dashboard/settings/manage-material/material-profile/edit/${row.material.id}`
                                    ),
                              },
                              {
                                label: "Set Sales Rate",
                                icon: DollarSign,
                                onClick: () => { },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRows.length > 0 && (
            <div className="shrink-0">
              <Pagination
                page={safePage}
                limit={pageSize}
                total={filteredRows.length}
                totalPages={totalPages}
                variant="theme"
                className="px-4 sm:px-6 py-3.5 border-t border-[#EAE4D8] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11] rounded-b-3xl"
                onPageChange={setCurrentPage}
                onLimitChange={(limit) => {
                  setPageSize(limit);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
