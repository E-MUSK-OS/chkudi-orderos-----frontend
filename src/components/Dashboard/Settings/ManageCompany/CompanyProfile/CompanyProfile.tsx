"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import CompanyProfileHeader from "./components/CompanyProfileHeader";
import CompanyStatsBanner from "./components/CompanyStatsBanner";
import CompanyFilterBar from "./components/CompanyFilterBar";
import CompanyCardGrid from "./components/CompanyCardGrid";
import CompanyTableView from "./components/CompanyTableView";
import CompanyProfileForm from "./components/CompanyProfileForm";
import CreateCompanyDraftModal from "./components/CreateCompanyDraftModal";
import ViewCompanyModal from "./components/ViewCompanyModal";
import DeleteCompanyModal from "./components/DeleteCompanyModal";
import CompanyPagination from "./components/CompanyPagination";
import { Company, CompanyFilterState } from "./types/company.types";
import { companyService } from "./services/company.service";
import { exportCompaniesToCsv } from "./utils/exportCompanies";
import { toast } from "sonner";

export default function CompanyProfile() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [layoutMode, setLayoutMode] = useState<"grid" | "table">("grid");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal & Selection States
  const [createDraftOpen, setCreateDraftOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  // Filters State matching Webstore
  const [filters, setFilters] = useState<CompanyFilterState>({
    search: "",
    status: "All",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 50,
  });

  const filtersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCompanies = useCallback(
    async (currentFilters?: CompanyFilterState) => {
      try {
        setLoading(true);
        const active = currentFilters || filtersRef.current;
        const res = await companyService.getCompanies(active);
        setCompanies(res.data || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load company profiles.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleFilterChange = (
    key: keyof CompanyFilterState,
    value: any
  ) => {
    const nextFilters = { ...filters, [key]: value, page: 1 };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (key === "status") {
      fetchCompanies(nextFilters);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        fetchCompanies(nextFilters);
      }, 350);
    }
  };

  const handleSortToggle = (field: string) => {
    const nextOrder =
      filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
    const nextFilters: CompanyFilterState = {
      ...filters,
      sortBy: field,
      sortOrder: nextOrder,
    };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;
    fetchCompanies(nextFilters);
  };

  const handleResetFilters = () => {
    const initialFilters: CompanyFilterState = {
      search: "",
      status: "All",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 50,
    };
    setFilters(initialFilters);
    filtersRef.current = initialFilters;
    fetchCompanies(initialFilters);
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      setTogglingId(company.id);
      const newStatus: "ACTIVE" | "DRAFT" = company.status === "ACTIVE" ? "DRAFT" : "ACTIVE";

      // Optimistic update
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, status: newStatus } : c))
      );

      const res = await companyService.toggleStatus(company.id, newStatus);
      toast.success(
        `${company.companyName} is now ${res.data.status === "ACTIVE" ? "Active" : "Draft"}.`
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update company status.");
      // Rollback
      fetchCompanies();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    try {
      setIsDeleting(true);
      await companyService.deleteCompany(deletingCompany.id);
      toast.success(`Company "${deletingCompany.companyName}" deleted successfully.`);
      setDeletingCompany(null);
      fetchCompanies();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete company.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadListings = () => {
    if (companies.length === 0) {
      toast.info("No companies available to export.");
      return;
    }
    try {
      exportCompaniesToCsv(companies);
      toast.success(`Exported ${companies.length} company profiles successfully.`);
    } catch (err) {
      toast.error("Failed to export company listings.");
    }
  };

  const handleDraftCreated = (newDraft: Company) => {
    fetchCompanies();
    router.push(`/dashboard/setting/manage-company/company-profile/edit/${newDraft.id}`);
  };

  const handleView = (company: Company) => {
    router.push(`/dashboard/setting/manage-company/company-profile/view/${company.id}`);
  };

  const handleEdit = (company: Company) => {
    router.push(`/dashboard/setting/manage-company/company-profile/edit/${company.id}`);
  };

  const handleCompanySaved = (updated: Company) => {
    setSelectedCompany(updated);
    fetchCompanies();
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedCompany(null);
    fetchCompanies();
  };

  return (
    <DashboardLayout title="Company Profile">
      {viewMode === "edit" ? (
        /* Full Page Company Profile Form matching Screenshots 2, 3, 4, 5 */
        <CompanyProfileForm
          company={selectedCompany}
          onBack={handleBackToList}
          onSaved={handleCompanySaved}
        />
      ) : (
        /* List View matching Webstore Design */
        <div className="space-y-6 font-sans">
          {/* Header with Title & Action Buttons matching Webstore */}
          <CompanyProfileHeader
            onCreateClick={() => setCreateDraftOpen(true)}
            onDownloadListings={handleDownloadListings}
          />

          {/* Quick KPI Stats Banner matching Webstore */}
          <CompanyStatsBanner companies={companies} />

          {/* Filter & Sort Bar matching Webstore */}
          <CompanyFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onSortToggle={handleSortToggle}
            totalCount={companies.length}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            onResetFilters={handleResetFilters}
          />

          {/* Cards Grid or Tabular List depending on layoutMode */}
          {layoutMode === "grid" ? (
            <>
              <CompanyCardGrid
                companies={companies}
                loading={loading}
                onModify={handleEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={(comp) => setDeletingCompany(comp)}
                onView={handleView}
                onAddNew={() => setCreateDraftOpen(true)}
                togglingId={togglingId}
              />
              {meta.total > 0 && (
                <div className="relative rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm mt-4">
                  <CompanyPagination
                    total={meta.total}
                    page={filters.page || 1}
                    pageSize={filters.pageSize || 50}
                    totalPages={meta.totalPages || 1}
                    onPageChange={(p) => handleFilterChange("page", p)}
                    onPageSizeChange={(sz) => handleFilterChange("pageSize", sz)}
                    className="border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                  />
                </div>
              )}
            </>
          ) : (
            <CompanyTableView
              companies={companies}
              loading={loading}
              onModify={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={(comp) => setDeletingCompany(comp)}
              onView={handleView}
              togglingId={togglingId}
              filters={filters}
              onSortToggle={handleSortToggle}
              pagination={
                meta.total > 0 ? (
                  <CompanyPagination
                    total={meta.total}
                    page={filters.page || 1}
                    pageSize={filters.pageSize || 50}
                    totalPages={meta.totalPages || 1}
                    onPageChange={(p) => handleFilterChange("page", p)}
                    onPageSizeChange={(sz) => handleFilterChange("pageSize", sz)}
                    className="border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                  />
                ) : null
              }
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal matching DeleteWebstoreModal */}
      <DeleteCompanyModal
        open={!!deletingCompany}
        companyName={deletingCompany?.companyName}
        gstNumber={deletingCompany?.gstNumber}
        loading={isDeleting}
        onClose={() => setDeletingCompany(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Create Draft Modal */}
      <CreateCompanyDraftModal
        open={createDraftOpen}
        onClose={() => setCreateDraftOpen(false)}
        onSuccess={handleDraftCreated}
      />

      {/* View Company Details Modal */}
      <ViewCompanyModal
        open={viewModalOpen}
        company={selectedCompany}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCompany(null);
        }}
        onEditClick={(comp) => {
          setViewModalOpen(false);
          handleEdit(comp);
        }}
      />
    </DashboardLayout>
  );
}
