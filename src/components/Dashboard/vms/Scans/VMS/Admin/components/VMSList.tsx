"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";

import { getColumns } from "./columns";
import DataTable from "./DataTable";
import PreviewDialog from "./PreviewDialog";
import Toolbar from "./Toolbar";

import { useVMS } from "../hooks/useVMS";
import { useOperators } from "@/components/Dashboard/vms/Admin/User/operator/hooks/useOperators";
import type { VMSItem } from "../types";
import Pagination from "./Pagination";
import * as XLSX from "xlsx";

const VMSList = () => {
  // ===========================
  // API
  // ===========================

  const {
    data,
    loading,
    refetch, // જો હજી નથી તો પછી useVMS માં add કરીશું
  } = useVMS();

  const { operators, fetchOperators } = useOperators();

  // ===========================
  // Preview Dialog
  // ===========================

  const [previewOpen, setPreviewOpen] = useState(false);
  const [page, setPage] = useState(1);

  const limit = 10;

  const [selectedItem, setSelectedItem] = useState<VMSItem | null>(null);

  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [operator, setOperator] = useState("");

  const handlePreview = (item: VMSItem) => {
    setSelectedItem(item);

    setPreviewOpen(true);
  };

  // ===========================
  // Search & Filter
  // ===========================

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  // const [operator, setOperator] = useState("");

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

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.trackingId
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus = !status || item.status === status;

      const itemDate = new Date(item.createdAt);

      console.log(item.operatorId, operator);

      const matchOperator = !operator || item.operatorId === operator;

      let matchDate = true;

      if (fromDate) {
        matchDate = matchDate && itemDate >= new Date(fromDate);
      }

      if (toDate) {
        const end = new Date(toDate);

        end.setHours(23, 59, 59, 999);

        matchDate = matchDate && itemDate <= end;
      }

      return matchSearch && matchStatus && matchOperator && matchDate;
    });
  }, [data, search, status, operator, fromDate, toDate]);

  const handleDownload = () => {
    const exportData = filteredData.map((item) => ({
      "Tracking ID": item.trackingId,
      Status: item.status,
      Operator: item.operator?.operatorName ?? "-",
      "Created At": new Date(item.createdAt).toLocaleString(),
      Duration: item.duration ?? "-",
      Size: item.fileSize ?? "-",
      "Video URL": "View Video",
    }));

    // const worksheet = XLSX.utils.json_to_sheet(exportData);
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    filteredData.forEach((item, index) => {
      const row = index + 2; // Row 1 = Header

      const cell = `G${row}`; // G = "Video URL" column

      worksheet[cell] = {
        t: "s",
        v: "View Video",
        l: {
          Target: item.videoUrl,
          Tooltip: item.trackingId,
        },
      };
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "VMS Scans");

    XLSX.writeFile(workbook, "vms-scans.xlsx");
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
      }),
    [],
  );

  const totalRecords = filteredData.length;

  const totalPages = Math.ceil(totalRecords / limit);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;

    return filteredData.slice(start, start + limit);
  }, [filteredData, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    fetchOperators();
  }, []);

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
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
      />

      <DataTable columns={columns} data={paginatedData} loading={loading} />

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
        onPageChange={setPage}
      />
    </>
  );
};

export default VMSList;
