"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Store, Upload, FileSpreadsheet, ArrowUpRight } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import RequestedPOHeader from "./components/RequestedPOHeader";
import StoreCarousel from "./components/StoreCarousel";
import POUploadPanel from "./components/POUploadPanel";
import POItemsTable from "./components/POItemsTable";
import POHistoryList from "./components/POHistoryList";
import { Webstore } from "@/components/Dashboard/Settings/Webstore/types/webstore.types";
import { webstoreService } from "@/components/Dashboard/Settings/Webstore/services/webstore.service";
import { requestedPoService } from "./services/requestedPo.service";
import { RequestedPO, RequestedPOItem } from "./types/requestedPo.types";
import { toast } from "sonner";

export default function UploadRequestedPOPage() {
  const [stores, setStores] = useState<Webstore[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(true);
  const [selectedStore, setSelectedStore] = useState<Webstore | null>(null);

  // Form states
  const [poNumber, setPoNumber] = useState<string>("");
  const [poDate, setPoDate] = useState<string>(format(new Date(), "dd-MM-yyyy"));
  const [parsedItems, setParsedItems] = useState<RequestedPOItem[]>([]);
  const [historyList, setHistoryList] = useState<RequestedPO[]>([]);
  const [carouselVersion, setCarouselVersion] = useState<number>(0);

  // Load webstores
  const loadWebstores = useCallback(async () => {
    try {
      setLoadingStores(true);
      const res = await webstoreService.getWebstores({ isActive: "All" });
      const storeList: Webstore[] = res.data || [];
      setStores(storeList);

      // Do not auto-select if user wants to see clean carousel first (matching Screenshot 1)
      // But if user has previously selected one, keep it
      if (selectedStore) {
        const found = storeList.find((s: Webstore) => s.id === selectedStore.id);
        if (found) setSelectedStore(found);
      }
    } catch (err: any) {
      console.error("Failed to load webstores:", err);
      toast.error("Failed to load webstores. Please try again.");
    } finally {
      setLoadingStores(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    loadWebstores();
  }, []);

  // Update history list whenever selected store changes
  useEffect(() => {
    if (selectedStore) {
      const history = requestedPoService.getByStoreId(selectedStore.id);
      setHistoryList(history);
      setParsedItems([]);
      setPoNumber("");
    } else {
      setHistoryList([]);
    }
  }, [selectedStore]);

  const handleSelectStore = (store: Webstore) => {
    setSelectedStore(store);
  };

  const handlePoUploaded = (savedPo: RequestedPO) => {
    if (selectedStore) {
      const updatedHistory = requestedPoService.getByStoreId(selectedStore.id);
      setHistoryList(updatedHistory);
      setParsedItems([]);
      setPoNumber("");
      setCarouselVersion((v) => v + 1); // Triggers re-render of carousel badges
    }
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleViewPO = (po: RequestedPO) => {
    setParsedItems(po.items || []);
    setPoNumber(po.poNumber);
    setPoDate(po.poDate);
    toast.info(`Viewing ${po.itemsCount} items for PO #${po.poNumber}`);
  };

  const handleRefreshHistory = () => {
    if (selectedStore) {
      const history = requestedPoService.getByStoreId(selectedStore.id);
      setHistoryList(history);
      setCarouselVersion((v) => v + 1);
    }
  };

  return (
    <DashboardLayout title="Upload Requested PO">
      <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-[#080B11] pb-12">
        {/* Top Header with Breadcrumbs */}
        <RequestedPOHeader />

        <div className="max-w-[1600px] mx-auto p-3 sm:p-5 space-y-3">
          {/* Webstore Carousel & Upload Panel (Screenshots 1 & 2) */}
          <StoreCarousel
            key={carouselVersion}
            stores={stores}
            selectedStore={selectedStore}
            onSelectStore={handleSelectStore}
            loading={loadingStores}
          >
            {selectedStore && (
              <POUploadPanel
                selectedStore={selectedStore}
                onPoUploaded={handlePoUploaded}
                parsedItems={parsedItems}
                setParsedItems={setParsedItems}
                poNumber={poNumber}
                setPoNumber={setPoNumber}
                poDate={poDate}
                setPoDate={setPoDate}
              />
            )}
          </StoreCarousel>

          {/* If a store is selected, render Line Items Table and History List */}
          {selectedStore && (
            <>
              {/* Parsed Line Items Table */}
              <POItemsTable
                items={parsedItems}
                onRemoveItem={handleRemoveItem}
              />

              {/* History of Uploaded POs for this store */}
              <POHistoryList
                storeId={selectedStore.id}
                storeName={selectedStore.storeName}
                poList={historyList}
                onRefresh={handleRefreshHistory}
                onViewPO={handleViewPO}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
