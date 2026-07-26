"use client";

import { useState } from "react";

import DashboardLayout from "../../layout/DashboardLayout";

import ProductHeader from "./components/ProductHeader";
import ProductStats from "./components/ProductStats";
import ProductToolbar from "./components/ProductToolbar";
import ProductTable from "./components/ProductTable";
import type { Product } from "./types/product.types";
import DeleteProductModal from "./components/DeleteProductModal";
import ProductPagination from "./components/ProductPagination";
import ProductModal from "./components/ProductModal";
import {
  useProducts,
  useProductStats,
  useDeleteProduct,
  useUpdateProductStatus,
} from "./hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";

const ManageProducts = () => {
  // const [openProductModal, setOpenProductModal] = useState(false);

  // Toolbar State
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  // const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // const [productLoading, setProductLoading] = useState(false);

  // const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);

  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const updateProductStatusMutation = useUpdateProductStatus();

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    refetch,
  } = useProducts();

  const { data: statsResponse, isLoading: statsLoading } = useProductStats();
  const productStats = statsResponse?.data;
  const deleteProductMutation = useDeleteProduct();

  // Dummy Category Options
  const categoryOptions = [
    {
      label: "All Categories",
      value: "",
    },
    {
      label: "Trousers",
      value: "Trousers",
    },
    {
      label: "Co Ord Set",
      value: "Co Ord Set",
    },
  ];

  // Dummy Brand Options
  const brandOptions = [
    {
      label: "All Brands",
      value: "",
    },
    {
      label: "R.Code",
      value: "R.Code",
    },
    {
      label: "TOPLOT",
      value: "TOPLOT",
    },
  ];
  const products = productsResponse?.data ?? [];

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // const totalRecords = dummyProducts.length;

  // const totalPages = Math.ceil(totalRecords / pageSize);

  // const paginatedProducts = dummyProducts.slice(
  //   (page - 1) * pageSize,
  //   page * pageSize,
  // );

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

  const totalRecords = filteredProducts.length;

  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );

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

    refetch();
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
          categoryOptions={categoryOptions}
          brandOptions={brandOptions}
          onRefresh={handleRefresh}
        />

        <ProductTable
          products={paginatedProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatus}
          expandedProductId={expandedProductId}
          onVariantToggle={handleVariantToggle}
        />

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
