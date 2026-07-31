"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { skuMappingService } from "../services/skuMapping.service";
import { getToken } from "@/utils/auth";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  useSaveSheetDraft,
  useSheetDraft,
  useDeleteSheetDraft,
} from "../hooks/useSheetDraft";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface GenerateRow {
  id: number;
  shortSku: string;
  barcodeSku: string;
  ordercookSku: string;

  loading: boolean;

  error: boolean;

  errorMessage: string;
}

interface SkuSuggestion {
  id: string;
  shortSku: string;
}

export default function GenerateSheetModal({ open, onClose }: Props) {
  // const STORAGE_KEY = "sku-generate-sheet";
  // const STORAGE_EXPIRE_HOURS = 24;
  const DEFAULT_ROWS: GenerateRow[] = [
    {
      id: 1,
      shortSku: "",
      barcodeSku: "",
      ordercookSku: "",
      loading: false,
      error: false,
      errorMessage: "",
    },
  ];

  // const [rows, setRows] = useState<GenerateRow[]>(() => {
  //   if (typeof window === "undefined") {
  //     return DEFAULT_ROWS;
  //   }

  //   const saved = localStorage.getItem(STORAGE_KEY);

  //   if (!saved) return DEFAULT_ROWS;

  //   try {
  //     const parsed = JSON.parse(saved);

  //     if (Date.now() > parsed.expiresAt) {
  //       localStorage.removeItem(STORAGE_KEY);
  //       return DEFAULT_ROWS;
  //     }

  //     return parsed.rows?.length ? parsed.rows : DEFAULT_ROWS;
  //   } catch {
  //     localStorage.removeItem(STORAGE_KEY);
  //     return DEFAULT_ROWS;
  //   }
  // });
  const [rows, setRows] = useState<GenerateRow[]>(DEFAULT_ROWS);

  const saveDraftMutation = useSaveSheetDraft();

  const deleteDraftMutation = useDeleteSheetDraft();

  const { data: draftResponse } = useSheetDraft();

  const isInitialLoad = useRef(true);

  const [suggestions, setSuggestions] = useState<
    { id: string; shortSku: string }[]
  >([]);

  const [activeRow, setActiveRow] = useState<number | null>(null);

  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [copiedRow, setCopiedRow] = useState<GenerateRow | null>(null);

  const addNewRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        shortSku: "",
        barcodeSku: "",
        ordercookSku: "",

        loading: false,

        error: false,

        errorMessage: "",
      },
    ]);
  };

  const deleteRow = (id: number) => {
    setRows((prev) => {
      const updated = prev.filter((row) => row.id !== id);

      return updated.length ? updated : DEFAULT_ROWS;
    });
  };

  // const saveRows = (data: GenerateRow[]) => {
  //   console.log("Saving Rows:", data);

  //   localStorage.setItem(
  //     STORAGE_KEY,
  //     JSON.stringify({
  //       expiresAt: Date.now() + STORAGE_EXPIRE_HOURS * 60 * 60 * 1000,
  //       rows: data,
  //     }),
  //   );
  // };

  //   useEffect(() => {
  //     const saved = localStorage.getItem(STORAGE_KEY);

  //     console.log("Saved from localStorage:", saved);

  //     if (!saved) return;

  //     try {
  //       const parsed = JSON.parse(saved);

  //       console.log("Parsed:", parsed);

  //       if (Date.now() > parsed.expiresAt) {
  //         console.log("Expired");
  //         localStorage.removeItem(STORAGE_KEY);
  //         return;
  //       }

  //       if (parsed.rows?.length) {
  //         console.log("Restoring rows:", parsed.rows);
  //         setRows(parsed.rows);
  //       }
  //     } catch (e) {
  //       console.log("Parse Error", e);
  //       localStorage.removeItem(STORAGE_KEY);
  //     }
  //   }, []);
  //   const [isRestored, setIsRestored] = useState(false);

  //   useEffect(() => {
  //     const saved = localStorage.getItem(STORAGE_KEY);

  //     if (saved) {
  //       try {
  //         const parsed = JSON.parse(saved);

  //         if (Date.now() <= parsed.expiresAt && parsed.rows?.length) {
  //           setRows(parsed.rows);
  //         } else {
  //           localStorage.removeItem(STORAGE_KEY);
  //         }
  //       } catch {
  //         localStorage.removeItem(STORAGE_KEY);
  //       }
  //     }

  //     setIsRestored(true);
  //   }, []);

  //   useEffect(() => {
  //     if (!isRestored) return;

  //     saveRows(rows);
  //   }, [rows, isRestored]);

  // useEffect(() => {
  //   saveRows(rows);
  // }, [rows]);

  const clearSheet = () => {
    deleteDraftMutation.mutate();

    // setRows([
    //   {
    //     id: 1,
    //     shortSku: "",
    //     barcodeSku: "",
    //     ordercookSku: "",
    //     loading: false,
    //     error: false,
    //     errorMessage: "",
    //   },
    // ]);
    setRows(DEFAULT_ROWS);

    toast.success("Sheet cleared successfully.");
  };

  const searchSku = async (shortSku: string, index: number) => {
    // Loading
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              loading: true,
              error: false,
              errorMessage: "",
            }
          : row,
      ),
    );

    try {
      const response = await skuMappingService.search(shortSku, getToken());

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                barcodeSku: response.data.barcodeSku,

                ordercookSku: response.data.ordercookSku,

                loading: false,

                error: false,

                errorMessage: "",
              }
            : row,
        ),
      );

      return true;
    } catch (error: any) {
      toast.error(error.message || "SKU Not Found");

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                barcodeSku: "",
                ordercookSku: "",
                loading: false,
                error: true,
                errorMessage: "SKU Not Found",
              }
            : row,
        ),
      );

      return false;
    }
  };

  const getSuggestions = (value: string, rowIndex: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setActiveRow(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await skuMappingService.suggestions(value, getToken());

        console.log(response);

        setSuggestions(response.data);

        setActiveRow(rowIndex);

        setSelectedSuggestion(0);
      } catch {
        setSuggestions([]);
        setActiveRow(null);
      }
    }, 300);
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    const lastIndex = rows.length - 1;

    inputRefs.current[lastIndex]?.focus();
  }, [rows.length]);

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("SKU Mapping");

    worksheet.columns = [
      {
        header: "Short SKU",
        key: "shortSku",
        width: 35,
      },
      {
        header: "Barcode SKU",
        key: "barcodeSku",
        width: 35,
      },
      {
        header: "Barcode Qty",
        key: "barcodeQty",
        width: 15,
      },
      {
        header: "OrderCook SKU",
        key: "ordercookSku",
        width: 35,
      },
      {
        header: "OrderCook Qty",
        key: "ordercookQty",
        width: 15,
      },
    ];

    // Header Style
    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "E2E8F0",
      },
    };

    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

    // const groupedRows = new Map<
    //   string,
    //   {
    //     shortSku: string;
    //     barcodeSku: string;
    //     ordercookSku: string;
    //     barcodeQty: number;
    //     ordercookQty: number;
    //   }
    // >();

    // rows
    //   .filter(
    //     (row) =>
    //       row.shortSku.trim() &&
    //       row.barcodeSku.trim() &&
    //       row.ordercookSku.trim(),
    //   )
    //   .forEach((row) => {
    //     // Same SKU + Barcode + OrderCook ne group karo
    //     const key = `${row.shortSku}|${row.barcodeSku}|${row.ordercookSku}`;

    //     if (groupedRows.has(key)) {
    //       groupedRows.get(key)!.barcodeQty += 1;
    //       groupedRows.get(key)!.ordercookQty += 1;
    //     } else {
    //       groupedRows.set(key, {
    //         shortSku: row.shortSku,
    //         barcodeSku: row.barcodeSku,
    //         ordercookSku: row.ordercookSku,
    //         barcodeQty: 1,
    //         ordercookQty: 1,
    //       });
    //     }
    //   });

    // // Excel ma unique rows add karo
    // groupedRows.forEach((item) => {
    //   worksheet.addRow({
    //     shortSku: item.shortSku,
    //     barcodeSku: item.barcodeSku,
    //     barcodeQty: item.barcodeQty,
    //     ordercookSku: item.ordercookSku,
    //     ordercookQty: item.ordercookQty,
    //   });
    // });

    rows
      .filter(
        (row) =>
          row.shortSku.trim() &&
          row.barcodeSku.trim() &&
          row.ordercookSku.trim(),
      )
      .forEach((row) => {
        worksheet.addRow({
          shortSku: row.shortSku,
          barcodeSku: row.barcodeSku,
          barcodeQty: 1,
          ordercookSku: row.ordercookSku,
          ordercookQty: 1,
        });
      });

    // ===============================
    // OrderCook Summary Table
    // ===============================

    // 2 Blank Rows
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Summary Start Row
    const summaryStartRow = 1;

    // Heading
    worksheet.getCell(`I${summaryStartRow}`).value = "Barcode SKU";
    worksheet.getCell(`J${summaryStartRow}`).value = "OrderCook SKU";
    worksheet.getCell(`K${summaryStartRow}`).value = "Qty";

    // Heading Style
    ["I", "J", "K"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${summaryStartRow}`);

      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "E2E8F0",
        },
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

    // Count OrderCook SKU
    const summaryMap = new Map<
      string,
      {
        barcodeSku: string;
        ordercookSku: string;
        qty: number;
      }
    >();

    rows
      .filter((row) => row.barcodeSku.trim() && row.ordercookSku.trim())
      .forEach((row) => {
        const key = `${row.barcodeSku}|${row.ordercookSku}`;

        if (summaryMap.has(key)) {
          summaryMap.get(key)!.qty += 1;
        } else {
          summaryMap.set(key, {
            barcodeSku: row.barcodeSku,
            ordercookSku: row.ordercookSku,
            qty: 1,
          });
        }
      });

    // Add Summary Data
    let currentRow = summaryStartRow + 1;

    summaryMap.forEach((item) => {
      worksheet.getCell(`I${currentRow}`).value = item.barcodeSku;
      worksheet.getCell(`J${currentRow}`).value = item.ordercookSku;
      worksheet.getCell(`K${currentRow}`).value = item.qty;

      ["I", "J", "K"].forEach((col) => {
        worksheet.getCell(`${col}${currentRow}`).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
        };
      });

      currentRow++;
    });

    // Width
    worksheet.getColumn("I").width = 35;
    worksheet.getColumn("J").width = 35;
    worksheet.getColumn("K").width = 15;

    const buffer = await workbook.xlsx.writeBuffer();

    const today = new Date();

    const fileName = `SKU-Mapping-${today.toISOString().split("T")[0]}.xlsx`;

    saveAs(new Blob([buffer]), fileName);

    toast.success("Excel downloaded successfully.");
    // deleteDraftMutation.mutate();

    // setRows(DEFAULT_ROWS);
  };

  useEffect(() => {
    if (draftResponse?.data?.rows?.length) {
      setRows(
        draftResponse.data.rows.map((row: any, index: number) => ({
          id: Date.now() + index,

          shortSku: row.shortSku,

          barcodeSku: row.barcodeSku,

          ordercookSku: row.ordercookSku,

          loading: false,

          error: false,

          errorMessage: "",
        })),
      );
    }

    isInitialLoad.current = false;
  }, [draftResponse]);

  useEffect(() => {
    if (isInitialLoad.current) return;

    const timer = setTimeout(() => {
      const payload = rows
        .filter((row) => row.shortSku.trim())
        .map((row) => ({
          shortSku: row.shortSku,
          barcodeSku: row.barcodeSku,
          ordercookSku: row.ordercookSku,
        }));

      saveDraftMutation.mutate(payload);
    }, 5000);

    return () => clearTimeout(timer);
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] w-[calc(100vw-22rem)] max-w-none flex-col p-0">
        <DialogHeader className="border-b bg-[#0A0E1A] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#E8C16D]">
                Generate Excel Sheet
              </DialogTitle>

              <p className="mt-1 text-lg text-white">
                Scan or enter Short SKU. Barcode SKU and OrderCook SKU are
                filled automatically.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-end pt-5 pr-7">
          <Button variant="primary" onClick={clearSheet} className="w-50">
            Clear Sheet
          </Button>
        </div>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="h-full overflow-auto border">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0A0E1A] text-white text-lg">
                <tr>
                  <th className="w-16 border px-4 py-3 text-left">#</th>

                  <th className="w-[40%] border px-4 py-3 text-left">
                    Short SKU
                  </th>

                  <th className="w-[30%] border px-4 py-3 text-left">
                    Barcode SKU
                  </th>

                  <th className="w-[30%] border px-4 py-3 text-left">
                    OrderCook SKU
                  </th>
                  <th className="w-24 border px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border px-4 py-3">{index + 1}</td>

                    <td className="border px-4 py-3">
                      <div className="relative">
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          value={row.shortSku}
                          placeholder="Enter Short SKU"
                          className="w-full border-none bg-transparent outline-none"
                          // onChange={(e) => {
                          //   const updated = [...rows];
                          //   updated[index].shortSku =
                          //     e.target.value.toUpperCase();
                          //   setRows(updated);
                          // }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();

                            const updated = [...rows];

                            updated[index].shortSku = value;

                            setRows(updated);

                            setActiveRow(index);

                            getSuggestions(value, index);
                          }}
                          // onKeyDown={async (e) => {
                          //   if (e.key !== "Enter") return;

                          //   e.preventDefault();

                          //   if (!row.shortSku.trim()) return;

                          //   // Last row hoy to pehla new row add karo
                          //   if (index === rows.length - 1) {
                          //     addNewRow();
                          //   }

                          //   // Background search (wait nahi kare)
                          //   searchSku(row.shortSku.trim(), index);
                          // }}

                          onKeyDown={async (e) => {
                            // Ctrl + C
                            if (e.ctrlKey && e.key.toLowerCase() === "c") {
                              e.preventDefault();

                              setCopiedRow(rows[index]);

                              toast.success("Row copied.");

                              return;
                            }

                            // Ctrl + V
                            if (e.ctrlKey && e.key.toLowerCase() === "v") {
                              e.preventDefault();

                              if (!copiedRow) {
                                toast.error("No copied row.");
                                return;
                              }

                              const updated = [...rows];

                              updated[index] = {
                                ...updated[index],
                                shortSku: copiedRow.shortSku,
                                barcodeSku: copiedRow.barcodeSku,
                                ordercookSku: copiedRow.ordercookSku,
                                error: false,
                                errorMessage: "",
                              };

                              setRows(updated);

                              setSuggestions([]);
                              setActiveRow(null);

                              // Search again (latest data mate)
                              searchSku(copiedRow.shortSku, index);

                              // Last row hoy to new row add karo
                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              // Next row focus
                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);

                              toast.success("Row pasted.");

                              return;
                            }
                            // Ctrl + D
                            if (e.ctrlKey && e.key.toLowerCase() === "d") {
                              e.preventDefault();

                              // First row ma duplicate na thai
                              if (index === 0) return;

                              const previousRow = rows[index - 1];

                              if (!previousRow.shortSku) return;

                              const updated = [...rows];

                              updated[index].shortSku = previousRow.shortSku;

                              setRows(updated);

                              setSuggestions([]);
                              setActiveRow(null);

                              // Background search
                              searchSku(previousRow.shortSku, index);

                              // Last row hoy to new row add
                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              // Next row focus
                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);

                              return;
                            }

                            // ↓ Down Arrow
                            if (e.key === "ArrowDown") {
                              e.preventDefault();

                              // Dropdown open hoy to suggestion ma move
                              if (
                                activeRow === index &&
                                suggestions.length > 0
                              ) {
                                setSelectedSuggestion((prev) =>
                                  prev < suggestions.length - 1
                                    ? prev + 1
                                    : prev,
                                );
                                return;
                              }

                              // Dropdown open nathi to next row
                              if (index < rows.length - 1) {
                                inputRefs.current[index + 1]?.focus();
                              }

                              return;
                            }

                            // ↑ Up Arrow
                            if (e.key === "ArrowUp") {
                              e.preventDefault();

                              // Dropdown open hoy to suggestion ma move karo
                              if (
                                activeRow === index &&
                                suggestions.length > 0
                              ) {
                                setSelectedSuggestion((prev) =>
                                  prev > 0 ? prev - 1 : 0,
                                );
                                return;
                              }

                              // Dropdown open nathi to previous row
                              if (index > 0) {
                                inputRefs.current[index - 1]?.focus();
                              }

                              return;
                            }

                            // Enter
                            if (e.key === "Enter") {
                              e.preventDefault();

                              // Suggestion open hoy to select karo
                              if (
                                activeRow === index &&
                                suggestions.length > 0
                              ) {
                                const item = suggestions[selectedSuggestion];

                                if (!item) return;

                                const updated = [...rows];

                                updated[index].shortSku = item.shortSku;

                                setRows(updated);

                                setSuggestions([]);

                                setActiveRow(null);

                                searchSku(item.shortSku, index);

                                if (index === rows.length - 1) {
                                  addNewRow();
                                }

                                setTimeout(() => {
                                  inputRefs.current[index + 1]?.focus();
                                }, 100);

                                return;
                              }

                              // Suggestion open na hoy to normal search
                              if (!row.shortSku.trim()) return;

                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              searchSku(row.shortSku.trim(), index);
                            }

                            // ESC
                            if (e.key === "Escape") {
                              setSuggestions([]);
                              setActiveRow(null);
                            }
                          }}
                        />

                        {/* {activeRow === index && suggestions.length > 0 && (
                          <div className="absolute left-0 top-full z-[99999] mt-1 w-full border border-slate-200 bg-white shadow-xl">
                            {suggestions.map((item, i) => (
                              <div
                                ref={(el) => {
                                  if (selectedSuggestion === i) {
                                    el?.scrollIntoView({
                                      block: "nearest",
                                    });
                                  }
                                }}
                                key={item.id}
                                onClick={() => {
                                  const updated = [...rows];

                                  updated[index].shortSku = item.shortSku;

                                  setRows(updated);

                                  setSuggestions([]);

                                  setActiveRow(null);

                                  searchSku(item.shortSku, index);

                                  if (index === rows.length - 1) {
                                    addNewRow();
                                  }
                                  setTimeout(() => {
                                    inputRefs.current[index + 1]?.focus();
                                  }, 100);
                                }}
                                className={`cursor-pointer px-4 py-2 transition ${
                                  selectedSuggestion === i
                                    ? "bg-[#0A0E1A] text-white"
                                    : "hover:bg-slate-100"
                                }`}
                              >
                                {item.shortSku}
                              </div>
                            ))}
                          </div>
                        )} */}
                      </div>
                    </td>

                    <td className="border px-4 py-3">
                      {row.loading ? "Searching..." : row.barcodeSku || "-"}
                    </td>

                    <td className="border px-4 py-3">
                      {row.loading ? "Searching..." : row.ordercookSku || "-"}
                    </td>
                    <td className="border px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            <Button
              onClick={exportExcel}
              disabled={
                rows.filter(
                  (row) => row.shortSku && row.barcodeSku && row.ordercookSku,
                ).length === 0
              }
            >
              Export Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
