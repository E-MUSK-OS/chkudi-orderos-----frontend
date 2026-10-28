import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  SalesInvoice,
  SalesInvoiceFormData,
  SalesInvoiceFilterState,
  SalesInvoiceItem,
} from "../types/salesInvoice.types";

export const salesInvoiceService = {
  async getNextInvoiceNo(): Promise<string> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/next-no`);
    if (!res.ok) {
      throw new Error("Failed to fetch next invoice sequence number.");
    }
    const json = await res.json();
    return json.data?.nextInvoiceNo || "1";
  },

  async createInvoice(data: SalesInvoiceFormData): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create sales invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async getInvoices(filters?: SalesInvoiceFilterState): Promise<{
    data: SalesInvoice[];
    meta: { total: number; page: number; limit: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.invoiceNo) params.append("invoiceNo", filters.invoiceNo);
      if (filters.challanNo) params.append("challanNo", filters.challanNo);
      if (filters.challanRefNo) params.append("challanRefNo", filters.challanRefNo);
      if (filters.partyName) params.append("partyName", filters.partyName);
      if (filters.productSku) params.append("productSku", filters.productSku);
      if (filters.invoiceType && filters.invoiceType !== "All") params.append("invoiceType", filters.invoiceType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status && filters.status !== "All") params.append("status", filters.status);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to fetch sales invoices.");
    }

    const json = await res.json();
    return {
      data: json.data || [],
      meta: json.meta || { total: 0, page: 1, limit: 50 },
    };
  },

  async getInvoiceById(id: string): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`);
    if (!res.ok) {
      throw new Error("Sales invoice not found.");
    }
    const json = await res.json();
    return json.data;
  },

  async getInvoiceByChallanId(challanId: string): Promise<SalesInvoice | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/by-challan/${challanId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async updateInvoice(id: string, data: Partial<SalesInvoiceFormData>): Promise<SalesInvoice> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update sales invoice.");
    }

    const json = await res.json();
    return json.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete sales invoice.");
    }
  },

  buildExportParams(filters?: SalesInvoiceFilterState | Record<string, any>): string {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          if (Array.isArray(val)) {
            if (val.length > 0) {
              params.append(key, val.join(","));
            }
          } else {
            params.append(key, String(val));
          }
        }
      });
    }
    const query = params.toString();
    return query ? `?${query}` : "";
  },

  async downloadDetailExcel(filters?: SalesInvoiceFilterState | Record<string, any>): Promise<Blob> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/detail${this.buildExportParams(filters)}`);
    if (!res.ok) throw new Error("Failed to download detail excel.");
    return await res.blob();
  },

  async downloadSkuWiseExcel(filters?: SalesInvoiceFilterState | Record<string, any>): Promise<Blob> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/sku-wise${this.buildExportParams(filters)}`);
    if (!res.ok) throw new Error("Failed to download SKU wise excel.");
    return await res.blob();
  },

  async downloadTallyExcel(filters?: SalesInvoiceFilterState | Record<string, any>): Promise<Blob> {
    const res = await fetchWithAuth(`${API_BASE_URL}/sales-invoices/export/tally${this.buildExportParams(filters)}`);
    if (!res.ok) throw new Error("Failed to download Tally excel.");
    return await res.blob();
  },

  downloadFile(blob: Blob, filename: string) {
    if (typeof window === "undefined") return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async downloadDetail(filters?: string | string[] | SalesInvoiceFilterState | Record<string, any>) {
    const filterObj = Array.isArray(filters)
      ? { ids: filters.join(",") }
      : typeof filters === "string"
      ? { id: filters, invoiceId: filters }
      : filters;
    const blob = await this.downloadDetailExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_Detail_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSkuWise(filters?: string | string[] | SalesInvoiceFilterState | Record<string, any>) {
    const filterObj = Array.isArray(filters)
      ? { ids: filters.join(",") }
      : typeof filters === "string"
      ? { id: filters, invoiceId: filters }
      : filters;
    const blob = await this.downloadSkuWiseExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_SKU_Wise_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadTally(filters?: string | string[] | SalesInvoiceFilterState | Record<string, any>) {
    const filterObj = Array.isArray(filters)
      ? { ids: filters.join(",") }
      : typeof filters === "string"
      ? { id: filters, invoiceId: filters }
      : filters;
    const blob = await this.downloadTallyExcel(filterObj);
    this.downloadFile(blob, `Sales_Invoices_Tally_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadInvoicesTableExcel(invoices: SalesInvoice[]) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Invoices");

    worksheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "Party Name", key: "partyName", width: 28 },
      { header: "Invoice Type", key: "invoiceType", width: 16 },
      { header: "OC Invoice No", key: "invoiceNo", width: 16 },
      { header: "Date", key: "date", width: 14 },
      { header: "OC Challan No", key: "challanNo", width: 16 },
      { header: "Challan Ref No", key: "challanRefNo", width: 16 },
      { header: "Qty", key: "qty", width: 12 },
      { header: "Net Amount", key: "netAmount", width: 16 },
      { header: "CN Amount", key: "cnAmount", width: 14 },
      { header: "DCN Amount", key: "dcnAmount", width: 14 },
      { header: "Received", key: "received", width: 14 },
      { header: "Pending", key: "pending", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E75B6" },
    };

    let totalQty = 0;
    let totalNetAmount = 0;

    invoices.forEach((inv, idx) => {
      const netAmt = Number(inv.netAmount || 0);
      const receivedAmt = Number((inv as any).receivedAmount || 0);
      const cnAmt = Number((inv as any).cnAmount || 0);
      const dcnAmt = Number((inv as any).dcnAmount || 0);
      const pendingAmt = Math.max(0, netAmt - (receivedAmt + cnAmt));
      const qty = Number(inv.totalQuantity || 0);

      totalQty += qty;
      totalNetAmount += netAmt;

      worksheet.addRow({
        no: idx + 1,
        partyName: inv.billingPartyName || "-",
        invoiceType: inv.invoiceType || "Tax Invoice",
        invoiceNo: inv.invoiceNo,
        date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "-",
        challanNo: inv.challanNo || "-",
        challanRefNo: inv.challan?.challanRefNo || (inv as any).challanRefNo || "-",
        qty: qty,
        netAmount: netAmt,
        cnAmount: cnAmt,
        dcnAmount: dcnAmt,
        received: receivedAmt,
        pending: pendingAmt,
        status: inv.status || "Generated",
      });
    });

    if (invoices.length > 0) {
      const totalRow = worksheet.addRow({
        no: "",
        partyName: "Total.",
        invoiceType: "",
        invoiceNo: "",
        date: "",
        challanNo: "",
        challanRefNo: "",
        qty: Math.round(totalQty * 100) / 100,
        netAmount: Math.round(totalNetAmount * 100) / 100,
        cnAmount: "",
        dcnAmount: "",
        received: "",
        pending: "",
        status: "",
      });
      totalRow.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    this.downloadFile(blob, `Sales_Invoices_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSingleInvoiceDetail(
    formData: SalesInvoiceFormData,
    items: SalesInvoiceItem[]
  ) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Invoice Detail");

    worksheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "OCInvoiceNo", key: "ocInvoiceNo", width: 14 },
      { header: "OCChallanNo", key: "ocChallanNo", width: 14 },
      { header: "ChallanRefNo", key: "challanRefNo", width: 14 },
      { header: "InvoiceType", key: "invoiceType", width: 14 },
      { header: "Date", key: "date", width: 14 },
      { header: "CustomerName", key: "customerName", width: 28 },
      { header: "ProductSKU", key: "productSku", width: 32 },
      { header: "HSNCode", key: "hsnCode", width: 14 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Rate", key: "rate", width: 12 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "DiscountAmount", key: "discountAmount", width: 15 },
      { header: "TaxableAmount", key: "taxableAmount", width: 15 },
      { header: "SGSTRate", key: "sgstRate", width: 12 },
      { header: "SGSTAmount", key: "sgstAmount", width: 12 },
      { header: "CGSTRate", key: "cgstRate", width: 12 },
      { header: "CGSTAmount", key: "cgstAmount", width: 12 },
      { header: "IGSTRate", key: "igstRate", width: 12 },
      { header: "IGSTAmount", key: "igstAmount", width: 12 },
      { header: "ProductNetAmount", key: "productNetAmount", width: 18 },
    ];

    // Header style: Blue background #2E75B6, bold white text
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E75B6" },
    };

    const invNo = formData.invoiceNo || "-";
    const ocChallanNo = formData.challanNo || "-";
    const challanRef = (formData as any).challanRefNo || "-";
    const invType = formData.invoiceType || "Tax Invoice";
    const invDateStr = formData.invoiceDate || new Date().toLocaleDateString("en-IN");
    const custName = formData.billingPartyName || "-";

    let totalQty = 0;
    let totalAmount = 0;
    let totalDiscountAmount = 0;
    let totalTaxableAmount = 0;
    let totalSgstAmount = 0;
    let totalCgstAmount = 0;
    let totalIgstAmount = 0;
    let totalProductNetAmount = 0;

    items.forEach((it, idx) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      const amt = Number(it.amount) || q * r;
      const disc = Number(it.discountAmount) || 0;
      const taxable = Number(it.taxableAmount) || amt - disc;
      const sgstR = Number(it.sgstRate) || 0;
      const sgstA = Number(it.sgstAmount) || 0;
      const cgstR = Number(it.cgstRate) || 0;
      const cgstA = Number(it.cgstAmount) || 0;
      const igstR = Number(it.igstRate) || 0;
      const igstA = Number(it.igstAmount) || 0;
      const net = Number(it.total) || taxable + sgstA + cgstA + igstA;

      totalQty += q;
      totalAmount += amt;
      totalDiscountAmount += disc;
      totalTaxableAmount += taxable;
      totalSgstAmount += sgstA;
      totalCgstAmount += cgstA;
      totalIgstAmount += igstA;
      totalProductNetAmount += net;

      worksheet.addRow({
        no: idx + 1,
        ocInvoiceNo: invNo,
        ocChallanNo: ocChallanNo,
        challanRefNo: challanRef,
        invoiceType: invType,
        date: invDateStr,
        customerName: custName,
        productSku: it.particular && it.particular.trim() ? it.particular.trim() : (it.sku || "-"),
        hsnCode: it.hsn || "-",
        quantity: q,
        rate: r,
        amount: amt,
        discountAmount: disc,
        taxableAmount: taxable,
        sgstRate: sgstR,
        sgstAmount: sgstA,
        cgstRate: cgstR,
        cgstAmount: cgstA,
        igstRate: igstR,
        igstAmount: igstA,
        productNetAmount: net,
      });
    });

    const totalRow = worksheet.addRow({
      no: "",
      ocInvoiceNo: "",
      ocChallanNo: "",
      challanRefNo: "",
      invoiceType: "",
      date: "",
      customerName: "",
      productSku: "Total.",
      hsnCode: "",
      quantity: Math.round(totalQty * 100) / 100,
      rate: "",
      amount: Math.round(totalAmount * 100) / 100,
      discountAmount: Math.round(totalDiscountAmount * 100) / 100,
      taxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      sgstRate: "",
      sgstAmount: Math.round(totalSgstAmount * 100) / 100,
      cgstRate: "",
      cgstAmount: Math.round(totalCgstAmount * 100) / 100,
      igstRate: "",
      igstAmount: Math.round(totalIgstAmount * 100) / 100,
      productNetAmount: Math.round(totalProductNetAmount * 100) / 100,
    });

    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    this.downloadFile(blob, `Sales_Invoice_${invNo}_Detail_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSingleInvoiceSkuWise(
    formData: SalesInvoiceFormData,
    items: SalesInvoiceItem[]
  ) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("SKU Wise Invoice Items");

    worksheet.columns = [
      { header: "Invoice No", key: "invoiceNo", width: 14 },
      { header: "Date", key: "date", width: 14 },
      { header: "Party Name", key: "partyName", width: 28 },
      { header: "Item No", key: "itemNo", width: 10 },
      { header: "Product SKU", key: "sku", width: 24 },
      { header: "Particular", key: "particular", width: 32 },
      { header: "HSN", key: "hsn", width: 14 },
      { header: "Qty", key: "qty", width: 12 },
      { header: "Rate", key: "rate", width: 14 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Taxable Amt", key: "taxableAmt", width: 14 },
      { header: "SGST", key: "sgst", width: 12 },
      { header: "CGST", key: "cgst", width: 12 },
      { header: "IGST", key: "igst", width: 12 },
      { header: "Total", key: "total", width: 16 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F2942" },
    };

    const invNo = formData.invoiceNo || "-";
    const invDateStr = formData.invoiceDate || new Date().toLocaleDateString("en-IN");
    const partyName = formData.billingPartyName || "-";

    items.forEach((it, idx) => {
      worksheet.addRow({
        invoiceNo: invNo,
        date: invDateStr,
        partyName: partyName,
        itemNo: it.itemNo || idx + 1,
        sku: it.sku || "-",
        particular: it.particular || it.sku || "-",
        hsn: it.hsn || "-",
        qty: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        amount: Number(it.amount) || 0,
        taxableAmt: Number(it.taxableAmount) || 0,
        sgst: Number(it.sgstAmount) || 0,
        cgst: Number(it.cgstAmount) || 0,
        igst: Number(it.igstAmount) || 0,
        total: Number(it.total) || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    this.downloadFile(blob, `Sales_Invoice_${invNo}_SKU_Wise_${new Date().toISOString().split("T")[0]}.xlsx`);
  },

  async downloadSingleInvoiceTally(
    formData: SalesInvoiceFormData,
    items: SalesInvoiceItem[]
  ) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tally Format");

    worksheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Order No / Ref No", key: "orderNoRefNo", width: 18 },
      { header: "Invoice No", key: "invoiceNo", width: 14 },
      { header: "Voucher Type", key: "voucherType", width: 16 },
      { header: "Customer Name", key: "customerName", width: 28 },
      { header: "Sale Account Name", key: "saleAccountName", width: 20 },
      { header: "End User Name", key: "endUserName", width: 28 },
      { header: "Sales Order Due Date if any", key: "salesOrderDueDate", width: 24 },
      { header: "Order No", key: "orderNo", width: 16 },
      { header: "Order Date", key: "orderDate", width: 14 },
      { header: "Order Other Reference", key: "orderOtherReference", width: 22 },
      { header: "Tracking id", key: "trackingId", width: 18 },
      { header: "Courier name", key: "courierName", width: 16 },
      { header: "CMP GSTN", key: "cmpGstn", width: 18 },
      { header: "GST Reg Name", key: "gstRegName", width: 28 },
      { header: "Dispatch From Address1", key: "dispatchFromAddress1", width: 26 },
      { header: "Dispatch From Address2", key: "dispatchFromAddress2", width: 26 },
      { header: "Dispatch From Address3", key: "dispatchFromAddress3", width: 26 },
      { header: "Dispatch From Place", key: "dispatchFromPlace", width: 18 },
      { header: "Dispatch From Pincode", key: "dispatchFromPincode", width: 20 },
      { header: "Buyer Adress Type", key: "buyerAdressType", width: 18 },
      { header: "Buyer Address1", key: "buyerAddress1", width: 26 },
      { header: "Buyer Address2", key: "buyerAddress2", width: 26 },
      { header: "Buyer Address3", key: "buyerAddress3", width: 26 },
      { header: "Bill To Place", key: "billToPlace", width: 18 },
      { header: "Bill To Pincode", key: "billToPincode", width: 16 },
      { header: "Consignee Name", key: "consigneeName", width: 28 },
      { header: "Consignee Address1", key: "consigneeAddress1", width: 26 },
      { header: "Consignee Address2", key: "consigneeAddress2", width: 26 },
      { header: "Consignee Address3", key: "consigneeAddress3", width: 26 },
      { header: "Ship To Place", key: "shipToPlace", width: 18 },
      { header: "Ship To Pincode", key: "shipToPincode", width: 16 },
      { header: "Consignee State", key: "consigneeState", width: 18 },
      { header: "Consignee Phone No", key: "consigneePhoneNo", width: 18 },
      { header: "Consignee GST No If Any", key: "consigneeGstNo", width: 24 },
      { header: "End User State", key: "endUserState", width: 18 },
      { header: "Country", key: "country", width: 14 },
      { header: "Contact number", key: "contactNumber", width: 16 },
      { header: "Email id", key: "emailId", width: 24 },
      { header: "End User GST NO If any", key: "endUserGstNo", width: 24 },
      { header: "Delivery Type", key: "deliveryType", width: 16 },
      { header: "Delivery Note No", key: "deliveryNoteNo", width: 18 },
      { header: "Delivery Note Dt", key: "deliveryNoteDt", width: 16 },
      { header: "Dispatch Doc No", key: "dispatchDocNo", width: 18 },
      { header: "Stock Item", key: "stockItem", width: 30 },
      { header: "HSN", key: "hsn", width: 14 },
      { header: "Godown Name", key: "godownName", width: 18 },
      { header: "Batch Name", key: "batchName", width: 18 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Rate", key: "rate", width: 12 },
      { header: "Disc Rate", key: "discRate", width: 12 },
      { header: "GST Rate", key: "gstRate", width: 12 },
      { header: "Cess Rate", key: "cessRate", width: 12 },
      { header: "Cess / Unit", key: "cessUnit", width: 12 },
      { header: "Other Exp1", key: "otherExp1", width: 12 },
      { header: "Other Exp2", key: "otherExp2", width: 12 },
      { header: "Other Exp3", key: "otherExp3", width: 12 },
      { header: "Other Exp4", key: "otherExp4", width: 12 },
      { header: "Other Exp5", key: "otherExp5", width: 12 },
      { header: "Narration", key: "narration", width: 26 },
      { header: "Post GST Discount", key: "postGstDiscount", width: 18 },
      { header: "TCS", key: "tcs", width: 12 },
      { header: "Round Off", key: "roundOff", width: 12 },
    ];

    // Header style: Blue background #2E75B6, bold white text
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E75B6" },
    };

    const invNo = formData.invoiceNo || "-";
    const ocChallanNo = formData.challanNo || "";
    const challanRef = (formData as any).challanRefNo || "";
    const invDateStr = formData.invoiceDate || new Date().toLocaleDateString("en-IN");
    const chDateStr = formData.challanDate || invDateStr;
    const custName = formData.billingPartyName || "";

    items.forEach((it) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      const dp = Number(it.discountPercent) || 0;
      const sgstR = Number(it.sgstRate) || 0;
      const cgstR = Number(it.cgstRate) || 0;
      const igstR = Number(it.igstRate) || 0;
      const totalGstRate = sgstR + cgstR + igstR;

      worksheet.addRow({
        date: invDateStr,
        orderNoRefNo: challanRef || ocChallanNo,
        invoiceNo: invNo,
        voucherType: formData.invoiceType || "Sales",
        customerName: custName,
        saleAccountName: "Sales Account",
        endUserName: custName,
        salesOrderDueDate: "",
        orderNo: ocChallanNo,
        orderDate: chDateStr,
        orderOtherReference: challanRef,
        trackingId: formData.trackingNo || "",
        courierName: formData.courierPartner || "",
        cmpGstn: "",
        gstRegName: custName,
        dispatchFromAddress1: formData.shippingAddress || formData.billingAddress || "",
        dispatchFromAddress2: formData.shippingAddress2 || "",
        dispatchFromAddress3: "",
        dispatchFromPlace: formData.shippingCity || formData.billingCity || "",
        dispatchFromPincode: formData.shippingPincode || formData.billingPincode || "",
        buyerAdressType: formData.partyGstn ? "Regular" : "Unregistered",
        buyerAddress1: formData.billingAddress || "",
        buyerAddress2: "",
        buyerAddress3: "",
        billToPlace: formData.billingCity || "",
        billToPincode: formData.billingPincode || "",
        consigneeName: formData.consigneeName || formData.shippingPartyName || custName,
        consigneeAddress1: formData.shippingAddress || formData.billingAddress || "",
        consigneeAddress2: formData.shippingAddress2 || "",
        consigneeAddress3: "",
        shipToPlace: formData.shippingCity || formData.billingCity || "",
        shipToPincode: formData.shippingPincode || formData.billingPincode || "",
        consigneeState: formData.shippingState || formData.billingState || "",
        consigneePhoneNo: formData.shippingContact || formData.billingMobile || "",
        consigneeGstNo: formData.partyGstn || "",
        endUserState: formData.billingState || "",
        country: "India",
        contactNumber: formData.billingMobile || "",
        emailId: formData.billingEmail || "",
        endUserGstNo: formData.partyGstn || "",
        deliveryType: "",
        deliveryNoteNo: ocChallanNo,
        deliveryNoteDt: chDateStr,
        dispatchDocNo: ocChallanNo,
        stockItem: it.particular && it.particular.trim() ? it.particular.trim() : (it.sku || ""),
        hsn: it.hsn || "",
        godownName: "Main Location",
        batchName: "Primary Batch",
        qty: q,
        unit: "PCS",
        rate: r,
        discRate: dp,
        gstRate: totalGstRate,
        cessRate: 0,
        cessUnit: 0,
        otherExp1: 0,
        otherExp2: 0,
        otherExp3: 0,
        otherExp4: 0,
        otherExp5: 0,
        narration: formData.remarks || "Being sales invoice generated",
        postGstDiscount: 0,
        tcs: 0,
        roundOff: formData.roundOff || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    this.downloadFile(blob, `Sales_Invoice_${invNo}_Tally_${new Date().toISOString().split("T")[0]}.xlsx`);
  },
};
