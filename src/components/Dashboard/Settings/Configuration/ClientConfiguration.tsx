"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ClientConfigHeader from "./components/ClientConfigHeader";
import ClientConfigStatsBanner from "./components/ClientConfigStatsBanner";
import InventoryDepartmentSwitch from "./components/InventoryDepartmentSwitch";
import DropdownModeCard from "./components/DropdownModeCard";
import ClientConfigSectionCard from "./components/ClientConfigSectionCard";
import {
  buildDynamicClientConfigTree,
  calculateTreeStats,
  updateNodeCheckedState,
  extractConfigPayload,
} from "./utils/dynamicTreeBuilder";
import { clientConfigurationService } from "./services/clientConfiguration.service";
import type { ClientConfigTreeNode, DropdownManagementMode } from "./types/clientConfiguration.types";
import { toast } from "sonner";

export default function ClientConfiguration() {
  const [columns, setColumns] = useState<{
    column1: ClientConfigTreeNode[];
    column2: ClientConfigTreeNode[];
    column3: ClientConfigTreeNode[];
  }>(() => buildDynamicClientConfigTree());

  const [hasSeparateInventoryDept, setHasSeparateInventoryDept] = useState(false);
  const [dropdownManagementMode, setDropdownManagementMode] = useState<DropdownManagementMode>("SETTING_MASTERS");
  const [planName, setPlanName] = useState("Enterprise Plus");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial config from server (or fallback to cached localStorage)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await clientConfigurationService.getClientConfig();
        if (isMounted && data) {
          setHasSeparateInventoryDept(Boolean(data.hasSeparateInventoryDept));
          setPlanName(data.subscriptionPlan || "Enterprise Plus");
          setDropdownManagementMode(
            data.dropdownManagementMode ||
            data.configurationData?.dropdownManagementMode ||
            "SETTING_MASTERS"
          );
          setColumns(buildDynamicClientConfigTree(data.configurationData));
        }
      } catch (err: any) {
        console.error("Failed to load client configuration:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Checkbox toggle handler with cascade
  const handleToggle = useCallback((id: string, newChecked: boolean) => {
    setColumns((prev) => {
      const next = {
        column1: [...prev.column1],
        column2: [...prev.column2],
        column3: [...prev.column3],
      };

      for (const colKey of ["column1", "column2", "column3"] as const) {
        for (const sec of next[colKey]) {
          if (updateNodeCheckedState(sec, id, newChecked)) {
            break;
          }
        }
      }

      return next;
    });
  }, []);

  // Reset to default (all enabled)
  const handleResetDefaults = useCallback(() => {
    setColumns(buildDynamicClientConfigTree(null));
    setHasSeparateInventoryDept(false);
    setDropdownManagementMode("SETTING_MASTERS");
    toast.info("Permissions reset to defaults. Click 'Save Permissions' to apply.");
  }, []);

  // Compute live statistics for top banner
  const stats = useMemo(() => {
    return calculateTreeStats(columns, planName);
  }, [columns, planName]);

  // Save permissions to server & local cache
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = extractConfigPayload(columns);

      await clientConfigurationService.updateClientConfig({
        clientName: planName,
        subscriptionPlan: planName,
        hasSeparateInventoryDept,
        dropdownManagementMode,
        enabledSections: payload.enabledSections,
        enabledRoutes: payload.enabledRoutes,
        configurationData: {
          ...payload.configurationData,
          dropdownManagementMode,
        },
      });

      toast.success("Client configuration saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Client Configuration">
      <div className="space-y-5 sm:space-y-6 w-full pb-16">
        {/* Header Card matching UI Theme of Order Process & Amazon Analytics */}
        <ClientConfigHeader
          onSave={handleSave}
          onResetDefaults={handleResetDefaults}
          isSaving={isSaving}
        />

        {/* 3 Top Stat Banner Cards */}
        <ClientConfigStatsBanner stats={stats} />

        {/* Dropdown Options Governance Policy Card (Directly below Stat Banner) */}
        <DropdownModeCard
          mode={dropdownManagementMode}
          onChange={setDropdownManagementMode}
        />

        {/* 3 Columns Layout */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 animate-pulse pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
            {/* Column 1: Dashboard, VMS, Products */}
            <div className="flex flex-col">
              {columns.column1.map((section) => (
                <ClientConfigSectionCard
                  key={section.id}
                  node={section}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            {/* Column 2: Order Process, Products Analytics, Transaction */}
            <div className="flex flex-col">
              {columns.column2.map((section) => (
                <ClientConfigSectionCard
                  key={section.id}
                  node={section}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            {/* Column 3: Inventory Department Switch + Offline Sales, Purchase, Settings */}
            <div className="flex flex-col">
              <InventoryDepartmentSwitch
                checked={hasSeparateInventoryDept}
                onChange={setHasSeparateInventoryDept}
              />

              {columns.column3.map((section) => (
                <ClientConfigSectionCard
                  key={section.id}
                  node={section}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
