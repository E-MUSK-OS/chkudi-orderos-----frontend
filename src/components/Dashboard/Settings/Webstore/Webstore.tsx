"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import WebstoreHeader from "./components/WebstoreHeader";
import WebstoreStatsBanner from "./components/WebstoreStatsBanner";
import WebstoreFilterSortBar from "./components/WebstoreFilterSortBar";
import WebstoreCardGrid from "./components/WebstoreCardGrid";
import WebstoreTableView from "./components/WebstoreTableView";
import WebstoreForm from "./components/WebstoreForm";
import DeleteWebstoreModal from "./components/DeleteWebstoreModal";
import UploadOrderModal from "./components/UploadOrderModal";
import {
  Webstore as IWebstore,
  WebstoreFilterState,
  WebstoreViewMode,
} from "./types/webstore.types";
import { webstoreService } from "./services/webstore.service";
import { exportWebstoresToCsv } from "./utils/exportWebstores";
import { toast } from "sonner";

export default function Webstore() {
  const [viewMode, setViewMode] = useState<WebstoreViewMode>("list");
  const [layoutMode, setLayoutMode] = useState<"grid" | "table">("grid");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [stores, setStores] = useState<IWebstore[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<IWebstore | null>(null);
  const [deletingStore, setDeletingStore] = useState<IWebstore | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [nextCode, setNextCode] = useState<number>(1);

  // Filters State matching Image 1
  const [filters, setFilters] = useState<WebstoreFilterState>({
    search: "",
    marketplaceName: "All",
    isActive: "All",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const filtersRef = useRef(filters);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStores = useCallback(
    async (customFilters?: WebstoreFilterState) => {
      try {
        setLoading(true);
        const activeFilters = customFilters || filtersRef.current;
        const res = await webstoreService.getWebstores(activeFilters);
        setStores(res.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load webstores.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchNextCode = useCallback(async () => {
    try {
      const code = await webstoreService.getNextCode();
      setNextCode(code);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchNextCode();
  }, [fetchStores, fetchNextCode]);

  const handleFilterChange = (
    key: keyof WebstoreFilterState,
    value: any
  ) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (key === "marketplaceName" || key === "isActive") {
      fetchStores(nextFilters);
    } else {
      debounceRef.current = setTimeout(() => {
        fetchStores(nextFilters);
      }, 350);
    }
  };

  const handleSortToggle = (field: string) => {
    const nextOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    const nextFilters: WebstoreFilterState = {
      ...filters,
      sortBy: field,
      sortOrder: nextOrder,
    };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;
    fetchStores(nextFilters);
  };

  const handleAddNew = () => {
    setSelectedStore(null);
    fetchNextCode();
    setViewMode("create");
  };

  const handleModify = async (store: IWebstore) => {
    setSelectedStore(store);
    setViewMode("edit");
    try {
      const res = await webstoreService.getWebstoreById(store.id);
      if (res?.data) {
        setSelectedStore(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedStore(null);
  };

  const handleToggleStatus = async (store: IWebstore) => {
    try {
      setTogglingId(store.id);
      // Optimistic update
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, isActive: !s.isActive } : s))
      );
      const res = await webstoreService.toggleStatus(store.id);
      toast.success(
        `${store.storeName} is now ${res.data.isActive ? "Active" : "Inactive"}.`
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update store status.");
      // Rollback
      fetchStores();
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      setIsSaving(true);
      if (viewMode === "edit" && selectedStore) {
        await webstoreService.updateWebstore(selectedStore.id, payload);
        toast.success(`Webstore "${payload.storeName}" updated successfully.`);
      } else {
        await webstoreService.createWebstore(payload);
        toast.success(`Webstore "${payload.storeName}" created successfully.`);
      }
      setViewMode("list");
      setSelectedStore(null);
      fetchStores();
      fetchNextCode();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save webstore.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStore) return;
    try {
      setIsDeleting(true);
      await webstoreService.deleteWebstore(deletingStore.id);
      toast.success(`Webstore "${deletingStore.storeName}" deleted successfully.`);
      setDeletingStore(null);
      fetchStores();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete webstore.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadOrder = () => {
    setUploadModalOpen(true);
  };

  const handleDownloadListings = () => {
    if (stores.length === 0) {
      toast.info("No stores available to export.");
      return;
    }
    try {
      exportWebstoresToCsv(stores);
      toast.success(`Exported ${stores.length} webstore listings successfully.`);
    } catch (err) {
      toast.error("Failed to export listings.");
    }
  };

  const handleResetFilters = () => {
    const initialFilters: WebstoreFilterState = {
      search: "",
      marketplaceName: "All",
      isActive: "All",
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    setFilters(initialFilters);
    filtersRef.current = initialFilters;
    fetchStores(initialFilters);
  };

  return (
    <DashboardLayout title="Webstore">
      <div className="space-y-4 font-sans">
        {/* Header with Title & Action Buttons */}
        <WebstoreHeader
          viewMode={viewMode}
          onAddNew={handleAddNew}
          onBack={handleBack}
          onUploadOrder={handleUploadOrder}
          onDownloadListings={handleDownloadListings}
          saving={isSaving}
        />

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {/* Quick KPI Stats Banner */}
            <WebstoreStatsBanner stores={stores} />

            {/* Filter & Sort Bar */}
            <WebstoreFilterSortBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onSortToggle={handleSortToggle}
              totalCount={stores.length}
              layoutMode={layoutMode}
              onLayoutModeChange={setLayoutMode}
              onResetFilters={handleResetFilters}
            />

            {/* Cards Grid or Tabular List depending on layoutMode */}
            {layoutMode === "grid" ? (
              <WebstoreCardGrid
                stores={stores}
                loading={loading}
                onModify={handleModify}
                onToggleStatus={handleToggleStatus}
                onDelete={(store) => setDeletingStore(store)}
                onAddNew={handleAddNew}
                togglingId={togglingId}
              />
            ) : (
              <WebstoreTableView
                stores={stores}
                loading={loading}
                onModify={handleModify}
                onToggleStatus={handleToggleStatus}
                onDelete={(store) => setDeletingStore(store)}
                togglingId={togglingId}
                filters={filters}
                onSortToggle={handleSortToggle}
              />
            )}
          </div>
        )}

        {/* Create / Edit Form View matching Screenshot 3 & 4 */}
        {(viewMode === "create" || viewMode === "edit") && (
          <WebstoreForm
            initialData={selectedStore}
            nextCode={nextCode}
            onSave={handleSave}
            onCancel={handleBack}
            isSaving={isSaving}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteWebstoreModal
          open={!!deletingStore}
          storeName={deletingStore?.storeName}
          marketplaceName={deletingStore?.marketplaceName}
          loading={isDeleting}
          onClose={() => setDeletingStore(null)}
          onConfirm={handleDeleteConfirm}
        />

        {/* Upload Channel Orders Modal */}
        <UploadOrderModal
          open={uploadModalOpen}
          stores={stores}
          onClose={() => setUploadModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
