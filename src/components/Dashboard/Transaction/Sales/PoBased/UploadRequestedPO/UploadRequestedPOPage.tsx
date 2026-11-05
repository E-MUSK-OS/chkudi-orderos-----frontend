"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import RequestedPOHeader from "./components/RequestedPOHeader";
import StoreCarousel from "./components/StoreCarousel";
import POUploadPanel from "./components/POUploadPanel";
import POHistoryList from "./components/POHistoryList";
import { Webstore } from "@/components/Dashboard/Settings/Webstore/types/webstore.types";
import { webstoreService } from "@/components/Dashboard/Settings/Webstore/services/webstore.service";
import { requestedPoService } from "./services/requestedPo.service";
import { RequestedPO } from "./types/requestedPo.types";
import { toast } from "sonner";

export default function UploadRequestedPOPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStoreId = searchParams.get("storeId");

  const [stores, setStores] = useState<Webstore[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(true);

  // Form states
  const [poNumber, setPoNumber] = useState<string>("");
  const [poDate, setPoDate] = useState<string>(format(new Date(), "dd-MM-yyyy"));
  const [carouselVersion, setCarouselVersion] = useState<number>(0);

  // Database-backed states (NO localStorage used)
  const [historyList, setHistoryList] = useState<RequestedPO[]>([]);
  const [latestDatesMap, setLatestDatesMap] = useState<Record<string, string>>({});

  // Clean any legacy storage completely so localStorage is clean
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("orderos_selected_po_store_id");
        sessionStorage.removeItem("orderos_selected_po_store_id");
        localStorage.removeItem("orderos_requested_pos_v1");
      } catch {
        // Ignore
      }
    }
  }, []);

  // Load webstores
  useEffect(() => {
    let ignore = false;
    async function fetchWebstores() {
      try {
        const res = await webstoreService.getWebstores({ isActive: "All" });
        if (!ignore) {
          setStores(res.data || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Failed to load webstores:", err);
          toast.error("Failed to load webstores. Please try again.");
        }
      } finally {
        if (!ignore) {
          setLoadingStores(false);
        }
      }
    }
    fetchWebstores();
    return () => {
      ignore = true;
    };
  }, []);

  // Synchronize store selection with URL
  const selectedStore = useMemo(() => {
    if (!urlStoreId || stores.length === 0) return null;
    return stores.find((s) => s.id === urlStoreId) || null;
  }, [urlStoreId, stores]);

  // Load PO history from database for the selected store
  useEffect(() => {
    let ignore = false;
    async function loadHistory() {
      if (!selectedStore) {
        setHistoryList([]);
        return;
      }
      try {
        const data = await requestedPoService.getByStoreId(selectedStore.id);
        if (!ignore) {
          setHistoryList(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load PO history from database:", err);
          setHistoryList([]);
        }
      }
    }
    loadHistory();
    return () => {
      ignore = true;
    };
  }, [selectedStore, carouselVersion]);

  // Load latest PO dates map from database
  useEffect(() => {
    let ignore = false;
    async function loadLatestDates() {
      try {
        const dates = await requestedPoService.getLatestDates();
        if (!ignore) {
          setLatestDatesMap(dates);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load latest dates from database:", err);
        }
      }
    }
    loadLatestDates();
    return () => {
      ignore = true;
    };
  }, [carouselVersion]);

  const handleSelectStore = (store: Webstore) => {
    setPoNumber("");
    if (selectedStore?.id === store.id) {
      // Deselect store
      router.replace("/dashboard/transaction/sales/po-based/upload-requested-po");
    } else {
      // Select store
      router.replace(
        `/dashboard/transaction/sales/po-based/upload-requested-po?storeId=${encodeURIComponent(store.id)}`
      );
    }
  };

  // Called automatically when an Excel file is uploaded and saved to DB
  const handlePoUploaded = (_savedPo: RequestedPO) => {
    setPoNumber("");
    setCarouselVersion((v) => v + 1); // Triggers reload from DB to show new PO in the history table below
  };

  // Handle Eye icon click: navigate to dedicated view page
  const handleViewPO = (po: RequestedPO) => {
    router.push(
      `/dashboard/transaction/sales/po-based/upload-requested-po/view/${encodeURIComponent(po.id)}`
    );
  };

  const handleRefreshHistory = () => {
    setCarouselVersion((v) => v + 1);
  };

  return (
    <DashboardLayout title="Upload Requested PO">
      <div className="space-y-4 sm:space-y-6">
        {/* Top Header with Breadcrumbs matching OrderOS theme */}
        <RequestedPOHeader />

        {/* Webstore Carousel & Upload Panel */}
        <StoreCarousel
          stores={stores}
          selectedStore={selectedStore}
          onSelectStore={handleSelectStore}
          loading={loadingStores}
          latestDates={latestDatesMap}
        >
          {selectedStore && (
            <POUploadPanel
              selectedStore={selectedStore}
              onPoUploaded={handlePoUploaded}
              poNumber={poNumber}
              setPoNumber={setPoNumber}
              poDate={poDate}
              setPoDate={setPoDate}
            />
          )}
        </StoreCarousel>

        {/* History of Uploaded POs for this store (ONLY displayed when a store is selected) */}
        {selectedStore && (
          <POHistoryList
            storeId={selectedStore.id}
            storeName={selectedStore.storeName}
            poList={historyList}
            onRefresh={handleRefreshHistory}
            onViewPO={handleViewPO}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
