"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import WebstoreHeader from "./components/WebstoreHeader";
import WebstoreStatsBanner from "./components/WebstoreStatsBanner";
import WebstoreFilterSortBar from "./components/WebstoreFilterSortBar";
import WebstoreCardGrid from "./components/WebstoreCardGrid";
import WebstoreTableView from "./components/WebstoreTableView";
import WebstorePagination from "./components/WebstorePagination";
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<IWebstore | null>(null);
  const [deletingStore, setDeletingStore] = useState<IWebstore | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [nextCode, setNextCode] = useState<number>(1);

  // Filters State
  const [filters, setFilters] = useState<WebstoreFilterState>({
    search: "",
    marketplaceName: "All",
    isActive: "All",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
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
        setTotal(res.meta?.total ?? res.data?.length ?? 0);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load webstores.";
        toast.error(message);
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
    } catch {
      // Silently handled
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStores();
    fetchNextCode();
  }, [fetchStores, fetchNextCode]);

  const handleFilterChange = <K extends keyof WebstoreFilterState>(
    key: K,
    value: WebstoreFilterState[K]
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
    } catch {
      // Silently handled
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
      if (!res.success) {
        toast.error(res.error || "Failed to update store status.");
        fetchStores();
        return;
      }
      toast.success(
        `${store.storeName} is now ${res.data?.isActive ? "Active" : "Inactive"}.`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update store status.";
      toast.error(message);
      fetchStores();
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (payload: Partial<IWebstore> & Record<string, unknown>) => {
    try {
      setIsSaving(true);
      // Pre-check duplicate in currently loaded stores for instant feedback
      const isDuplicate = stores.some(
        (s) =>
          s.storeName.trim().toLowerCase() ===
            String(payload.storeName || "").trim().toLowerCase() &&
          s.id !== selectedStore?.id
      );
      if (isDuplicate) {
        toast.error(`Webstore with name "${payload.storeName}" already exists.`);
        return;
      }

      if (viewMode === "edit" && selectedStore) {
        const res = await webstoreService.updateWebstore(selectedStore.id, payload);
        if (!res.success) {
          toast.error(res.error || "Failed to update webstore.");
          return;
        }
        toast.success(`Webstore "${payload.storeName}" updated successfully.`);
      } else {
        const res = await webstoreService.createWebstore(payload);
        if (!res.success) {
          toast.error(res.error || "Failed to create webstore.");
          return;
        }
        toast.success(`Webstore "${payload.storeName}" created successfully.`);
      }
      setViewMode("list");
      setSelectedStore(null);
      fetchStores();
      fetchNextCode();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save webstore.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStore) return;
    try {
      setIsDeleting(true);
      const res = await webstoreService.deleteWebstore(deletingStore.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete webstore.");
        return;
      }
      toast.success(`Webstore "${deletingStore.storeName}" deleted successfully.`);
      setDeletingStore(null);
      fetchStores();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete webstore.";
      toast.error(message);
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
    } catch {
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
      page: 1,
      pageSize: 20,
    };
    setFilters(initialFilters);
    filtersRef.current = initialFilters;
    fetchStores(initialFilters);
  };

  return (
    <DashboardLayout title="Webstore">
      <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-20 max-w-[1600px] mx-auto">
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
              <div className="space-y-4">
                <WebstoreCardGrid
                  stores={stores}
                  loading={loading}
                  onModify={handleModify}
                  onToggleStatus={handleToggleStatus}
                  onDelete={(store) => setDeletingStore(store)}
                  onAddNew={handleAddNew}
                  togglingId={togglingId}
                />
                {stores.length > 0 && (
                  <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E7E0D2] dark:border-white/[0.08]">
                    <WebstorePagination
                      total={total || stores.length}
                      page={filters.page || 1}
                      pageSize={filters.pageSize || 20}
                      onPageChange={(page) => handleFilterChange("page", page)}
                      onPageSizeChange={(pageSize) => {
                        handleFilterChange("pageSize", pageSize);
                        handleFilterChange("page", 1);
                      }}
                    />
                  </div>
                )}
              </div>
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
                pagination={
                  <WebstorePagination
                    total={total || stores.length}
                    page={filters.page || 1}
                    pageSize={filters.pageSize || 20}
                    onPageChange={(page) => handleFilterChange("page", page)}
                    onPageSizeChange={(pageSize) => {
                      handleFilterChange("pageSize", pageSize);
                      handleFilterChange("page", 1);
                    }}
                  />
                }
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
