"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "../../layout/DashboardLayout";

import ProductHeader from "./components/ProductHeader";
import ProductStats from "./components/ProductStats";
import ProductToolbar, { type ImportType } from "./components/ProductToolbar";
import ProductTable from "./components/ProductTable";
import AsinTable from "./components/AsinTable";
import AsinModal from "./components/AsinModal";
import MyntraModal from "./components/MyntraModal";
import type { Product } from "./types/product.types";
import type { AsinImportItem } from "./types/asinImport.types";
import type { MyntraImportItem } from "./types/myntraImport.types";
import DeleteProductModal from "./components/DeleteProductModal";
import ProductPagination from "./components/ProductPagination";
import ProductModal from "./components/ProductModal";
import {
  useProducts,
  useProductStats,
  useDeleteProduct,
  useUpdateProductStatus,
  useImportProductsExcel,
} from "./hooks/useProducts";
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
import { useQueryClient } from "@tanstack/react-query";

const ManageProducts = () => {
  const queryClient = useQueryClient();
  const [importType, setImportType] = useState<ImportType>("product");

  // Read URL type parameter after mount on client to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("type");
      if (param === "myntra" || param === "asin" || param === "product") {
        setImportType(param as ImportType);
      }
    }
  }, []);

  // Toolbar State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [asinModalOpen, setAsinModalOpen] = useState(false);
  const [selectedAsin, setSelectedAsin] = useState<AsinImportItem | null>(null);

  const [myntraModalOpen, setMyntraModalOpen] = useState(false);
  const [selectedMyntra, setSelectedMyntra] = useState<MyntraImportItem | null>(null);

  const updateProductStatusMutation = useUpdateProductStatus();
  const importProductExcelMutation = useImportProductsExcel();
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
        await importProductExcelMutation.mutateAsync(file);
        await refetchProducts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const {
    data: productsResponse,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useProducts();

  const { data: statsResponse } = useProductStats();
  const productStats = statsResponse?.data;
  const deleteProductMutation = useDeleteProduct();

  // Category Options
  const categoryOptions = [
    { label: "All Categories", value: "" },
    { label: "Trousers", value: "Trousers" },
    { label: "Co Ord Set", value: "Co Ord Set" },
  ];

  // Brand Options
  const brandOptions = [
    { label: "All Brands", value: "" },
    { label: "R.Code", value: "R.Code" },
    { label: "TOPLOT", value: "TOPLOT" },
  ];

  const products = productsResponse?.data ?? [];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" ||
      product.productName.toLowerCase().includes(search.toLowerCase()) ||
      product.masterSku.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = status === "" || String(product.isActive) === status;
    const matchesCategory = category === "" || product.category === category;
    const matchesBrand = brand === "" || product.brand === brand;

    return matchesSearch && matchesStatus && matchesCategory && matchesBrand;
  });

  const totalRecords =
    importType === "product"
      ? filteredProducts.length
      : importType === "asin"
      ? asinItems.length
      : myntraItems.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedProducts = filteredProducts.slice(
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

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const handleVariantToggle = (product: Product) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product.id);
    }
  };

  const handleEdit = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleEditAsin = (item: AsinImportItem) => {
    setSelectedAsin(item);
    setAsinModalOpen(true);
  };

  const handleEditMyntra = (item: MyntraImportItem) => {
    setSelectedMyntra(item);
    setMyntraModalOpen(true);
  };

  const handleStatus = async (product: Product) => {
    try {
      await updateProductStatusMutation.mutateAsync({
        id: product.id,
        data: {
          isActive: !product.isActive,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: ["product-variants", product.id],
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

    if (importType === "myntra") {
      refetchMyntra();
    } else if (importType === "asin") {
      refetchAsin();
    } else {
      refetchProducts();
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      await deleteProductMutation.mutateAsync(selectedProduct.id);
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
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
    <DashboardLayout title="Products">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Information Banner matching Inventory */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <ProductHeader
            buttonLabel={
              importType === "asin"
                ? "Add ASIN"
                : importType === "myntra"
                ? "Add Myntra"
                : "Add Product"
            }
            onAddProduct={() => {
              if (importType === "asin") {
                setSelectedAsin(null);
                setAsinModalOpen(true);
              } else if (importType === "myntra") {
                setSelectedMyntra(null);
                setMyntraModalOpen(true);
              } else if (importType === "product") {
                setModalMode("create");
                setSelectedProduct(null);
                setProductModalOpen(true);
              }
            }}
          />

          <div className="mt-5 sm:mt-6 border-t border-[#E7E0D2] pt-5 sm:pt-6">
            <ProductStats
              importType={importType}
              stats={productStats}
              totalProducts={products.length}
              asinItems={asinItems}
              asinTotal={asinResponse?.total}
              myntraItems={myntraItems}
              myntraTotal={myntraResponse?.total}
              isLoading={
                importType === "asin"
                  ? asinLoading
                  : importType === "myntra"
                  ? myntraLoading
                  : productsLoading
              }
            />
          </div>
        </div>

        <ProductToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          brand={brand}
          onBrandChange={setBrand}
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
              : importProductExcelMutation.isPending
          }
          productsData={products}
          asinData={asinItems}
          myntraData={myntraItems}
        />

        {/* Table Container matching Inventory */}
        <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col">
          {importType === "product" ? (
            <ProductTable
              products={paginatedProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatus}
              expandedProductId={expandedProductId}
              onVariantToggle={handleVariantToggle}
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

          <ProductPagination
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
                : "products"
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

      <ProductModal
        open={productModalOpen}
        mode={modalMode}
        product={selectedProduct ?? undefined}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setProductModalOpen(false);
          setSelectedProduct(null);
          refetchProducts();
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

      <DeleteProductModal
        open={deleteModalOpen}
        product={selectedProduct}
        loading={deleteLoading}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
};

export default ManageProducts;
