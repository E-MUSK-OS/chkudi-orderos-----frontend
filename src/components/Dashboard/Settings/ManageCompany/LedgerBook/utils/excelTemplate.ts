/**
 * Utility functions for downloading blank template and parsing uploaded Ledger Book files.
 * Formatted exactly according to OrderOS 38-column Ledger Book spreadsheet format (Columns A - AL).
 */

export const BLANK_LEDGER_HEADERS = [
  "Ledger Name*",
  "Alias*",
  "Account Head*",
  "Email",
  "Contact Name",
  "Opening Balance*",
  "Credit/Debit",
  "Billing Address 1",
  "Billing Address 2",
  "Billing Address 3",
  "Billing Pincode",
  "Billing Area",
  "Billing City",
  "Billing State",
  "Billing Country",
  "Billing Contact No.",
  "Shipping Address 1",
  "Shipping Address 2",
  "Shipping Address 3",
  "Shipping Pincode",
  "ShippingArea",
  "Shipping City",
  "Shipping State",
  "Shipping Country",
  "Shipping Contact No.",
  "GST No",
  "PAN Number",
  "MSME Numebr",
  "Legal Name",
  "Account No",
  "Holder Name",
  "Bank Name",
  "Branch Name",
  "Account Type",
  "IFSC Code",
  "Credit Debit Limit",
  "Bill Due Days",
  "Ref. Name",
];

export function downloadBlankLedgerTemplate() {
  // Only the 38 column headers - blank template with no sample/mock rows
  const csvRows = [BLANK_LEDGER_HEADERS.map((h) => `"${h}"`).join(",")];

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    encodeURIComponent(csvRows.join("\r\n") + "\r\n");

  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute(
    "download",
    `Ledger_Book_Blank_Template_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCsvFile(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.replace(/["*]/g, "").trim().toLowerCase()
  );

  const items: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]).map((v) =>
      v.replace(/^"|"$/g, "").trim()
    );
    if (values.length === 0 || !values.some((v) => v.length > 0)) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, index) => {
      rowObj[h] = values[index] || "";
    });

    const partyName =
      rowObj["ledger name"] ||
      rowObj["party name"] ||
      rowObj["name"] ||
      values[0];

    if (!partyName) continue;

    const balanceTypeRaw =
      rowObj["credit/debit"] ||
      rowObj["credit / debit"] ||
      rowObj["dr / cr"] ||
      rowObj["balance type"] ||
      values[6] ||
      "Dr";
    const balanceType =
      balanceTypeRaw.toLowerCase().startsWith("cr") ? "Credit" : "Debit";

    items.push({
      partyName,
      alias: rowObj["alias"] || values[1] || "",
      accountCode: rowObj["alias"] || values[1] || "",
      accountHead: rowObj["account head"] || values[2] || "Sundry Debtors",
      email: rowObj["email"] || rowObj["email id"] || values[3] || "",
      contactPerson:
        rowObj["contact name"] || rowObj["contact person"] || values[4] || "",
      openingBalance: Number(rowObj["opening balance"] || values[5] || 0),
      balanceType,

      // Billing Address
      addressLine1:
        rowObj["billing address 1"] ||
        rowObj["address 1"] ||
        rowObj["address"] ||
        values[7] ||
        "",
      addressLine2:
        rowObj["billing address 2"] || rowObj["address 2"] || values[8] || "",
      addressLine3:
        rowObj["billing address 3"] || rowObj["address 3"] || values[9] || "",
      pincode:
        rowObj["billing pincode"] || rowObj["pincode"] || values[10] || "",
      area: rowObj["billing area"] || rowObj["area"] || values[11] || "",
      city: rowObj["billing city"] || rowObj["city"] || values[12] || "Surat",
      state:
        rowObj["billing state"] || rowObj["state"] || values[13] || "Gujarat",
      country:
        rowObj["billing country"] ||
        rowObj["country"] ||
        values[14] ||
        "India",
      phone:
        rowObj["billing contact no."] ||
        rowObj["billing contact no"] ||
        rowObj["contact no"] ||
        rowObj["phone"] ||
        values[15] ||
        "",

      // Shipping Address
      shippingAddress1:
        rowObj["shipping address 1"] || values[16] || "",
      shippingAddress2:
        rowObj["shipping address 2"] || values[17] || "",
      shippingAddress3:
        rowObj["shipping address 3"] || values[18] || "",
      shippingPincode:
        rowObj["shipping pincode"] || values[19] || "",
      shippingArea:
        rowObj["shippingarea"] || rowObj["shipping area"] || values[20] || "",
      shippingCity:
        rowObj["shipping city"] || values[21] || "Surat",
      shippingState:
        rowObj["shipping state"] || values[22] || "Gujarat",
      shippingCountry:
        rowObj["shipping country"] || values[23] || "India",
      shippingPhone:
        rowObj["shipping contact no."] ||
        rowObj["shipping contact no"] ||
        values[24] ||
        "",
      shippingSameAsBilling: Boolean(
        !rowObj["shipping address 1"] && !values[16]
      ),

      // Taxation & Legal
      gstin:
        rowObj["gst no"] ||
        rowObj["gstn"] ||
        rowObj["gstin"] ||
        values[25] ||
        "",
      pan:
        rowObj["pan number"] ||
        rowObj["pan no"] ||
        rowObj["pan"] ||
        values[26] ||
        "",
      msmeNumber:
        rowObj["msme numebr"] ||
        rowObj["msme number"] ||
        rowObj["msme no"] ||
        values[27] ||
        "",
      legalName: rowObj["legal name"] || values[28] || "",

      // Bank Details
      accountNumber:
        rowObj["account no"] || rowObj["account number"] || values[29] || "",
      accountHolderName:
        rowObj["holder name"] ||
        rowObj["account holder name"] ||
        values[30] ||
        "",
      bankName: rowObj["bank name"] || values[31] || "",
      branchName: rowObj["branch name"] || values[32] || "",
      accountType: rowObj["account type"] || values[33] || "Current",
      ifsc: rowObj["ifsc code"] || rowObj["ifsc"] || values[34] || "",

      // Other Details
      creditDebitLimit: Number(
        rowObj["credit debit limit"] || values[35] || 0
      ),
      billDueDays: Number(rowObj["bill due days"] || values[36] || 0),
      refContactName:
        rowObj["ref. name"] ||
        rowObj["ref name"] ||
        rowObj["reference name"] ||
        values[37] ||
        "",
    });
  }

  return items;
}
