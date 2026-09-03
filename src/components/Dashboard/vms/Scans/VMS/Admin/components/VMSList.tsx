"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { getColumns } from "./columns";
import DataTable from "./DataTable";
import PreviewDialog from "./PreviewDialog";
import Toolbar from "./Toolbar";
import Pagination from "./Pagination";
import DeleteModal from "./DeleteModal";

import { useVMS } from "../hooks/useVMS";
import { useOperators } from "@/components/Dashboard/vms/Admin/User/operator/hooks/useOperators";
import { useAccounts } from "@/components/Dashboard/vms/Admin/Account/hooks/useAccounts";
import type { VMSItem } from "../types";
import { API_BASE_URL } from "@/lib/config";

const getFullUrl = (url?: string | null) => {
  if (!url) return undefined;

  if (url.startsWith("http")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

const VMSList = () => {
  // ===========================
  // API
  // ===========================

  const { data, loading, refetch, deleteVMS } = useVMS();

  const { operators, fetchOperators } = useOperators();
  const { accounts, fetchAccounts } = useAccounts();

  // ===========================
  // State
  // ===========================

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [selectedItem, setSelectedItem] = useState<VMSItem | null>(null);

  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [operator, setOperator] = useState("");
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // ===========================
  // Preview
  // ===========================

  const handlePreview = (item: VMSItem) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  // ===========================
  // Operator Options
  // ===========================

  const operatorOptions = useMemo(() => {
    return [
      {
        label: "All Operators",
        value: "",
      },
      ...operators.map((item) => ({
        label: item.operatorName,
        value: item.id,
      })),
    ];
  }, [operators]);

  // ===========================
  // Account Options
  // ===========================

  const accountOptions = useMemo(() => {
    return [
      {
        label: "All Accounts",
        value: "",
      },
      ...accounts.map((item) => ({
        label: item.accountName,
        value: item.id,
      })),
    ];
  }, [accounts]);

  // ===========================
  // Filter Data
  // ===========================

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.trackingId
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus = !status || item.status === status;

      const matchOperator =
        !operator || String(item.operatorId) === String(operator);

      const matchAccount =
        !account || String(item.accountId) === String(account);

      const itemDate = new Date(item.createdAt);

      let matchDate = true;

      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);

        matchDate = matchDate && itemDate >= start;
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        matchDate = matchDate && itemDate <= end;
      }

      return (
        matchSearch &&
        matchStatus &&
        matchOperator &&
        matchAccount &&
        matchDate
      );
    });
  }, [
    data,
    search,
    status,
    operator,
    account,
    fromDate,
    toDate,
  ]);

  // ===========================
  // Excel Download
  // ===========================

  const handleDownload = () => {
    const exportData = filteredData.map((item) => ({
      "Tracking ID": item.trackingId,
      Status: item.status,
      Account: item.account?.accountName ?? "-",
      Operator: item.operator?.operatorName ?? "-",
      "Created At": new Date(item.createdAt).toLocaleString(),
      Duration: item.duration ?? "-",
      Size: item.fileSize ?? "-",
      "Video URL": "View Video",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    filteredData.forEach((item, index) => {
      const row = index + 2;
      const cell = `H${row}`;

      const videoUrl = getFullUrl(item.videoUrl);

      worksheet[cell] = {
        t: "s",
        v: "View Video",
        l: {
          Target: videoUrl,
          Tooltip: item.trackingId,
        },
      };
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "VMS Scans",
    );

    XLSX.writeFile(workbook, "vms-scans.xlsx");
  };

  // ===========================
  // Single Video Download
  // ===========================

  const handleSingleDownload = (item: VMSItem) => {
    if (!item.videoUrl) return;

    const fullUrl = getFullUrl(item.videoUrl);

    if (!fullUrl) return;

    const downloadUrl = fullUrl.includes("?")
      ? `${fullUrl}&download=true`
      : `${fullUrl}?download=true`;

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.setAttribute("download", "");

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ===========================
  // Delete
  // ===========================

  const handleDelete = (item: VMSItem) => {
    setSelectedItem(item);
    setOpenDelete(true);
  };

  // ===========================
  // Refresh
  // ===========================

  const handleRefresh = () => {
    refetch();
  };

  // ===========================
  // Table Columns
  // ===========================

  const columns = useMemo(
    () =>
      getColumns({
        onPreview: handlePreview,
        onDelete: handleDelete,
        onDownload: handleSingleDownload,
      }),
    [],
  );

  // ===========================
  // Pagination
  // ===========================

  const totalRecords = filteredData.length;

  const totalPages = Math.ceil(totalRecords / limit);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;

    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  // ===========================
  // Reset Page On Filter Change
  // ===========================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
    operator,
    account,
    fromDate,
    toDate,
    limit,
  ]);

  // ===========================
  // Fetch Operators & Accounts
  // ===========================

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
  }, []);

  // ===========================
  // Render
  // ===========================

  return (
    <>
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        operator={operator}
        onOperatorChange={setOperator}
        operatorOptions={operatorOptions}
        onStatusChange={setStatus}
        account={account}
        onAccountChange={setAccount}
        accountOptions={accountOptions}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
      />

      <DataTable
        columns={columns}
        data={paginatedData}
        loading={loading}
      />

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        item={selectedItem}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limit={limit}
        pageSize={limit}
        onPageSizeChange={setLimit}
        onPageChange={setPage}
      />

      <DeleteModal
        open={openDelete}
        loading={loading}
        title="Delete VMS"
        description={`Are you sure you want to delete "${selectedItem?.trackingId}"? This action cannot be undone.`}
        onClose={() => {
          setOpenDelete(false);
          setSelectedItem(null);
        }}
        onDelete={async () => {
          if (!selectedItem) return;

          await deleteVMS(selectedItem.id);

          setOpenDelete(false);
          setSelectedItem(null);
        }}
      />
    </>
  );
};

export default VMSList;