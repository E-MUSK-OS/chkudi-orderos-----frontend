"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Search, ArrowUpDown, FileText, CheckCircle2, RotateCcw, ArrowRight, Trash2, ChevronLeft, ChevronRight, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/Dashboard/layout/DashboardLayout';
import Button from "@/components/ui/Button";
import ProcessingProgressModal from './components/ProcessingProgressModal';

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
  const [orders, setOrders] = useState<{file: File, data: any[]}[]>([]);
  const [returns, setReturns] = useState<{file: File, data: any[]}[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
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

  const handleDownloadExcel = () => {
    if (filteredAndSortedResults.length === 0) {
      toast.error("No data to download!");
      return;
    }

    const dataToExport = filteredAndSortedResults.map(r => ({
      'Brand': r.brand,
      'Myntra SKU': r.myntraSkuCode,
      'Seller SKU': r.sellerSkuCode,
      'Orders': r.orders,
      'Returns': r.returns,
      'Net Orders': r.netOrders,
      'Avg Orders/Day': r.avgOrdersPerDay,
      'Avg Returns/Day': r.avgReturnsPerDay,
      '15 Days Avg (Net)': r.req15Days,
      '30 Days Avg (Net)': r.req30Days
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Analysis");
    XLSX.writeFile(wb, "Myntra_Stock_Analysis.xlsx");
    toast.success("Excel report downloaded successfully!");
  };

  return (
    <DashboardLayout title="Myntra Stock Analysis">
      <div className="space-y-6 w-full p-2 sm:p-4">
        <ProcessingProgressModal
          isOpen={isProcessing}
          progress={progress}
          currentStage={currentStage}
        />

        {/* Header Information Banner */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-[#FFF9EC] px-2.5 py-1 text-xs font-semibold text-[#B88728] border border-[#E8C16D]/30">
                  Stock Analysis
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Auto-Calculate Net Requirements
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A]">
                Upload Orders and Returns
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Upload your Myntra Orders and Returns Excel/CSV files to automatically cross-verify SKUs and calculate exact net stock required.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:px-5 py-2.5 sm:py-3.5 text-left md:text-right shadow-2xs w-full sm:w-auto">
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Files Ready
                </div>
                <div className="text-base sm:text-lg font-black text-[#0A0E1A] mt-0.5 flex items-center gap-2">
                  <span className={orders.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={returns.length > 0 ? "text-emerald-600" : "text-slate-400"}>
                    {returns.length} {returns.length === 1 ? 'Return' : 'Returns'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Upload Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SECTION 1: ORDERS UPLOAD */}
          <div className="flex flex-col rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A0E1A] text-sm sm:text-base">
                    1. Orders File
                  </h3>
                  <p className="text-xs text-slate-500">Upload orders Excel/CSV</p>
                </div>
              </div>

              {orders.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {orders.length} Ready
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  Required
                </span>
              )}
            </div>

            <div className="mt-4 sm:mt-5 flex-1 flex flex-col gap-3">
              <div
                onClick={() => ordersInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOrders(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingOrders(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDraggingOrders(false); if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'orders'); }}
                className={`group relative flex ${orders.length > 0 ? 'min-h-[100px] py-3' : 'min-h-[170px] sm:min-h-[220px] p-4 sm:p-6'} cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all ${isDraggingOrders
                    ? "border-[#E8C16D] bg-[#FFF9EC]"
                    : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                  }`}
              >
                {!orders.length && (
                  <div className="mb-2 sm:mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-blue-500">
                    <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                )}
                <p className="text-xs sm:text-sm font-semibold text-[#0A0E1A]">{orders.length > 0 ? 'Click or drag to add more orders files' : 'Click to upload or drag & drop'}</p>
                {!orders.length && <p className="mt-1 text-[11px] sm:text-xs text-slate-500">Excel or CSV files only</p>}
                {!orders.length && (
                  <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" /> Browse Orders
                  </div>
                )}
              </div>

              {orders.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/20 p-2 max-h-[140px] overflow-y-auto">
                  {orders.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#0A0E1A]" title={item.file.name}>{item.file.name}</p>
                          <p className="text-[10px] text-slate-500">{formatFileSize(item.file.size)} • {item.data.length} rows</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOrders(prev => prev.filter((_, i) => i !== idx));
                          setResults([]);
                        }}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={ordersInputRef} type="file" hidden multiple accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files) handleFileUpload(e.target.files, 'orders'); }} />
            </div>
          </div>

          {/* SECTION 2: RETURNS UPLOAD */}
          <div className="flex flex-col rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A0E1A] text-sm sm:text-base">
                    2. Returns File
                  </h3>
                  <p className="text-xs text-slate-500">Upload returns Excel/CSV</p>
                </div>
              </div>

              {returns.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {returns.length} Ready
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  Required
                </span>
              )}
            </div>

            <div className="mt-4 sm:mt-5 flex-1 flex flex-col gap-3">
              <div
                onClick={() => returnsInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingReturns(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingReturns(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDraggingReturns(false); if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files, 'returns'); }}
                className={`group relative flex ${returns.length > 0 ? 'min-h-[100px] py-3' : 'min-h-[170px] sm:min-h-[220px] p-4 sm:p-6'} cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all ${isDraggingReturns
                    ? "border-[#E8C16D] bg-[#FFF9EC]"
                    : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                  }`}
              >
                {!returns.length && (
                  <div className="mb-2 sm:mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-amber-500">
                    <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                )}
                <p className="text-xs sm:text-sm font-semibold text-[#0A0E1A]">{returns.length > 0 ? 'Click or drag to add more returns files' : 'Click to upload or drag & drop'}</p>
                {!returns.length && <p className="mt-1 text-[11px] sm:text-xs text-slate-500">Excel or CSV files only</p>}
                {!returns.length && (
                  <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" /> Browse Returns
                  </div>
                )}
              </div>

              {returns.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/20 p-2 max-h-[140px] overflow-y-auto">
                  {returns.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#0A0E1A]" title={item.file.name}>{item.file.name}</p>
                          <p className="text-[10px] text-slate-500">{formatFileSize(item.file.size)} • {item.data.length} rows</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReturns(prev => prev.filter((_, i) => i !== idx));
                          setResults([]);
                        }}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={returnsInputRef} type="file" hidden multiple accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files) handleFileUpload(e.target.files, 'returns'); }} />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth={false}
            disabled={orders.length === 0 && returns.length === 0}
            onClick={handleClearAll}
            leftIcon={<RotateCcw className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Clear Files
          </Button>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth={false}
              loading={isProcessing}
              disabled={!isReadyToSubmit || isProcessing}
              onClick={handleAnalyze}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto min-w-0 sm:min-w-[200px] text-xs sm:text-sm"
            >
              {isProcessing
                ? "Analyzing Data..."
                : isReadyToSubmit
                  ? "Analyze Stock"
                  : "Upload Files"}
            </Button>
          </div>
        </div>

        {/* Analysis Results */}
        {results.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Days Info */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 h-10 w-full sm:w-auto">
                <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">Report Days:</span>
                <span className="text-[15px] font-bold text-slate-800">{reportDays}</span>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search SKU or Brand..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 text-[15px] font-medium focus:outline-none focus:ring-1 focus:ring-[#0A0E1A] h-10"
                />
              </div>
              
              {/* Filter */}
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-full sm:w-56" ref={brandDropdownRef}>
                  <button
                    onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                    className="w-full h-full bg-[#0A0E1A] text-[#E8C16D] pl-4 pr-10 py-2 text-[15px] font-semibold flex items-center justify-between focus:outline-none"
                  >
                    <span className="truncate">{selectedBrand === 'All' ? 'All Brands' : selectedBrand}</span>
                    <ChevronDown className="h-4 w-4 absolute right-4 pointer-events-none stroke-[2.5]" />
                  </button>
                  {isBrandDropdownOpen && (
                    <div className="absolute top-full left-0 mt-0.5 w-full bg-[#0A0E1A] shadow-xl z-50 max-h-60 overflow-auto">
                      {uniqueBrands.map(brand => (
                        <button
                          key={brand}
                          onClick={() => {
                            setSelectedBrand(brand);
                            setCurrentPage(1);
                            setIsBrandDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[15px] font-semibold transition-colors ${
                            selectedBrand === brand
                              ? 'bg-[#E8C16D] text-[#0A0E1A]'
                              : 'text-white hover:bg-[#E8C16D] hover:text-[#0A0E1A]'
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
                  onClick={handleDownloadExcel}
                  className="h-10 bg-[#E8C16D] text-[#0A0E1A] px-4 py-2 text-[15px] font-semibold flex items-center gap-2 hover:bg-[#D4A343] transition-colors focus:outline-none whitespace-nowrap"
                  title="Download Excel Report"
                >
                  <FileSpreadsheet className="h-5 w-5 stroke-[2.5]" />
                  Download
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="border border-slate-200 shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#0A0E1A]">
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('brand')}>
                        <div className="flex items-center justify-center gap-1.5">Brand <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('myntraSkuCode')}>
                        <div className="flex items-center justify-center gap-1.5">Myntra SKU <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('sellerSkuCode')}>
                        <div className="flex items-center justify-center gap-1.5">Seller SKU <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('orders')}>
                        <div className="flex items-center justify-center gap-1.5">Orders <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('returns')}>
                        <div className="flex items-center justify-center gap-1.5">Returns <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('netOrders')}>
                        <div className="flex items-center justify-center gap-1.5">Net Orders <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('avgOrdersPerDay')}>
                        <div className="flex items-center justify-center gap-1.5">Avg Orders/Day <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('avgReturnsPerDay')}>
                        <div className="flex items-center justify-center gap-1.5">Avg Returns/Day <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('req15Days')}>
                        <div className="flex items-center justify-center gap-1.5">15 Days Avg <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                      <th className="p-3.5 text-xs font-bold text-[#E8C16D] uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('req30Days')}>
                        <div className="flex items-center justify-center gap-1.5">30 Days Avg <ArrowUpDown size={14} className="opacity-50" /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedResults.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-6 w-6 text-slate-300" />
                            <p className="text-sm">No results found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedResults.map((result, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/50">
                          <td className="p-4 text-sm text-slate-700">{result.brand}</td>
                          <td className="p-4 text-sm text-slate-700">{result.myntraSkuCode}</td>
                          <td className="p-4 text-sm font-medium text-[#0A0E1A]">{result.sellerSkuCode}</td>
                          <td className="p-4 text-sm text-slate-700">{result.orders}</td>
                          <td className="p-4 text-sm text-slate-700">{result.returns}</td>
                          <td className="p-4 text-sm font-bold text-[#0A0E1A]">{result.netOrders}</td>
                          <td className="p-4 text-sm font-medium text-[#0A0E1A]">{result.avgOrdersPerDay}</td>
                          <td className="p-4 text-sm font-medium text-[#0A0E1A]">{result.avgReturnsPerDay}</td>
                          <td className="p-4 text-sm font-medium text-[#0A0E1A]">{result.req15Days}</td>
                          <td className="p-4 text-sm font-medium text-[#0A0E1A]">{result.req30Days}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredAndSortedResults.length > 0 && (
                    <tfoot className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-4 text-sm text-slate-900 uppercase tracking-wider text-right">Total</td>
                        <td className="p-4 text-sm text-slate-900">{totalSummary.orders}</td>
                        <td className="p-4 text-sm text-slate-900">{totalSummary.returns}</td>
                        <td className="p-4 text-sm text-[#0A0E1A] font-bold">{totalSummary.netOrders}</td>
                        <td className="p-4 text-sm text-[#0A0E1A] font-bold">{Math.round(totalSummary.avgOrdersPerDay)}</td>
                        <td className="p-4 text-sm text-[#0A0E1A] font-bold">{Math.round(totalSummary.avgReturnsPerDay)}</td>
                        <td className="p-4 text-sm text-[#0A0E1A] font-bold">{totalSummary.req15Days}</td>
                        <td className="p-4 text-sm text-[#0A0E1A] font-bold">{totalSummary.req30Days}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Footer Pagination Bar */}
              {filteredAndSortedResults.length > 0 && (
                <div className="bg-[#0A0E1A] px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                  <div className="text-sm font-medium text-white">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedResults.length)} of {filteredAndSortedResults.length} records
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <span>Rows</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white text-black px-2 py-1.5 text-sm focus:outline-none appearance-none pr-7 cursor-pointer"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.25rem center", backgroundRepeat: "no-repeat", backgroundSize: "1em 1em" }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-[2px]">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 bg-[#E8C16D] text-black px-3 py-1.5 text-sm font-semibold hover:bg-[#D4A343] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </button>
                      
                      <div className="bg-white text-black px-4 py-1.5 text-sm font-semibold min-w-[3rem] text-center">
                        {currentPage}/{totalPages}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 bg-[#E8C16D] text-black px-3 py-1.5 text-sm font-semibold hover:bg-[#D4A343] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
