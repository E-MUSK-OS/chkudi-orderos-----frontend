"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import {
  Search,
  RotateCw,
  MousePointerClick,
  IndianRupee,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Package,
  MoreHorizontal,
  Download,
  Check,
  Printer,
  Menu,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import DashboardLayout from "../../layout/DashboardLayout";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { productService } from "../../Products/ManageProducts/services/product.service";
import { useDropdownOptions } from "../../Products/ManageProducts/hooks/useDropdownOptions";
import {
  productCategoryOptions,
  sortSizes,
} from "../../Products/ManageProducts/constants/product.constants";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";
import {
  getColorValue,
  getDefinedSizes,
  getSizeValue,
  toFullImageUrl,
} from "../../Products/ManageProducts/utils/productVariant.utils";
import type { Product } from "../../Products/ManageProducts/types/product.types";
import { challanService } from "../SalesChallan/services/challan.service";
import type { Party } from "../SalesChallan/types/challan.types";
import { companyService } from "../../Settings/ManageCompany/CompanyProfile/services/company.service";
import GallerySalesReportModal from "./components/GallerySalesReportModal";
import GalleryCollectionReportModal from "./components/GalleryCollectionReportModal";

import GalleryProductCard from "./components/GalleryProductCard";
import GalleryCartSidebar from "./components/GalleryCartSidebar";
import GallerySelectedProductsSidebar, {
  type ReviseRateTarget,
} from "./components/GallerySelectedProductsSidebar";
import GalleryPriceRangePopover from "./components/GalleryPriceRangePopover";
import GalleryPrintPreviewModal from "./components/GalleryPrintPreviewModal";
import GalleryCheckoutModal from "./components/GalleryCheckoutModal";
import GalleryAddPartyModal from "./components/GalleryAddPartyModal";
import type {
  GalleryCart,
  GalleryColorCardItem,
  GalleryDisplayOptions,
  GalleryProductVariant,
  GallerySizeVariant,
  PriceMode,
  StockFilterMode,
} from "./types/gallery.types";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("accessToken") ?? "";
}

const PAGE_SIZE = 30;

