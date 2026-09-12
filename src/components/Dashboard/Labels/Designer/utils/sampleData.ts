export const sampleData: Record<string, string> = {
  title: "Roadster Men Solid Regular Fit Casual Shirt",
  sku: "B0863TXGM3",
  mrp: "5349.99",
  asin: "B0863TXGM3",
  articleNo: "B0863TXGM3",
  styleNo: "B0863TXGM3",
  size: "30",
  color: "Black",
  brand: "Roadster",
  barcode: "B0863TXGM3",
  manufacturingMonth: "10/2023",
  printDate: new Date().toLocaleDateString(),
  fullSku: "B0863TXGM3-FULL"
};

/**
 * Resolves a template string containing variables like {{title}} 
 * with the provided data, falling back to Preview Mode sampleData so
 * placeholder editing text (like "Double click to edit") is NEVER printed.
 */
export const resolveVariable = (content: string, variableSource?: string, overrideData?: Record<string, string>): string => {
  const data: Record<string, string> = { ...sampleData };
  
  if (overrideData) {
    Object.entries(overrideData).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        data[k] = String(v);
      }
    });
  }

  // If color is missing or empty, extract from SKU (e.g. MY-RS-1005-Black-32 -> Black)
  if ((!data["color"] || data["color"] === "Black") && data["sku"]) {
    const colorMatch = data["sku"].match(/(black|white|blue|red|green|yellow|grey|gray|pink|navy|olive|brown|orange|purple|maroon|beige)/i);
    if (colorMatch) {
      data["color"] = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1).toLowerCase();
    }
  }

  const findValue = (varName: string): string | undefined => {
    if (data[varName] !== undefined && data[varName] !== "") return data[varName];
    const lower = varName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Check keys case-insensitively
    for (const k of Object.keys(data)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === lower && data[k] !== undefined && data[k] !== "") {
        return data[k];
      }
    }
    
    // Smart Aliases
    if (lower.includes("articleno") || lower.includes("styleno") || lower.includes("asin") || lower.includes("sku")) {
      return data["asin"] || data["sku"] || data["articleNo"] || sampleData["asin"];
    }
    if (lower.includes("barcode")) {
      return data["barcode"] || data["sku"] || data["asin"] || sampleData["barcode"];
    }
    if (lower.includes("brand")) {
      return data["brand"] || sampleData["brand"];
    }
    if (lower.includes("mrp")) {
      return data["mrp"] || sampleData["mrp"];
    }
    if (lower.includes("size")) {
      return data["size"] || sampleData["size"];
    }
    if (lower.includes("color")) {
      return data["color"] || sampleData["color"];
    }
    return undefined;
  };

  if (variableSource && variableSource !== "custom") {
    const match = variableSource.match(/{{(.*?)}}/);
    if (match && match[1]) {
      const val = findValue(match[1].trim());
      if (val !== undefined && val !== "") {
        return val;
      }
    }
  }

  // Fallback to replacing all {{var}} in content
  let resolved = content.replace(/{{(.*?)}}/g, (match, p1) => {
    const val = findValue(p1.trim());
    return val !== undefined && val !== "" ? val : match;
  });

  // Replace any occurrence of "Double click to edit"
  if (resolved.toLowerCase().includes("double click to edit")) {
    resolved = resolved.replace(/Double click to edit/gi, () => {
      if (variableSource && variableSource !== "custom") {
        const match = variableSource.match(/{{(.*?)}}/);
        if (match && match[1]) {
          const val = findValue(match[1].trim());
          if (val) return val;
        }
      }
      return findValue("color") || findValue("size") || findValue("sku") || "";
    }).trim();
  }

  // If barcode content is default sample "123456789", replace with actual barcode/SKU
  if (resolved === "123456789") {
    const val = findValue("barcode") || findValue("sku") || findValue("asin");
    if (val) return val;
  }

  return resolved;
};
