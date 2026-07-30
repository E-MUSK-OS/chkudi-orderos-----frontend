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

export default function GenerateSheetModal({ open, onClose }: Props) {
  const STORAGE_KEY = "sku-generate-sheet";
  const STORAGE_EXPIRE_HOURS = 24;
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

  const [rows, setRows] = useState<GenerateRow[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_ROWS;
    }

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return DEFAULT_ROWS;

    try {
      const parsed = JSON.parse(saved);

      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_ROWS;
      }

      return parsed.rows?.length ? parsed.rows : DEFAULT_ROWS;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_ROWS;
    }
  });

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

  const saveRows = (data: GenerateRow[]) => {
    console.log("Saving Rows:", data);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + STORAGE_EXPIRE_HOURS * 60 * 60 * 1000,
        rows: data,
      }),
    );
  };

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

  useEffect(() => {
    saveRows(rows);
  }, [rows]);

  const clearSheet = () => {
    localStorage.removeItem(STORAGE_KEY);

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

    const groupedRows = new Map<
      string,
      {
        shortSku: string;
        barcodeSku: string;
        ordercookSku: string;
        barcodeQty: number;
        ordercookQty: number;
      }
    >();

    rows
      .filter(
        (row) =>
          row.shortSku.trim() &&
          row.barcodeSku.trim() &&
          row.ordercookSku.trim(),
      )
      .forEach((row) => {
        // Same SKU + Barcode + OrderCook ne group karo
        const key = `${row.shortSku}|${row.barcodeSku}|${row.ordercookSku}`;

        if (groupedRows.has(key)) {
          groupedRows.get(key)!.barcodeQty += 1;
          groupedRows.get(key)!.ordercookQty += 1;
        } else {
          groupedRows.set(key, {
            shortSku: row.shortSku,
            barcodeSku: row.barcodeSku,
            ordercookSku: row.ordercookSku,
            barcodeQty: 1,
            ordercookQty: 1,
          });
        }
      });

    // Excel ma unique rows add karo
    groupedRows.forEach((item) => {
      worksheet.addRow({
        shortSku: item.shortSku,
        barcodeSku: item.barcodeSku,
        barcodeQty: item.barcodeQty,
        ordercookSku: item.ordercookSku,
        ordercookQty: item.ordercookQty,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const today = new Date();

    const fileName = `SKU-Mapping-${today.toISOString().split("T")[0]}.xlsx`;

    saveAs(new Blob([buffer]), fileName);

    toast.success("Excel downloaded successfully.");
  };

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
          <div className="h-full overflow-y-auto border">
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
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        value={row.shortSku}
                        placeholder="Enter Short SKU"
                        className="w-full border-none bg-transparent outline-none"
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[index].shortSku =
                            e.target.value.toUpperCase();
                          setRows(updated);
                        }}
                        // onKeyDown={async (e) => {
                        //   if (e.key !== "Enter") return;

                        //   e.preventDefault();

                        //   if (!row.shortSku.trim()) return;

                        //   const found = await searchSku(
                        //     row.shortSku.trim(),
                        //     index,
                        //   );

                        //   if (!found) return;

                        //   if (index === rows.length - 1) {
                        //     addNewRow();
                        //   }
                        // }}

                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;

                          e.preventDefault();

                          if (!row.shortSku.trim()) return;

                          // Last row hoy to pehla new row add karo
                          if (index === rows.length - 1) {
                            addNewRow();
                          }

                          // Background search (wait nahi kare)
                          searchSku(row.shortSku.trim(), index);
                        }}
                      />
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