export default function ProductGalleryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filter & Toolbar State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("Public");
  const [sortBy, setSortBy] = useState("default");
  const [priceMode, setPriceMode] = useState<PriceMode>("DR");
  const [page, setPage] = useState(1);

  // Display Field Toggles (... menu)
  const [displayOptions, setDisplayOptions] = useState<GalleryDisplayOptions>({
    showCost: false,
    showDealerRate: true,
    showStock: true,
    showReorderStock: false,
  });

  // Extra Filters (... menu)
  const [stockFilter, setStockFilter] = useState<StockFilterMode>("all");
  const [noRackOnly, setNoRackOnly] = useState(false);
  const [showInactiveSkus, setShowInactiveSkus] = useState(false);

  // Price Range Popover State (img-1)
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [customPriceRange, setCustomPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const pricePopoverRef = useRef<HTMLDivElement | null>(null);

  // Selection Mode & Right Selected Products Panel State (img-2)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [revisedPriceInputs, setRevisedPriceInputs] = useState<
    Record<string, string>
  >({});
  const [rateTarget, setRateTarget] = useState<ReviseRateTarget>("DR");
  const [updatingPrices, setUpdatingPrices] = useState(false);

  // More Options (...) Popover & Print Preview Modal (img-3)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printItemsOverride, setPrintItemsOverride] = useState<
    GalleryColorCardItem[] | null
  >(null);

  // Top-Right Reports Menu (Sales Report & Collection Report)
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);
  const reportsMenuRef = useRef<HTMLDivElement | null>(null);
  const [salesReportOpen, setSalesReportOpen] = useState(false);
  const [collectionReportOpen, setCollectionReportOpen] = useState(false);

  useEffect(() => {
    if (!reportsMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (reportsMenuRef.current && !reportsMenuRef.current.contains(e.target as Node)) {
        setReportsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [reportsMenuOpen]);

  // Cart & UI Panels State
  const [carts, setCarts] = useState<GalleryCart[]>([
    { id: "cart-1", name: "Cart", party: null, items: [] },
  ]);
  const [activeCartId, setActiveCartId] = useState("cart-1");
  const [showCartSidebar, setShowCartSidebar] = useState(true);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [previewCard, setPreviewCard] = useState<GalleryColorCardItem | null>(
    null
  );
  const [previewAngleIndex, setPreviewAngleIndex] = useState(0);
  const [downloadingImg, setDownloadingImg] = useState(false);

  // Fetch all angle images for the active preview card
  const { data: previewImagesResponse } = useQuery<{
    success: boolean;
    data: Record<string, string>;
    gallery?: Record<
      string,
      Array<{ url: string; fileName: string; angle: string }>
    >;
  }>({
    queryKey: ["product-images", previewCard?.masterSku],
    queryFn: () =>
      previewCard?.masterSku
        ? productService.getProductImages(previewCard.masterSku, getToken())
        : Promise.resolve({ success: true, data: {}, gallery: {} }),
    enabled: !!previewCard?.masterSku,
    staleTime: 1000 * 60 * 5,
  });

  const previewAngles = useMemo(() => {
    if (!previewCard) return [];
    const colorKey = previewCard.color;
    const galleryItems =
      previewImagesResponse?.gallery?.[colorKey] ||
      Object.entries(previewImagesResponse?.gallery || {}).find(
        ([c]) => c.toLowerCase() === colorKey.toLowerCase()
      )?.[1];

    if (galleryItems && galleryItems.length > 0) {
      return galleryItems.map((item) => ({
        url: toFullImageUrl(item.url),
        fileName: item.fileName,
        angle: item.angle,
      }));
    }

    if (previewCard.imageUrl) {
      return [
        {
          url: previewCard.imageUrl,
          fileName: "Main",
          angle: "1",
        },
      ];
    }
    return [];
  }, [previewCard, previewImagesResponse]);

  const currentPreviewAngleUrl =
    previewAngles[previewAngleIndex]?.url || previewCard?.imageUrl;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        moreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target)
      ) {
        setMoreMenuOpen(false);
      }
      if (
        pricePopoverOpen &&
        pricePopoverRef.current &&
        !pricePopoverRef.current.contains(target)
      ) {
        setPricePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [moreMenuOpen, pricePopoverOpen]);

  // Data Fetching
  const {
    data: productsResponse,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt: galleryUpdatedAt,
  } = useQuery({
    queryKey: ["product-gallery"],
    queryFn: () => productService.getGallery(getToken()),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: ["gallery-parties"],
    queryFn: () => challanService.getParties(""),
    staleTime: 1000 * 60 * 5,
  });

  const { data: companiesResponse } = useQuery({
    queryKey: ["gallery-companies"],
    queryFn: () => companyService.getCompanies({ pageSize: 5 }),
    staleTime: 1000 * 60 * 10,
  });

  const activeCompany = companiesResponse?.data?.[0];
  const companyName =
    activeCompany?.companyName ||
    activeCompany?.brandName ||
    activeCompany?.legalName ||
    "PRODUCT GALLERY";
  const companyPhone =
    activeCompany?.phone || activeCompany?.billingContactNo || "";

  const products: Product[] = useMemo(
    () => productsResponse?.data ?? [],
    [productsResponse]
  );

  // Category Options (clothing & all categories)
  const categoryOptions = useMemo(
    () => [
      { label: "All Categories", value: "" },
      ...buildMergedOptions(
        "category",
        productCategoryOptions,
        dropdownData?.savedOptions,
        dropdownData?.distinctFromProducts?.categories
      ),
    ],
    [dropdownData]
  );

  const availabilityOptions = [
    { label: "Public", value: "Public" },
    { label: "Private", value: "Private" },
    { label: "Semi-Private", value: "Semi-Private" },
  ];

  const sortOptions = [
    { label: "Sort", value: "default" },
    { label: "Date: Newest", value: "date-desc" },
    { label: "Date: Oldest", value: "date-asc" },
    { label: "Name: A to Z", value: "name-asc" },
    { label: "Name: Z to A", value: "name-desc" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
  ];

  // Expand Products -> Color Cards with Variant Sizes, Stock, Cost, Reorder Level & Rack Info
  const allColorCards = useMemo(() => {
    const cards: GalleryColorCardItem[] = [];

    for (const product of products) {
      if (!product.isActive && !showInactiveSkus) continue;

      const prodAvailability = (product.availability || "Public").trim();
      const variants: GalleryProductVariant[] = Array.isArray(product.variants)
        ? (product.variants as GalleryProductVariant[])
        : [];

      const retailRate = Number(product.retailRate) || 0;
      const dealerRate = Number(product.dealerRate) || 0;
      const baseCost = Number(product.productCost) || 0;
      const baseReorder = Number(product.reorderLevelStock) || 0;
      const definedSizes = getDefinedSizes(
        product,
        product.attributes || [],
        variants
      );

      if (variants.length === 0) {
        const prodColors =
          Array.isArray(product.colors) && product.colors.length > 0
            ? product.colors
            : ["Standard"];

        for (const col of prodColors) {
          const cleanCol = col.trim() || "Standard";
          const cardSku =
            cleanCol !== "Standard" && product.masterSku
              ? `${product.masterSku}-${cleanCol}`
              : product.masterSku || product.productName;

          const rawFallbackImg =
            (product.masterSku
              ? toFullImageUrl(
                  `/products/image?masterSku=${encodeURIComponent(
                    product.masterSku
                  )}&color=${encodeURIComponent(cleanCol)}`
                )
              : undefined) ||
            (cleanCol === "Standard" ? toFullImageUrl(product.imageUrl) : undefined);
          const fallbackImg =
            rawFallbackImg &&
            galleryUpdatedAt &&
            rawFallbackImg.includes("/products/image") &&
            !rawFallbackImg.includes("&t=") &&
            !rawFallbackImg.includes("?t=")
              ? `${rawFallbackImg}${rawFallbackImg.includes("?") ? "&" : "?"}t=${galleryUpdatedAt}`
              : rawFallbackImg;

          cards.push({
            cardId: `${product.id}__${cleanCol}`,
            productId: product.id,
            productName: product.productName,
            masterSku: product.masterSku,
            cardSku,
            category: product.category || "Uncategorized",
            subCategory: (product.subCategory || "").trim(),
            availability: prodAvailability,
            color: cleanCol,
            imageUrl: fallbackImg,
            retailRate,
            dealerRate,
            cost: baseCost,
            mrp: Number(product.mrp) || 0,
            totalPcs: Number(product.openingStock) || 0,
            reorderLevel: baseReorder,
            rackAddress: (product.rackAddress || "").trim(),
            isActive: Boolean(product.isActive),
            primaryVariantId: "",
            sizes: [],
            createdAt: product.createdAt,
          });
        }
        continue;
      }

      // Group variants by Color
      const colorMap = new Map<string, GalleryProductVariant[]>();
      for (const v of variants) {
        if (v.isActive === false && !showInactiveSkus) continue;
        const col = getColorValue(v, product) || "Standard";
        const existingKey = Array.from(colorMap.keys()).find(
          (k) => k.toLowerCase() === col.toLowerCase()
        );
        const key = existingKey || col;
        if (!colorMap.has(key)) colorMap.set(key, []);
        colorMap.get(key)!.push(v);
      }

      for (const [colorName, groupVariants] of colorMap.entries()) {
        const sortedGroup = [...groupVariants].sort((a, b) => {
          const sa = getSizeValue(a, product) || "";
          const sb = getSizeValue(b, product) || "";
          const order = sortSizes([sa, sb], definedSizes);
          if (sa === sb) return 0;
          return order[0] === sa ? -1 : 1;
        });

        let totalPcs = 0;
        let groupReorder = baseReorder;
        const sizeEntries: GallerySizeVariant[] = sortedGroup.map((v) => {
          const invList = v.inventories || [];
          const stock = invList.reduce(
            (sum, inv) => sum + Math.max(0, Number(inv.availableStock) || 0),
            0
          );
          if (invList.length > 0 && invList[0].reorderLevel !== undefined) {
            groupReorder = Number(invList[0].reorderLevel) || groupReorder;
          }
          totalPcs += stock;
          const sz = getSizeValue(v, product) || "Free";
          return {
            variantId: v.id,
            variantSku: v.variantSku,
            size: sz,
            color: colorName,
            availableStock: stock,
            retailRate: retailRate > 0 ? retailRate : Number(v.mrp) || 0,
            dealerRate: dealerRate > 0 ? dealerRate : Number(v.cost) || 0,
            mrp: Number(v.mrp) || Number(product.mrp) || 0,
            isActive: v.isActive !== false,
          };
        });

        const firstWithImage = sortedGroup.find((v) => Boolean(v.imageUrl));
        const rawImgUrl =
          toFullImageUrl(firstWithImage?.imageUrl) ||
          (product.masterSku
            ? toFullImageUrl(
                `/products/image?masterSku=${encodeURIComponent(
                  product.masterSku
                )}&color=${encodeURIComponent(colorName)}`
              )
            : undefined) ||
          (colorName === "Standard" ? toFullImageUrl(product.imageUrl) : undefined);
        const imgUrl =
          rawImgUrl &&
          galleryUpdatedAt &&
          rawImgUrl.includes("/products/image") &&
          !rawImgUrl.includes("&t=") &&
          !rawImgUrl.includes("?t=")
            ? `${rawImgUrl}${rawImgUrl.includes("?") ? "&" : "?"}t=${galleryUpdatedAt}`
            : rawImgUrl;

        const cardSku =
          colorName !== "Standard" && product.masterSku
            ? `${product.masterSku}-${colorName}`
            : sortedGroup[0]?.variantSku || product.masterSku;

        const firstCost = Number(sortedGroup[0]?.cost) || baseCost;
        const rackAddr = (
          sortedGroup.find((v) => v.rackAddress?.trim())?.rackAddress ||
          product.rackAddress ||
          ""
        ).trim();
        const cardActive =
          Boolean(product.isActive) &&
          sortedGroup.some((v) => v.isActive !== false);

        cards.push({
          cardId: `${product.id}__${colorName}`,
          productId: product.id,
          productName: product.productName,
          masterSku: product.masterSku,
          cardSku,
          category: product.category || "Uncategorized",
          subCategory: (product.subCategory || "").trim(),
          availability: prodAvailability,
          color: colorName,
          imageUrl: imgUrl,
          retailRate,
          dealerRate,
          cost: firstCost,
          mrp: Number(product.mrp) || 0,
          totalPcs,
          reorderLevel: groupReorder,
          rackAddress: rackAddr,
          isActive: cardActive,
          primaryVariantId: sortedGroup[0]?.id || "",
          sizes: sizeEntries,
          createdAt: product.createdAt,
        });
      }
    }

    return cards;
  }, [products, showInactiveSkus, galleryUpdatedAt]);

  // Dynamic Price Range Bounds across cards
  const { minPriceBound, maxPriceBound, cardPricesList } = useMemo(() => {
    const prices = allColorCards.map((c) =>
      priceMode === "RR" ? c.retailRate : c.dealerRate
    );
    if (prices.length === 0) {
      return { minPriceBound: 0, maxPriceBound: 0, cardPricesList: [0] };
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
      minPriceBound: min,
      maxPriceBound: max,
      cardPricesList: prices,
    };
  }, [allColorCards, priceMode]);

  const effectiveRangeMin = customPriceRange
    ? customPriceRange.min
    : minPriceBound;
  const effectiveRangeMax = customPriceRange
    ? customPriceRange.max
    : maxPriceBound;
  const isPriceRangeActive = Boolean(
    customPriceRange &&
      (customPriceRange.min > minPriceBound ||
        customPriceRange.max < maxPriceBound)
  );

  // Filtered & Sorted Cards
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matched = allColorCards.filter((card) => {
      const matchesAvail =
        availability === "All" ||
        card.availability.toLowerCase() === availability.toLowerCase();
      if (!matchesAvail) return false;

      const matchesCategory =
        !category || card.category.toLowerCase() === category.toLowerCase();
      if (!matchesCategory) return false;

      if (stockFilter === "in-stock" && card.totalPcs <= 0) return false;
      if (stockFilter === "out-of-stock" && card.totalPcs > 0) return false;

      if (noRackOnly && Boolean(card.rackAddress)) return false;

      if (isPriceRangeActive) {
        const cardRate = priceMode === "RR" ? card.retailRate : card.dealerRate;
        if (cardRate < effectiveRangeMin || cardRate > effectiveRangeMax) {
          return false;
        }
      }

      if (q) {
        const inSku = card.cardSku.toLowerCase().includes(q);
        const inName = card.productName.toLowerCase().includes(q);
        const inMaster = card.masterSku.toLowerCase().includes(q);
        const inColor = card.color.toLowerCase().includes(q);
        const inVariantSkus = card.sizes.some((s) =>
          s.variantSku.toLowerCase().includes(q)
        );
        if (!inSku && !inName && !inMaster && !inColor && !inVariantSkus) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...matched];
    if (sortBy === "date-desc") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    } else if (sortBy === "date-asc") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    } else if (sortBy === "name-asc") {
      sorted.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === "name-desc") {
      sorted.sort((a, b) => b.productName.localeCompare(a.productName));
    } else if (sortBy === "price-asc") {
      sorted.sort((a, b) => {
        const pa = priceMode === "RR" ? a.retailRate : a.dealerRate;
        const pb = priceMode === "RR" ? b.retailRate : b.dealerRate;
        return pa - pb;
      });
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => {
        const pa = priceMode === "RR" ? a.retailRate : a.dealerRate;
        const pb = priceMode === "RR" ? b.retailRate : b.dealerRate;
        return pb - pa;
      });
    }

    return sorted;
  }, [
    allColorCards,
    search,
    category,
    availability,
    stockFilter,
    noRackOnly,
    isPriceRangeActive,
    priceMode,
    effectiveRangeMin,
    effectiveRangeMax,
    sortBy,
  ]);

  const filteredProductCount = useMemo(() => {
    const ids = new Set(filteredCards.map((c) => c.productId));
    return ids.size;
  }, [filteredCards]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedCards = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCards.slice(start, start + PAGE_SIZE);
  }, [filteredCards, safePage]);

  const selectedCards = useMemo(
    () => allColorCards.filter((c) => selectedCardIds.includes(c.cardId)),
    [allColorCards, selectedCardIds]
  );

  // Active Cart Helpers
  const activeCart = carts.find((c) => c.id === activeCartId) || carts[0];

  const updateActiveCart = (updater: (cart: GalleryCart) => GalleryCart) => {
    setCarts((prev) =>
      prev.map((c) => (c.id === activeCart.id ? updater(c) : c))
    );
  };

  // Navigate to Edit Product Variant Page when clicking SKU (supporting multi-size editing for a color)
  const handleOpenVariantEdit = (
    variantId: string,
    color?: string,
    productId?: string
  ) => {
    if (!variantId && !productId) {
      toast.info("No individual variant found for this item yet.");
      return;
    }
    const query = new URLSearchParams();
    query.set("from", "product-gallery");
    if (productId) query.set("productId", productId);
    if (color) {
      query.set("color", color);
      query.set("mode", "color");
    }
    router.push(
      `/dashboard/settings/manage-product/product-profile/edit-product-varient/${
        variantId || "new"
      }?${query.toString()}`
    );
  };

  // Add All In-Stock Sizes of a Card to Active Cart (BLOCKED when pcs === 0)
  const handleAddAllToCart = (card: GalleryColorCardItem) => {
    if (card.totalPcs <= 0) {
      toast.error(`Cannot add "${card.cardSku}" to cart — 0 pcs in stock.`);
      return;
    }

    const inStockSizes = card.sizes.filter((s) => s.availableStock > 0);
    if (inStockSizes.length === 0) {
      toast.error(`Cannot add "${card.cardSku}" to cart — 0 pcs available.`);
      return;
    }

    let addedCount = 0;

    updateActiveCart((cart) => {
      const nextItems = [...cart.items];

      for (const sv of inStockSizes) {
        const rate = priceMode === "RR" ? sv.retailRate : sv.dealerRate;
        const idx = nextItems.findIndex((i) => i.variantId === sv.variantId);
        if (idx !== -1) {
          if (nextItems[idx].quantity < sv.availableStock) {
            nextItems[idx] = {
              ...nextItems[idx],
              quantity: nextItems[idx].quantity + 1,
            };
            addedCount++;
          }
        } else {
          nextItems.push({
            variantId: sv.variantId,
            productId: card.productId,
            variantSku: sv.variantSku,
            productName: card.productName,
            color: card.color,
            size: sv.size,
            quantity: 1,
            rate,
            retailRate: sv.retailRate,
            dealerRate: sv.dealerRate,
            availableStock: sv.availableStock,
            imageUrl: card.imageUrl,
          });
          addedCount++;
        }
      }

      return { ...cart, items: nextItems };
    });

    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} in-stock size(s) of ${card.cardSku} to cart.`
      );
    } else {
      toast.info(
        `Maximum available stock for ${card.cardSku} is already in cart.`
      );
    }
  };

  // Increment / Decrement Individual Size in Active Cart
  const handleUpdateSizeQty = (
    card: GalleryColorCardItem,
    sv: GallerySizeVariant,
    delta: number
  ) => {
    if (delta > 0 && sv.availableStock <= 0) {
      toast.error(`Size "${sv.size}" has 0 pcs in stock.`);
      return;
    }

    updateActiveCart((cart) => {
      const nextItems = [...cart.items];
      const idx = nextItems.findIndex((i) => i.variantId === sv.variantId);

      if (idx === -1) {
        if (delta > 0 && sv.availableStock > 0) {
          const rate = priceMode === "RR" ? sv.retailRate : sv.dealerRate;
          nextItems.push({
            variantId: sv.variantId,
            productId: card.productId,
            variantSku: sv.variantSku,
            productName: card.productName,
            color: card.color,
            size: sv.size,
            quantity: 1,
            rate,
            retailRate: sv.retailRate,
            dealerRate: sv.dealerRate,
            availableStock: sv.availableStock,
            imageUrl: card.imageUrl,
          });
        }
      } else {
        const nextQty = nextItems[idx].quantity + delta;
        if (nextQty <= 0) {
          nextItems.splice(idx, 1);
        } else if (nextQty <= sv.availableStock) {
          nextItems[idx] = { ...nextItems[idx], quantity: nextQty };
        } else {
          toast.info(
            `Only ${sv.availableStock} pcs available for ${sv.variantSku}.`
          );
        }
      }

      return { ...cart, items: nextItems };
    });
  };

  // Scan SKU into Active Cart
  const handleScanSku = (rawQuery: string): boolean => {
    const clean = rawQuery.trim().toLowerCase();
    for (const card of allColorCards) {
      for (const sv of card.sizes) {
        if (sv.variantSku.toLowerCase() === clean) {
          if (sv.availableStock <= 0) {
            toast.error(`"${sv.variantSku}" has 0 pcs in stock.`);
            return false;
          }
          handleUpdateSizeQty(card, sv, 1);
          toast.success(`Scanned ${sv.variantSku} into ${activeCart.name}`);
          return true;
        }
      }
    }
    toast.error(`SKU "${rawQuery}" not found in active products.`);
    return false;
  };

  // Switch Price Mode (DR <-> RR) and sync active cart item rates
  const handlePriceModeChange = (nextMode: PriceMode) => {
    if (nextMode === priceMode) return;
    setPriceMode(nextMode);
    setCarts((prev) =>
      prev.map((cart) => ({
        ...cart,
        items: cart.items.map((item) => ({
          ...item,
          rate: nextMode === "RR" ? item.retailRate : item.dealerRate,
        })),
      }))
    );
    toast.info(
      `Cart rate switched to ${
        nextMode === "RR" ? "Retail Rate (RR)" : "Dealer Rate (DR)"
      }`
    );
  };

  // Toggle card selection (Selection Mode matching img-2)
  const handleToggleCardSelect = (card: GalleryColorCardItem) => {
    setSelectedCardIds((prev) =>
      prev.includes(card.cardId)
        ? prev.filter((id) => id !== card.cardId)
        : [...prev, card.cardId]
    );
  };

  // Update revised prices from Selected Products Sidebar (img-2 Update button)
  const handleUpdateSelectedPrices = async () => {
    if (selectedCards.length === 0) {
      toast.error("Please select at least one product first.");
      return;
    }

    const byProduct = new Map<
      string,
      { productId: string; retailRate?: number; dealerRate?: number }
    >();

    for (const card of selectedCards) {
      if (byProduct.has(card.productId)) continue;
      const rawVal = revisedPriceInputs[card.productId];
      const baseRate = rateTarget === "RR" ? card.retailRate : card.dealerRate;
      const numeric =
        rawVal !== undefined && rawVal !== ""
          ? Math.max(0, Number(rawVal) || 0)
          : baseRate;

      const entry: {
        productId: string;
        retailRate?: number;
        dealerRate?: number;
      } = { productId: card.productId };

      if (rateTarget === "RR") {
        entry.retailRate = numeric;
      } else if (rateTarget === "DR") {
        entry.dealerRate = numeric;
      } else {
        entry.retailRate = numeric;
        entry.dealerRate = numeric;
      }

      byProduct.set(card.productId, entry);
    }

    const items = Array.from(byProduct.values());

    try {
      setUpdatingPrices(true);
      const res = await productService.revisePrices(items, getToken());
      toast.success(res.message || "Revised product prices updated!");

      setCarts((prev) =>
        prev.map((cart) => ({
          ...cart,
          items: cart.items.map((ci) => {
            const updated = byProduct.get(ci.productId);
            if (!updated) return ci;
            const nextRr = updated.retailRate ?? ci.retailRate;
            const nextDr = updated.dealerRate ?? ci.dealerRate;
            return {
              ...ci,
              retailRate: nextRr,
              dealerRate: nextDr,
              rate: priceMode === "RR" ? nextRr : nextDr,
            };
          }),
        }))
      );

      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update revised prices.";
      toast.error(msg);
    } finally {
      setUpdatingPrices(false);
    }
  };

  // Cart Tab Management
  const handleAddCartTab = () => {
    const num = carts.length + 1;
    const id = `cart-${Date.now()}`;
    setCarts((prev) => [
      ...prev,
      { id, name: `Cart ${num}`, party: null, items: [] },
    ]);
    setActiveCartId(id);
  };

  const handleRemoveCartTab = (id: string) => {
    if (carts.length <= 1) return;
    const remaining = carts.filter((c) => c.id !== id);
    setCarts(remaining);
    if (activeCartId === id) {
      setActiveCartId(remaining[0].id);
    }
  };

  const handleCheckoutClick = () => {
    if (!activeCart || activeCart.items.length === 0) {
      toast.error("Please add at least one item to your cart.");
      return;
    }
    if (!activeCart.party) {
      toast.error("Please select a Party before checkout.");
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmCheckout = async ({
    challanNo,
    challanDate,
    challanRefNo,
    challanFor,
    stockOutFrom,
    openInvoice,
  }: {
    challanNo: string;
    challanDate: string;
    challanRefNo: string;
    challanFor: string;
    stockOutFrom: string;
    openInvoice: boolean;
  }) => {
    if (!activeCart?.party) return;

    try {
      setSubmittingCheckout(true);
      const payload = {
        partyId: activeCart.party.id,
        partyName: activeCart.party.partyName,
        contactNo: activeCart.party.phone || activeCart.party.whatsapp || null,
        challanNo,
        challanRefNo: challanRefNo || null,
        challanDate,
        challanFor,
        stockOutFrom,
        consigneeName: "Not Applicable",
        deliveryBy: "Buyer",
        preparedBy: "",
        deliveryTerms: "",
        items: activeCart.items.map((item, idx) => ({
          itemNo: idx + 1,
          sku: item.variantSku,
          name: item.productName || item.variantSku,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          dispatchDate: "1",
          subCn: "",
          remarks: [item.color, item.size].filter(Boolean).join(" / "),
          printBarcode: true,
        })),
      };

      const res = await challanService.createChallan(payload);
      toast.success(`Sales Challan ${res.data.challanNo} created!`);
      setCheckoutOpen(false);
      updateActiveCart((c) => ({ ...c, items: [], party: null }));
      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });

      if (openInvoice && res?.data?.id) {
        router.push(
          `/dashboard/offline-sales/sales-invoice?challanId=${res.data.id}`
        );
      } else {
        router.push("/dashboard/offline-sales/sales-challan");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create Sales Challan.";
      toast.error(msg);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleDownloadPreviewImage = async (
    card: GalleryColorCardItem,
    specificUrl?: string
  ) => {
    const targetUrl = specificUrl || card.imageUrl;
    if (!targetUrl) return;
    try {
      setDownloadingImg(true);
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error("Failed to download image");
      const blob = await res.blob();
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : "jpg";
      const angleSuffix =
        previewAngles.length > 1 ? `_${previewAngleIndex + 1}` : "";
      saveAs(blob, `${card.cardSku}${angleSuffix}.${ext}`);
      toast.success(`Downloaded ${card.cardSku}${angleSuffix}.${ext}`);
    } catch {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingImg(false);
    }
  };

  const totalCartPcs = activeCart
    ? activeCart.items.reduce((sum, i) => sum + i.quantity, 0)
    : 0;

  const hasActiveMoreFilters =
    displayOptions.showCost ||
    !displayOptions.showDealerRate ||
    !displayOptions.showStock ||
    displayOptions.showReorderStock ||
    stockFilter !== "all" ||
    noRackOnly ||
    showInactiveSkus;

  return (
    <DashboardLayout title="Product Gallery">
      <div className="space-y-4 sm:space-y-5 font-sans">
        {/* Top Header Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Product Gallery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage offline sales product gallery, filter & revise prices, print catalog, and build quick carts.
            </p>
          </div>

          {/* Top-Right Menu Icon -> Sales Report & Collection Report (img-1) */}
          <div className="relative shrink-0" ref={reportsMenuRef}>
            <button
              type="button"
              onClick={() => setReportsMenuOpen((p) => !p)}
              title="Reports"
              aria-label="Open Reports Menu"
              className={`h-9.5 w-9.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                reportsMenuOpen
                  ? "border-[#E8C16D] bg-[#FFF9EC] text-[#B88728] dark:border-[#F5C451] dark:bg-[#1A160E] dark:text-[#F5C451]"
                  : "border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#171A22] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D]"
              }`}
            >
              <Menu size={16} />
            </button>

            {reportsMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-1.5 shadow-2xl space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setReportsMenuOpen(false);
                    setSalesReportOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-left font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <ReceiptText size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                  <span>Sales Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportsMenuOpen(false);
                    setCollectionReportOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-left font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <Wallet size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                  <span>Collection Report</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Main Workspace Split: Gallery Grid (Left) + Right Panel (Selected Products / Carts / Slim Rail) */}
        <div
          className={`grid grid-cols-1 gap-3.5 items-stretch ${
            selectionMode || showCartSidebar
              ? "xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_350px]"
              : "xl:grid-cols-[1fr_54px]"
          }`}
        >
          {/* Left Main Content */}
          <div className="space-y-3.5 min-w-0">
            {/* Toolbar Bar matching img-1 & img-2 */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-2.5 sm:p-3 shadow-xs">
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[150px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search..."
                    className="w-full h-9.5 pl-8.5 pr-7 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <ThemeSelectDropdown
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    setPage(1);
                  }}
                  options={categoryOptions}
                  placeholder="Category"
                  className="w-[calc(50%-4px)] sm:w-36"
                  buttonClassName="w-full h-9.5 px-3 rounded-xl text-xs font-bold"
                  menuClassName="min-w-[220px]"
                />

                {/* Availability Dropdown */}
                <ThemeSelectDropdown
                  value={availability}
                  onChange={(val) => {
                    setAvailability(val);
                    setPage(1);
                  }}
                  options={availabilityOptions}
                  placeholder="Public"
                  className="w-[calc(50%-4px)] sm:w-28"
                  buttonClassName="w-full h-9.5 px-3 rounded-xl text-xs font-bold"
                />

                {/* Sort Dropdown */}
                <ThemeSelectDropdown
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val);
                    setPage(1);
                  }}
                  options={sortOptions}
                  placeholder="Sort"
                  className="w-[calc(50%-4px)] sm:w-32"
                  buttonClassName="w-full h-9.5 px-3 rounded-xl text-xs font-bold"
                  menuClassName="min-w-[200px]"
                />

                {/* Refresh & Count */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="Refresh Gallery"
                    className="h-9.5 w-9.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#F5C451] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw
                      size={14}
                      className={isFetching ? "animate-spin" : ""}
                    />
                  </button>

                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap px-1">
                    {filteredProductCount} products
                  </span>
                </div>

                {/* Right Utility Group matching img-1 & img-2: [Select Pointer] [₹ Price Range] [... Menu] + Mobile Icon */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  {/* Left button of Price: Selection Mode Toggle (img-2) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionMode((prev) => !prev);
                      setPricePopoverOpen(false);
                      setMoreMenuOpen(false);
                    }}
                    title="Select Products for Revised Prices or PDF"
                    aria-label="Select Products"
                    className={`relative h-9.5 w-9.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      selectionMode
                        ? "border-[#0A0E1A] bg-[#0A0E1A] text-white dark:border-white dark:bg-white dark:text-[#0A0E1A] shadow-xs"
                        : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#F5C451]"
                    }`}
                  >
                    <MousePointerClick size={15} />
                    {selectedCardIds.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[9px] font-black flex items-center justify-center">
                        {selectedCardIds.length}
                      </span>
                    )}
                  </button>

                  {/* ₹ Price Button -> Opens PRICE RANGE Popover (img-1) */}
                  <div className="relative" ref={pricePopoverRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setPricePopoverOpen((p) => !p);
                        setMoreMenuOpen(false);
                      }}
                      title="Filter by Price Range"
                      className={`h-9.5 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        pricePopoverOpen || isPriceRangeActive
                          ? "border-[#E8C16D] bg-[#FFF9EC] text-[#6A4D1D] dark:border-[#F5C451] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                          : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D]"
                      }`}
                    >
                      <IndianRupee
                        size={13}
                        className="text-[#B88728] dark:text-[#F5C451]"
                      />
                      <span>Price</span>
                      {isPriceRangeActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>

                    {pricePopoverOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50">
                        <GalleryPriceRangePopover
                          minBound={minPriceBound}
                          maxBound={maxPriceBound}
                          valueMin={effectiveRangeMin}
                          valueMax={effectiveRangeMax}
                          prices={cardPricesList}
                          onChange={(min, max) => {
                            setCustomPriceRange({ min, max });
                            setPage(1);
                          }}
                          onReset={() => {
                            setCustomPriceRange(null);
                            setPage(1);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* ... Dropdown Menu: Card UI Toggles + Filters + Print Gallery */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreMenuOpen((p) => !p);
                        setPricePopoverOpen(false);
                      }}
                      title="Display Options, Filters & Print Gallery"
                      className={`relative h-9.5 w-9.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        moreMenuOpen || hasActiveMoreFilters
                          ? "border-[#E8C16D] bg-[#FFF9EC] text-[#B88728] dark:border-[#F5C451] dark:bg-[#1A160E] dark:text-[#F5C451]"
                          : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D]"
                      }`}
                    >
                      <MoreHorizontal size={15} />
                      {hasActiveMoreFilters && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#B88728] dark:bg-[#F5C451]" />
                      )}
                    </button>

                    {moreMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-2 shadow-2xl space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Show / Hide on Cards
                        </p>

                        {/* Cost */}
                        <button
                          type="button"
                          onClick={() =>
                            setDisplayOptions((d) => ({
                              ...d,
                              showCost: !d.showCost,
                            }))
                          }
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Cost</span>
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center border ${
                              displayOptions.showCost
                                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                                : "border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {displayOptions.showCost && <Check size={11} strokeWidth={3} />}
                          </span>
                        </button>

                        {/* Dealer Rate */}
                        <button
                          type="button"
                          onClick={() =>
                            setDisplayOptions((d) => ({
                              ...d,
                              showDealerRate: !d.showDealerRate,
                            }))
                          }
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Dealer Rate</span>
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center border ${
                              displayOptions.showDealerRate
                                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                                : "border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {displayOptions.showDealerRate && (
                              <Check size={11} strokeWidth={3} />
                            )}
                          </span>
                        </button>

                        {/* Stock */}
                        <button
                          type="button"
                          onClick={() =>
                            setDisplayOptions((d) => ({
                              ...d,
                              showStock: !d.showStock,
                            }))
                          }
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Stock</span>
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center border ${
                              displayOptions.showStock
                                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                                : "border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {displayOptions.showStock && <Check size={11} strokeWidth={3} />}
                          </span>
                        </button>

                        {/* Reorder Level Stock */}
                        <button
                          type="button"
                          onClick={() =>
                            setDisplayOptions((d) => ({
                              ...d,
                              showReorderStock: !d.showReorderStock,
                            }))
                          }
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Reorder Level Stock</span>
                          <span
                            className={`h-4 w-4 rounded flex items-center justify-center border ${
                              displayOptions.showReorderStock
                                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                                : "border-slate-300 dark:border-white/20"
                            }`}
                          >
                            {displayOptions.showReorderStock && (
                              <Check size={11} strokeWidth={3} />
                            )}
                          </span>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />

                        <p className="px-2.5 pt-0.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Filters
                        </p>

                        {/* In Stock Only */}
                        <button
                          type="button"
                          onClick={() => {
                            setStockFilter((prev) =>
                              prev === "in-stock" ? "all" : "in-stock"
                            );
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>In Stock Only</span>
                          {stockFilter === "in-stock" && (
                            <Check size={14} className="text-emerald-500" />
                          )}
                        </button>

                        {/* Out of Stock */}
                        <button
                          type="button"
                          onClick={() => {
                            setStockFilter((prev) =>
                              prev === "out-of-stock" ? "all" : "out-of-stock"
                            );
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Out of Stock</span>
                          {stockFilter === "out-of-stock" && (
                            <Check size={14} className="text-rose-500" />
                          )}
                        </button>

                        {/* No Rack Assigned */}
                        <button
                          type="button"
                          onClick={() => {
                            setNoRackOnly((prev) => !prev);
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>No Rack Assigned</span>
                          {noRackOnly && (
                            <Check size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                          )}
                        </button>

                        {/* Inactive SKUs */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowInactiveSkus((prev) => !prev);
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <span>Inactive SKUs</span>
                          {showInactiveSkus && (
                            <Check size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                          )}
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />

                        {/* Print Gallery */}
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setPrintItemsOverride(null);
                            setPrintPreviewOpen(true);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2 text-left font-bold text-[#0A0E1A] dark:text-[#F5C451] bg-[#FFF9EC]/70 dark:bg-[#1A160E] hover:bg-[#FDF2D1] dark:hover:bg-[#262014] cursor-pointer transition-colors"
                        >
                          <Printer size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                          <span>Print Gallery</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile-only Cart / Selected Icon Button */}
                  <button
                    type="button"
                    onClick={() => setMobileCartOpen(true)}
                    title={selectionMode ? "Selected Products" : "Carts"}
                    aria-label="Carts"
                    className="xl:hidden relative h-9.5 w-9.5 rounded-xl border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#F5C451] flex items-center justify-center cursor-pointer"
                  >
                    <ShoppingCart size={16} />
                    {(selectionMode ? selectedCardIds.length : totalCartPcs) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[10px] font-black flex items-center justify-center shadow-2xs">
                        {selectionMode ? selectedCardIds.length : totalCartPcs}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Cards Grid (Smaller 5-column cards) */}
            {isLoading ? (
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${
                  !selectionMode && !showCartSidebar ? "2xl:grid-cols-6" : ""
                }`}
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-2 animate-pulse space-y-2.5"
                  >
                    <div className="aspect-[4/3.1] rounded-lg bg-slate-100 dark:bg-white/[0.04]" />
                    <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/[0.04]" />
                    <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-white/[0.04]" />
                    <div className="h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : paginatedCards.length === 0 ? (
              <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center space-y-2.5">
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]">
                  <Package size={24} />
                </div>
                <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                  No matching gallery items found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Try clearing filters or changing the search, category, price range, or availability filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setAvailability("Public");
                    setStockFilter("all");
                    setNoRackOnly(false);
                    setShowInactiveSkus(false);
                    setCustomPriceRange(null);
                    setPage(1);
                  }}
                  className="mt-2 h-9 px-4 rounded-xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A] cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${
                    !selectionMode && !showCartSidebar ? "2xl:grid-cols-6" : ""
                  }`}
                >
                  {paginatedCards.map((card) => (
                    <GalleryProductCard
                      key={card.cardId}
                      card={card}
                      priceMode={priceMode}
                      displayOptions={displayOptions}
                      selectionMode={selectionMode}
                      activeCartItems={activeCart?.items || []}
                      isSelected={selectedCardIds.includes(card.cardId)}
                      onToggleSelect={handleToggleCardSelect}
                      onOpenVariantEdit={handleOpenVariantEdit}
                      onAddAllToCart={handleAddAllToCart}
                      onUpdateSizeQty={handleUpdateSizeQty}
                      onPreviewImage={(c) => setPreviewCard(c)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 py-3 text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Showing{" "}
                      <strong className="text-[#0A0E1A] dark:text-white">
                        {(safePage - 1) * PAGE_SIZE + 1}–
                        {Math.min(safePage * PAGE_SIZE, filteredCards.length)}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-[#0A0E1A] dark:text-white">
                        {filteredCards.length}
                      </strong>{" "}
                      color variants
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                      >
                        <ChevronLeft size={14} />
                        <span>Prev</span>
                      </button>
                      <span className="px-2.5 font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {safePage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel: Selected Products (img-2) OR Carts Sidebar OR Slim Vertical Rail */}
          {selectionMode ? (
            <aside className="hidden xl:block h-full">
              <div className="sticky top-4 max-h-[calc(100vh-140px)] h-full">
              <GallerySelectedProductsSidebar
                selectedCards={selectedCards}
                revisedPriceInputs={revisedPriceInputs}
                rateTarget={rateTarget}
                onChangeRateTarget={setRateTarget}
                onChangeRevisedPrice={(productId, val) =>
                  setRevisedPriceInputs((prev) => ({
                    ...prev,
                    [productId]: val,
                  }))
                }
                onRemoveSelectedCard={(card) =>
                  setSelectedCardIds((prev) =>
                    prev.filter((id) => id !== card.cardId)
                  )
                }
                onClearAll={() => {
                  setSelectedCardIds([]);
                  setRevisedPriceInputs({});
                }}
                onCloseMode={() => setSelectionMode(false)}
                onUpdatePrices={handleUpdateSelectedPrices}
                onExportPdf={() => {
                  setPrintItemsOverride(selectedCards);
                  setPrintPreviewOpen(true);
                }}
                updating={updatingPrices}
              />
              </div>
            </aside>
          ) : showCartSidebar ? (
            <aside className="hidden xl:block h-full">
              <div className="sticky top-4 max-h-[calc(100vh-140px)] h-full">
              <GalleryCartSidebar
                carts={carts}
                activeCartId={activeCart?.id || "cart-1"}
                parties={parties}
                priceMode={priceMode}
                onChangePriceMode={handlePriceModeChange}
                onSelectCart={setActiveCartId}
                onAddCart={handleAddCartTab}
                onRemoveCart={handleRemoveCartTab}
                onSelectParty={(party) =>
                  updateActiveCart((c) => ({ ...c, party }))
                }
                onOpenAddParty={() => setAddPartyOpen(true)}
                onScanSku={handleScanSku}
                onUpdateItemQty={(variantId, delta) => {
                  updateActiveCart((cart) => {
                    const nextItems = [...cart.items];
                    const idx = nextItems.findIndex(
                      (i) => i.variantId === variantId
                    );
                    if (idx !== -1) {
                      const nextQty = nextItems[idx].quantity + delta;
                      if (nextQty <= 0) {
                        nextItems.splice(idx, 1);
                      } else if (nextQty <= nextItems[idx].availableStock) {
                        nextItems[idx] = { ...nextItems[idx], quantity: nextQty };
                      }
                    }
                    return { ...cart, items: nextItems };
                  });
                }}
                onUpdateItemRate={(variantId, rate) => {
                  updateActiveCart((cart) => ({
                    ...cart,
                    items: cart.items.map((i) =>
                      i.variantId === variantId ? { ...i, rate } : i
                    ),
                  }));
                }}
                onRemoveItem={(variantId) => {
                  updateActiveCart((cart) => ({
                    ...cart,
                    items: cart.items.filter((i) => i.variantId !== variantId),
                  }));
                }}
                onClearCart={() =>
                  updateActiveCart((cart) => ({ ...cart, items: [] }))
                }
                onCheckout={handleCheckoutClick}
                onOpenVariantEdit={handleOpenVariantEdit}
                onCollapse={() => setShowCartSidebar(false)}
              />
              </div>
            </aside>
          ) : (
            <aside className="hidden xl:block h-full">
              <div className="sticky top-4 max-h-[calc(100vh-140px)] h-full flex flex-col items-center rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCartSidebar(true)}
                title="Expand Carts Panel"
                aria-label="Expand Carts"
                className="w-full py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.03] flex flex-col items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer group shrink-0"
              >
                <div className="relative">
                  <ShoppingCart
                    size={17}
                    className="group-hover:text-[#B88728] dark:group-hover:text-[#F5C451] transition-colors"
                  />
                  {totalCartPcs > 0 && (
                    <span className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[9px] font-black flex items-center justify-center">
                      {totalCartPcs}
                    </span>
                  )}
                </div>
                <ChevronLeft
                  size={12}
                  className="text-slate-400 group-hover:text-[#B88728] dark:group-hover:text-[#F5C451] transition-colors"
                />
              </button>

              {/* Vertical Cart Tab Pills */}
              <div className="flex-1 w-full py-3 flex flex-col items-center gap-2.5 overflow-y-auto">
                {carts.map((cartTab) => {
                  const isActiveCart = cartTab.id === (activeCart?.id || carts[0]?.id);
                  const cartPcs = cartTab.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <div key={cartTab.id} className="relative w-full flex items-center justify-center">
                      {isActiveCart && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#0A0E1A] dark:bg-white" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCartId(cartTab.id);
                          setShowCartSidebar(true);
                        }}
                        title={`${cartTab.name}${cartTab.party ? ` • ${cartTab.party.partyName}` : ""}`}
                        aria-label={`Open ${cartTab.name}`}
                        className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isActiveCart
                            ? "bg-[#0A0E1A] text-white dark:bg-slate-100 dark:text-[#0A0E1A] shadow-sm"
                            : "border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D]"
                        }`}
                      >
                        <ShoppingCart size={15} />
                        {cartPcs > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[9px] font-black flex items-center justify-center">
                            {cartPcs}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Selected Products or Carts) */}
      {mobileCartOpen && (
        <div
          className="fixed inset-0 z-50 xl:hidden flex justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            className="w-full max-w-sm h-full p-3 bg-slate-50 dark:bg-[#080B11]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectionMode ? (
              <GallerySelectedProductsSidebar
                selectedCards={selectedCards}
                revisedPriceInputs={revisedPriceInputs}
                rateTarget={rateTarget}
                onChangeRateTarget={setRateTarget}
                onChangeRevisedPrice={(productId, val) =>
                  setRevisedPriceInputs((prev) => ({
                    ...prev,
                    [productId]: val,
                  }))
                }
                onRemoveSelectedCard={(card) =>
                  setSelectedCardIds((prev) =>
                    prev.filter((id) => id !== card.cardId)
                  )
                }
                onClearAll={() => {
                  setSelectedCardIds([]);
                  setRevisedPriceInputs({});
                }}
                onCloseMode={() => {
                  setSelectionMode(false);
                  setMobileCartOpen(false);
                }}
                onUpdatePrices={handleUpdateSelectedPrices}
                onExportPdf={() => {
                  setMobileCartOpen(false);
                  setPrintItemsOverride(selectedCards);
                  setPrintPreviewOpen(true);
                }}
                updating={updatingPrices}
              />
            ) : (
              <GalleryCartSidebar
                carts={carts}
                activeCartId={activeCart?.id || "cart-1"}
                parties={parties}
                priceMode={priceMode}
                onChangePriceMode={handlePriceModeChange}
                onSelectCart={setActiveCartId}
                onAddCart={handleAddCartTab}
                onRemoveCart={handleRemoveCartTab}
                onSelectParty={(party) =>
                  updateActiveCart((c) => ({ ...c, party }))
                }
                onOpenAddParty={() => setAddPartyOpen(true)}
                onScanSku={handleScanSku}
                onUpdateItemQty={(variantId, delta) => {
                  updateActiveCart((cart) => {
                    const nextItems = [...cart.items];
                    const idx = nextItems.findIndex(
                      (i) => i.variantId === variantId
                    );
                    if (idx !== -1) {
                      const nextQty = nextItems[idx].quantity + delta;
                      if (nextQty <= 0) {
                        nextItems.splice(idx, 1);
                      } else if (nextQty <= nextItems[idx].availableStock) {
                        nextItems[idx] = { ...nextItems[idx], quantity: nextQty };
                      }
                    }
                    return { ...cart, items: nextItems };
                  });
                }}
                onUpdateItemRate={(variantId, rate) => {
                  updateActiveCart((cart) => ({
                    ...cart,
                    items: cart.items.map((i) =>
                      i.variantId === variantId ? { ...i, rate } : i
                    ),
                  }));
                }}
                onRemoveItem={(variantId) => {
                  updateActiveCart((cart) => ({
                    ...cart,
                    items: cart.items.filter((i) => i.variantId !== variantId),
                  }));
                }}
                onClearCart={() =>
                  updateActiveCart((cart) => ({ ...cart, items: [] }))
                }
                onCheckout={() => {
                  setMobileCartOpen(false);
                  handleCheckoutClick();
                }}
                onOpenVariantEdit={handleOpenVariantEdit}
                onCollapse={() => setMobileCartOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal: Image + Variant SKU below + Download Icon + Edit Variant + Cancel Icon */}
      {previewCard && (currentPreviewAngleUrl || previewCard.imageUrl) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => {
            setPreviewCard(null);
            setPreviewAngleIndex(0);
          }}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl border border-[#E7E0D2] dark:border-white/10 bg-white dark:bg-[#0F1626] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Image with Navigation */}
            <div className="relative rounded-2xl bg-white border border-slate-100 dark:border-white/[0.06] p-3 flex justify-center items-center min-h-[260px]">
              <img
                src={currentPreviewAngleUrl || previewCard.imageUrl}
                alt={`${previewCard.cardSku} Image ${previewAngleIndex + 1}`}
                className="max-h-[58vh] w-auto object-contain rounded-xl"
              />

              {previewAngles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAngleIndex((prev) =>
                        prev > 0 ? prev - 1 : previewAngles.length - 1
                      );
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs"
                    title="Previous image"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewAngleIndex((prev) =>
                        prev < previewAngles.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs"
                    title="Next image"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                    Image {previewAngleIndex + 1} of {previewAngles.length}
                  </span>
                </>
              )}
            </div>

            {/* Image Strip inside Lightbox */}
            {previewAngles.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pt-3 pb-1">
                {previewAngles.map((ang, idx) => (
                  <button
                    key={ang.fileName || idx}
                    type="button"
                    onClick={() => setPreviewAngleIndex(idx)}
                    className={cn(
                      "h-12 w-12 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-white p-0.5",
                      idx === previewAngleIndex
                        ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                        : "border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={ang.url}
                      alt={`Image ${idx + 1}`}
                      className="h-full w-full object-contain rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Below Image: Variant SKU + Download Icon + Edit Variant + Cancel Icon */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black font-mono text-[#0A0E1A] dark:text-white truncate">
                  {previewCard.cardSku}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {previewCard.category} • {previewCard.totalPcs} pcs available
                  {previewAngles.length > 1 && ` • ${previewAngles.length} photos`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Download Icon */}
                <button
                  type="button"
                  disabled={downloadingImg}
                  onClick={() =>
                    handleDownloadPreviewImage(previewCard, currentPreviewAngleUrl)
                  }
                  title="Download Image"
                  aria-label="Download Image"
                  className="h-9.5 w-9.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#F5C451] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download size={16} />
                </button>

                {/* Edit Variant */}
                {(previewCard.primaryVariantId || previewCard.productId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = previewCard.primaryVariantId;
                      const col = previewCard.color;
                      const pid = previewCard.productId;
                      setPreviewCard(null);
                      setPreviewAngleIndex(0);
                      handleOpenVariantEdit(id, col, pid);
                    }}
                    className="h-9.5 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] transition-all cursor-pointer shadow-xs"
                  >
                    <Pencil size={13} />
                    <span>Edit Variant</span>
                  </button>
                )}

                {/* Cancel / Close Icon */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewCard(null);
                    setPreviewAngleIndex(0);
                  }}
                  title="Close Preview"
                  aria-label="Close Preview"
                  className="h-9.5 w-9.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Gallery / PDF Preview Modal (img-3) */}
      <GalleryPrintPreviewModal
        open={printPreviewOpen}
        items={printItemsOverride || filteredCards}
        companyName={companyName}
        companyPhone={companyPhone}
        displayOptions={displayOptions}
        onClose={() => {
          setPrintPreviewOpen(false);
          setPrintItemsOverride(null);
        }}
      />

      {/* Checkout Modal */}
      <GalleryCheckoutModal
        open={checkoutOpen}
        cart={activeCart || null}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmCheckout}
        submitting={submittingCheckout}
      />

      {/* Add Party Modal (img-2) */}
      <GalleryAddPartyModal
        open={addPartyOpen}
        onClose={() => setAddPartyOpen(false)}
        onPartyCreated={(newParty) => {
          queryClient.setQueryData<Party[]>(["gallery-parties"], (prev = []) => {
            const exists = prev.some((p) => p.id === newParty.id);
            return exists ? prev : [newParty, ...prev];
          });
          queryClient.invalidateQueries({ queryKey: ["gallery-parties"] });
          updateActiveCart((c) => ({ ...c, party: newParty }));
        }}
      />

      {/* Sales Report & Collection Report Modals */}
      <GallerySalesReportModal
        open={salesReportOpen}
        onClose={() => setSalesReportOpen(false)}
      />

      <GalleryCollectionReportModal
        open={collectionReportOpen}
        onClose={() => setCollectionReportOpen(false)}
      />
    </DashboardLayout>
  );
}
