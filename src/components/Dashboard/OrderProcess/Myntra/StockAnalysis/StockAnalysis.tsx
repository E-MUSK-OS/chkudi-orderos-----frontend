"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Search,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Trash2,
  ChevronDown,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/Dashboard/layout/DashboardLayout';
import ProcessingProgressModal from './components/ProcessingProgressModal';
import Pagination from "@/components/ui/Pagination";

interface StockResult {
  sellerSkuCode: string;
  myntraSkuCode: string;
  brand: string;
  orders: number;
  returns: number;
  netOrders: number;
  avgOrdersPerDay?: number;
  avgReturnsPerDay?: number;
  req15Days?: number;
  req30Days?: number;
}

export default function StockAnalysis() {
  const [orders, setOrders] = useState<{ file: File, data: any[] }[]>([]);
  const [returns, setReturns] = useState<{ file: File, data: any[] }[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [reportDays, setReportDays] = useState<number>(30);

  const [sortConfig, setSortConfig] = useState<{ key: keyof StockResult, direction: 'asc' | 'desc' } | null>({ key: 'netOrders', direction: 'desc' });

  const ordersInputRef = useRef<HTMLInputElement>(null);
  const returnsInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingOrders, setIsDraggingOrders] = useState(false);
  const [isDraggingReturns, setIsDraggingReturns] = useState(false);

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (files: FileList | File[], type: 'orders' | 'returns') => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const currentFiles = type === 'orders' ? [...orders] : [...returns];

    for (const file of fileArray) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        toast.error(`Please upload a valid Excel or CSV file: ${file.name}`);
        continue;
      }

      const isDuplicate = currentFiles.some(f => f.file.name === file.name && f.file.size === file.size);
      if (isDuplicate) {
        toast.warning(`File already added: ${file.name}`);
        continue;
      }

      try {
        const data = await processExcelFile(file);

        if (!data || data.length === 0) {
          toast.error(`The uploaded file is empty: ${file.name}`);
          continue;
        }

        const headers = Object.keys(data[0]).map(k => k.toLowerCase().replace(/[\s_]/g, ''));

        if (type === 'orders') {
          const hasOrderColumns = headers.includes('storeorderid') || headers.includes('orderstatus') || headers.includes('packetid');
          const hasReturnColumns = headers.includes('returnid') || headers.includes('returnreason') || headers.includes('returnstatus');

          if (!hasOrderColumns || hasReturnColumns) {
            toast.error(`Invalid file: ${file.name}. Please upload a valid Myntra Orders report here.`);
            continue;
          }
          currentFiles.push({ file, data });
          setOrders(prev => {
            if (prev.some(o => o.file.name === file.name && o.file.size === file.size)) return prev;
            return [...prev, { file, data }];
          });
          toast.success(`Added Orders file: ${file.name}`);
        } else {
          const hasReturnColumns = headers.includes('returnid') || headers.includes('returnreason') || headers.includes('returnstatus');
          if (!hasReturnColumns) {
            toast.error(`Invalid file: ${file.name}. Please upload a valid Myntra Returns report here.`);
            continue;
          }
          currentFiles.push({ file, data });
          setReturns(prev => {
            if (prev.some(r => r.file.name === file.name && r.file.size === file.size)) return prev;
            return [...prev, { file, data }];
          });
          toast.success(`Added Returns file: ${file.name}`);
        }
      } catch (error) {
        console.error(error);
        toast.error(`Failed to process ${type} file: ${file.name}`);
      }
    }
  };

  const findValue = (row: any, targetKeys: string[]): string => {
    if (!row) return '';
    const keys = Object.keys(row);
    const matchedKey = keys.find(k => {
      const normalized = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return targetKeys.includes(normalized);
    });
    if (matchedKey && row[matchedKey]) {
      return String(row[matchedKey]).trim();
    }
    return '';
  };

  const parseExcelDate = (value: any): Date | null => {
    if (!value) return null;
    if (typeof value === 'number') {
      return new Date(Math.round((value - 25569) * 86400 * 1000));
    }
    const dateStr = String(value).trim();
    if (!dateStr) return null;

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (parts) {
      const [, d, m, y] = parts;
      const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      const dateTry = new Date(year, parseInt(m) - 1, parseInt(d));
      if (!isNaN(dateTry.getTime())) return dateTry;
    }
    return null;
  };

  const handleAnalyze = () => {
    if (orders.length === 0 && returns.length === 0) {
      toast.error('Please upload at least one file to analyze');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Parsing uploaded data...');

    let currentPct = 0;
    const progressInterval = setInterval(() => {
      currentPct += 15;
      if (currentPct > 90) currentPct = 90;
      setProgress(currentPct);
      if (currentPct === 30) setCurrentStage('Counting Orders...');
      if (currentPct === 60) setCurrentStage('Counting Returns...');
      if (currentPct === 90) setCurrentStage('Calculating Net Stock...');
    }, 200);

    setTimeout(() => {
      try {
        const skuMap = new Map<string, { orders: number; returns: number, brand: string, myntraSkuCode: string }>();

        let minTime = Infinity;
        let maxTime = -Infinity;

        // Process Orders
        orders.forEach(orderItem => {
          orderItem.data.forEach(row => {
            // Date parsing for reportDays
            const dateKey = Object.keys(row).find(k => {
              const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              return norm.includes('orderdate') || norm.includes('ordercreated') || norm.includes('createdat') || norm.includes('orderrelease');
            });
            if (dateKey && row[dateKey]) {
              const d = parseExcelDate(row[dateKey]);
              if (d) {
                const t = d.getTime();
                if (t < minTime) minTime = t;
                if (t > maxTime) maxTime = t;
              }
            }

            const sku = findValue(row, ['sellerskucode', 'sku', 'sellersku']);
            if (sku) {
              const current = skuMap.get(sku) || {
                orders: 0,
                returns: 0,
                brand: findValue(row, ['brand', 'brandname']),
                myntraSkuCode: findValue(row, ['myntraskucode', 'myntrasku', 'platformsku'])
              };
              current.orders += 1;
              // Update brand/myntraSku if they were missing before
              if (!current.brand) current.brand = findValue(row, ['brand', 'brandname']);
              if (!current.myntraSkuCode) current.myntraSkuCode = findValue(row, ['myntraskucode', 'myntrasku', 'platformsku']);

              skuMap.set(sku, current);
            }
          });
        });

        // Process Returns
        returns.forEach(returnItem => {
          returnItem.data.forEach(row => {
            const sku = findValue(row, ['sellerskucode', 'sku', 'sellersku']);
            if (sku) {
              const current = skuMap.get(sku) || {
                orders: 0,
                returns: 0,
                brand: findValue(row, ['brand', 'brandname']),
                myntraSkuCode: findValue(row, ['myntraskucode', 'myntrasku', 'platformsku'])
              };
              current.returns += 1;
              // Update brand/myntraSku if they were missing before
              if (!current.brand) current.brand = findValue(row, ['brand', 'brandname']);
              if (!current.myntraSkuCode) current.myntraSkuCode = findValue(row, ['myntraskucode', 'myntrasku', 'platformsku']);

              skuMap.set(sku, current);
            }
          });
        });

        const analysisResults: StockResult[] = [];
        skuMap.forEach((data, sku) => {
          analysisResults.push({
            sellerSkuCode: sku,
            myntraSkuCode: data.myntraSkuCode || 'N/A',
            brand: data.brand || 'Unknown',
            orders: data.orders,
            returns: data.returns,
            netOrders: data.orders - data.returns
          });
        });

        let calculatedDays = 30; // fallback
        if (minTime !== Infinity && maxTime !== -Infinity && maxTime > minTime) {
          calculatedDays = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
        }
        setReportDays(calculatedDays);

        setResults(analysisResults);
        setCurrentPage(1); // Reset to first page

        clearInterval(progressInterval);
        setProgress(100);
        setCurrentStage('Complete!');

        setTimeout(() => {
          setIsProcessing(false);
          toast.success('Analysis complete');
        }, 400);

      } catch (error) {
        clearInterval(progressInterval);
        console.error(error);
        toast.error('An error occurred during analysis');
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleClearAll = () => {
    setOrders([]);
    setReturns([]);
    setResults([]);
    setSortConfig({ key: 'netOrders', direction: 'desc' });
    if (ordersInputRef.current) ordersInputRef.current.value = "";
    if (returnsInputRef.current) returnsInputRef.current.value = "";
    toast.info("Upload form cleared.");
  };

  const handleSort = (key: keyof StockResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derive unique brands for filter dropdown
  const uniqueBrands = useMemo(() => {
    const brands = new Set(results.map(r => r.brand));
    return ['All', ...Array.from(brands)].sort();
  }, [results]);

  const filteredAndSortedResults = useMemo(() => {
    let processableResults = results.map(item => {
      const avgNetPerDay = item.netOrders / reportDays;
      return {
        ...item,
        avgOrdersPerDay: Math.round(item.orders / reportDays),
        avgReturnsPerDay: Math.round(item.returns / reportDays),
        req15Days: Math.round(avgNetPerDay * 15),
        req30Days: Math.round(avgNetPerDay * 30)
      };
    });

    // Filter by Brand
    if (selectedBrand !== 'All') {
      processableResults = processableResults.filter(item => item.brand === selectedBrand);
    }

    // Filter by Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      processableResults = processableResults.filter(item =>
        item.sellerSkuCode.toLowerCase().includes(lowerSearch) ||
        item.myntraSkuCode.toLowerCase().includes(lowerSearch) ||
        item.brand.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortConfig !== null) {
      processableResults.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return processableResults;
  }, [results, searchTerm, selectedBrand, sortConfig, reportDays]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const paginatedResults = filteredAndSortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Total summary calculation (on filtered results, ignoring pagination)
  const totalSummary = useMemo(() => {
    return filteredAndSortedResults.reduce((acc, r) => {
      acc.orders += r.orders;
      acc.returns += r.returns;
      acc.netOrders += r.netOrders;
      acc.avgOrdersPerDay += (r.avgOrdersPerDay || 0);
      acc.avgReturnsPerDay += (r.avgReturnsPerDay || 0);
      acc.req15Days += (r.req15Days || 0);
      acc.req30Days += (r.req30Days || 0);
      return acc;
    }, { orders: 0, returns: 0, netOrders: 0, avgOrdersPerDay: 0, avgReturnsPerDay: 0, req15Days: 0, req30Days: 0 });
  }, [filteredAndSortedResults]);

  const isReadyToSubmit = orders.length > 0 && returns.length > 0;
  const totalOrdersSize = orders.reduce((sum, item) => sum + item.file.size, 0);
  const totalReturnsSize = returns.reduce((sum, item) => sum + item.file.size, 0);

  const handleDownloadExcel = () => {
    if (filteredAndSortedResults.length === 0) {
      toast.error("No data to download!");
      return;
    }

    const dataToExport = filteredAndSortedResults.map((r) => ({
      'Brand': r.brand,
      'Myntra SKU': r.myntraSkuCode,
      'Seller SKU': r.sellerSkuCode,
      'Orders': r.orders,
      'Returns': r.returns,
      'Net Orders': r.netOrders,
      'Avg Orders/Day': r.avgOrdersPerDay,
      'Avg Returns/Day': r.avgReturnsPerDay,
      '15 Days Avg (Net)': r.req15Days,
      '30 Days Avg (Net)': r.req30Days,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Analysis");
    XLSX.writeFile(wb, "Myntra_Stock_Analysis.xlsx");
    toast.success("Excel report downloaded successfully!");
  };

  return (
    <DashboardLayout title="Myntra Stock Analysis">
      <div className="space-y-4 sm:space-y-6">
        {/* Real-time Progress Modal */}
        <ProcessingProgressModal
          isOpen={isProcessing}
          progress={progress}
          currentStage={currentStage}
        />

        {/* Header Information Banner matching Amazon Order Process */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Myntra Stock Analysis
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Upload Orders and Returns Excel/CSV files to calculate net stock requirements.
              </p>
            </div>

            {/* Counter Badge */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 self-start md:self-center">
              <div className="inline-flex h-10 sm:h-11 items-center px-3.5 sm:px-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#080B11] shadow-xs">
                <div className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                  <span className={orders.length > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}>
                    {orders.length} Order{orders.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1.5">•</span>
                  <span className={returns.length > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}>
                    {returns.length} Return{returns.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Upload Sections */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:gap-6 lg:grid-cols-2">
          {/* ======================================================== */}
          {/* SECTION 1: ORDERS FILE UPLOAD */}
          {/* ======================================================== */}
          <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm transition-all hover:border-[#E8C16D]/40 hover:shadow-md dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 sm:pb-3.5 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0A0E1A] dark:text-white text-sm sm:text-base truncate">
                    1. Orders File {orders.length > 0 ? `(${orders.length})` : ""}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Upload one or multiple .xlsx, .xls, .csv files
                  </p>
                </div>
              </div>

              {orders.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {orders.length} Ready
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shrink-0">
                  Required
                </span>
              )}
            </div>

            {/* Upload Box / Selected Files View */}
            <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-between">
              {orders.length === 0 ? (
                <div
                  onClick={() => ordersInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(false);
                    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'orders');
                  }}
                  className={`group relative flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                    isDraggingOrders
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] hover:border-[#E8C16D] hover:bg-[#FFFDF5] dark:hover:bg-[#0D121D]"
                  }`}
                >
                  <div className="mb-2.5 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-white dark:bg-[#0B0F17] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] shadow-xs transition-all group-hover:scale-110 group-hover:border-[#E8C16D] group-hover:text-blue-600">
                    <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Click to upload or drag & drop Orders
                  </p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-none">
                    Select one or multiple Excel / CSV (<code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">.xlsx, .csv</code>) files
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#0B0F17] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] shadow-2xs group-hover:border-[#E8C16D] transition active:scale-[0.98]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
                    Browse Orders
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => ordersInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingOrders(false);
                    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'orders');
                  }}
                  className={`flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] flex-col justify-between rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer ${
                    isDraggingOrders
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-[#E8C16D]/70"
                  }`}
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable file cards */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="max-h-36 sm:max-h-44 overflow-y-auto space-y-2 pr-1 cursor-default"
                    >
                      {orders.map((item, idx) => (
                        <div
                          key={`${item.file.name}_${idx}`}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-2.5 sm:p-3 shadow-2xs hover:border-[#E8C16D]/40 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#0A0E1A] dark:text-white" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {formatFileSize(item.file.size)} • {item.data.length} rows
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrders((prev) => prev.filter((_, i) => i !== idx));
                              setResults([]);
                            }}
                            title="Remove this file"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer summary bar */}
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-900/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 min-w-0 truncate">
                      <span className="whitespace-nowrap">
                        {orders.length} file{orders.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate">
                        {formatFileSize(totalOrdersSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          ordersInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] px-3 py-1.5 rounded-xl border border-[#E8C16D] dark:border-[#E8C16D]/40 ring-2 ring-[#E8C16D]/20 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                        <span>Add More</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrders([]);
                          setResults([]);
                          if (ordersInputRef.current) ordersInputRef.current.value = "";
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-[#080B11] hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 hover:border-red-300 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={ordersInputRef}
                type="file"
                hidden
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files) handleFileUpload(e.target.files, 'orders');
                }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: RETURNS FILE UPLOAD */}
          {/* ======================================================== */}
          <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm transition-all hover:border-[#E8C16D]/40 hover:shadow-md dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3 sm:pb-3.5 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0A0E1A] dark:text-white text-sm sm:text-base truncate">
                    2. Returns File {returns.length > 0 ? `(${returns.length})` : ""}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    Upload one or multiple .xlsx, .xls, .csv files
                  </p>
                </div>
              </div>

              {returns.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {returns.length} Ready
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shrink-0">
                  Required
                </span>
              )}
            </div>

            {/* Upload Box / Selected Files View */}
            <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-between">
              {returns.length === 0 ? (
                <div
                  onClick={() => returnsInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(false);
                    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'returns');
                  }}
                  className={`group relative flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                    isDraggingReturns
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] hover:border-[#E8C16D] hover:bg-[#FFFDF5] dark:hover:bg-[#0D121D]"
                  }`}
                >
                  <div className="mb-2.5 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-white dark:bg-[#0B0F17] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] shadow-xs transition-all group-hover:scale-110 group-hover:border-[#E8C16D] group-hover:text-amber-600">
                    <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                    Click to upload or drag & drop Returns
                  </p>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-none">
                    Select one or multiple Excel / CSV (<code className="font-mono text-amber-600 dark:text-amber-400 font-semibold">.xlsx, .csv</code>) files
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#0B0F17] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] shadow-2xs group-hover:border-[#E8C16D] transition active:scale-[0.98]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />
                    Browse Returns
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => returnsInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReturns(false);
                    if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'returns');
                  }}
                  className={`flex min-h-[190px] sm:min-h-[210px] xl:min-h-[230px] flex-col justify-between rounded-2xl border-2 p-3 sm:p-4 transition-all cursor-pointer ${
                    isDraggingReturns
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E]"
                      : "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-[#E8C16D]/70"
                  }`}
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable file cards */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="max-h-36 sm:max-h-44 overflow-y-auto space-y-2 pr-1 cursor-default"
                    >
                      {returns.map((item, idx) => (
                        <div
                          key={`${item.file.name}_${idx}`}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-2.5 sm:p-3 shadow-2xs hover:border-[#E8C16D]/40 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#0A0E1A] dark:text-white" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {formatFileSize(item.file.size)} • {item.data.length} rows
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReturns((prev) => prev.filter((_, i) => i !== idx));
                              setResults([]);
                            }}
                            title="Remove this file"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer summary bar */}
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/70 dark:border-emerald-900/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 min-w-0 truncate">
                      <span className="whitespace-nowrap">
                        {returns.length} file{returns.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate">
                        {formatFileSize(totalReturnsSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          returnsInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] px-3 py-1.5 rounded-xl border border-[#E8C16D] dark:border-[#E8C16D]/40 ring-2 ring-[#E8C16D]/20 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                        <span>Add More</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReturns([]);
                          setResults([]);
                          if (returnsInputRef.current) returnsInputRef.current.value = "";
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-[#080B11] hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 hover:border-red-300 shadow-xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        <span>Clear All</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={returnsInputRef}
                type="file"
                hidden
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files) handleFileUpload(e.target.files, 'returns');
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls Bar matching Amazon Order Process */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
          <button
            type="button"
            disabled={orders.length === 0 && returns.length === 0}
            onClick={handleClearAll}
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#080B11] px-4 sm:px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 transition shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-100 dark:disabled:hover:bg-[#080B11] disabled:hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear Files</span>
          </button>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              disabled={!isReadyToSubmit || isProcessing}
              onClick={handleAnalyze}
              className="w-full sm:w-auto inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-6 sm:px-8 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing Data...</span>
                </>
              ) : isReadyToSubmit ? (
                <>
                  <span>
                    Analyze Stock ({orders.length} Order{orders.length !== 1 ? "s" : ""}, {returns.length} Return{returns.length !== 1 ? "s" : ""})
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Upload Required Files</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results View */}
        {results.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Days Info */}
              <div className="inline-flex h-11 items-center px-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] shadow-2xs gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Report Days:
                </span>
                <span className="text-sm font-black text-[#0A0E1A] dark:text-white">{reportDays}</span>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search SKU or Brand..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11 pl-11 pr-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-xs sm:text-sm font-medium text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0A0E1A] dark:focus:border-[#E8C16D] focus:ring-1 focus:ring-[#0A0E1A] dark:focus:ring-[#E8C16D] shadow-2xs transition"
                />
              </div>

              {/* Filter and Download Buttons */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div className="relative h-11 w-full sm:w-56" ref={brandDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                    className="w-full h-full bg-[#0A0E1A] dark:bg-[#080B11] text-[#E8C16D] pl-4 pr-10 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between border border-transparent dark:border-white/[0.08] hover:bg-slate-900 dark:hover:bg-white/[0.04] active:scale-[0.98] transition shadow-xs focus:outline-none cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedBrand === 'All' ? 'All Brands' : selectedBrand}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 absolute right-3.5 pointer-events-none stroke-[2.5] transition-transform duration-200 ${
                        isBrandDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isBrandDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-full bg-[#0A0E1A] dark:bg-[#080B11] rounded-2xl border border-slate-800 dark:border-white/[0.1] shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-100">
                      {uniqueBrands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            setSelectedBrand(brand);
                            setCurrentPage(1);
                            setIsBrandDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            selectedBrand === brand
                              ? 'bg-[#E8C16D] text-[#0A0E1A] shadow-xs'
                              : 'text-slate-200 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          {brand === 'All' ? 'All Brands' : brand}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="h-11 bg-[#E8C16D] text-[#0A0E1A] px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#d4af5a] transition active:scale-[0.98] shadow-xs focus:outline-none whitespace-nowrap cursor-pointer"
                  title="Download Excel Report"
                >
                  <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm flex flex-col">
              <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full text-center border-collapse whitespace-nowrap font-sans text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#0A0E1A] dark:bg-[#080B11] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08]">
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('brand')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Brand <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('myntraSkuCode')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Myntra SKU <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('sellerSkuCode')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Seller SKU <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('orders')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Orders <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('returns')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Returns <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('netOrders')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Net Orders <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('avgOrdersPerDay')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Avg Orders/Day <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('avgReturnsPerDay')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          Avg Returns/Day <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('req15Days')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          15 Days Avg <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                      <th
                        className="p-3.5 sm:p-4 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-900 dark:hover:bg-white/[0.04] transition-colors select-none"
                        onClick={() => handleSort('req30Days')}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          30 Days Avg <ArrowUpDown size={14} className="opacity-70" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm">
                    {paginatedResults.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            <p className="font-bold text-[#0A0E1A] dark:text-white">No results found</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Try adjusting your search query or brand filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedResults.map((result, idx) => (
                        <tr
                          key={idx}
                          className="transition-colors hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06]"
                        >
                          <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300">{result.brand}</td>
                          <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300">{result.myntraSkuCode}</td>
                          <td className="p-3.5 sm:p-4 font-bold text-[#0A0E1A] dark:text-white">
                            {result.sellerSkuCode}
                          </td>
                          <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300">{result.orders}</td>
                          <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300">{result.returns}</td>
                          <td className="p-3.5 sm:p-4 font-black text-[#0A0E1A] dark:text-white">
                            {result.netOrders}
                          </td>
                          <td className="p-3.5 sm:p-4 font-medium text-slate-800 dark:text-slate-200">
                            {result.avgOrdersPerDay}
                          </td>
                          <td className="p-3.5 sm:p-4 font-medium text-slate-800 dark:text-slate-200">
                            {result.avgReturnsPerDay}
                          </td>
                          <td className="p-3.5 sm:p-4 font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {result.req15Days}
                          </td>
                          <td className="p-3.5 sm:p-4 font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {result.req30Days}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredAndSortedResults.length > 0 && (
                    <tfoot className="bg-[#FAF8F5] dark:bg-[#080B11] font-bold border-t-2 border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-3.5 sm:p-4 text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-right"
                        >
                          Total
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {totalSummary.orders}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {totalSummary.returns}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-black text-[#0A0E1A] dark:text-white">
                          {totalSummary.netOrders}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                          {Math.round(totalSummary.avgOrdersPerDay)}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                          {Math.round(totalSummary.avgReturnsPerDay)}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-black text-[#B88728] dark:text-[#E8C16D]">
                          {totalSummary.req15Days}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs sm:text-sm font-black text-[#B88728] dark:text-[#E8C16D]">
                          {totalSummary.req30Days}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Footer Pagination Bar */}
              {filteredAndSortedResults.length > 0 && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={filteredAndSortedResults.length}
                  limit={itemsPerPage}
                  itemName="records"
                  variant="dark"
                  className="bg-[#0A0E1A] dark:bg-[#080B11] px-4 py-3.5 sm:py-4 mt-auto border-t border-slate-800 dark:border-white/[0.08]"
                  onPageChange={setCurrentPage}
                  onLimitChange={(newLimit) => {
                    setItemsPerPage(newLimit);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
