"use client";

import { useState } from "react";

import DashboardLayout from "../../layout/DashboardLayout";

import ProductHeader from "./components/ProductHeader";
import ProductStats from "./components/ProductStats";
import ProductToolbar, { type ImportType } from "./components/ProductToolbar";
import ProductTable from "./components/ProductTable";
import AsinTable from "./components/AsinTable";
import AsinModal from "./components/AsinModal";
import type { Product } from "./types/product.types";
import type { AsinImportItem } from "./types/asinImport.types";
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
import { useQueryClient } from "@tanstack/react-query";

const ManageProducts = () => {
  const queryClient = useQueryClient();
  const [importType, setImportType] = useState<ImportType>("product");

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

  const updateProductStatusMutation = useUpdateProductStatus();
  const importProductExcelMutation = useImportProductsExcel();
  const importAsinExcelMutation = useImportAsinExcel();
  const deleteAsinMutation = useDeleteAsinImport();

  // ASIN Queries
  const { data: asinResponse, isLoading: asinLoading, refetch: refetchAsin } = useAsinImports(search);
  const asinItems = asinResponse?.data ?? [];

  const handleImportExcel = async (file: File, type: ImportType) => {
    try {
      const activeType = type || importType;
      if (activeType === "asin") {
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

  const totalRecords = importType === "product" ? filteredProducts.length : asinItems.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const paginatedAsinItems = asinItems.slice(
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

    if (importType === "asin") {
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
      <div className="space-y-6">
        <ProductHeader
          onAddProduct={() => {
            setModalMode("create");
            setSelectedProduct(null);
            setProductModalOpen(true);
          }}
        />

        <ProductStats stats={productStats} />

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
            importType === "asin"
              ? importAsinExcelMutation.isPending
              : importProductExcelMutation.isPending
          }
        />

        {importType === "product" ? (
          <ProductTable
            products={paginatedProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatus}
            expandedProductId={expandedProductId}
            onVariantToggle={handleVariantToggle}
          />
        ) : (
          <AsinTable
            items={paginatedAsinItems}
            isLoading={asinLoading}
            onEdit={handleEditAsin}
            onDelete={handleDeleteAsin}
          />
        )}

        <ProductPagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          limit={pageSize}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
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
