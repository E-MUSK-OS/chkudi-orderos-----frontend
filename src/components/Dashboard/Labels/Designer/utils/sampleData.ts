export const sampleData: Record<string, string> = {
  title: "Premium Wireless Headphones",
  sku: "WH-1000XM4-BLK",
  mrp: "$349.99",
  asin: "B0863TXGM3",
  size: "30",
  color: "Black",
  manufacturingMonth: "10/2023",
  printDate: new Date().toLocaleDateString()
};

/**
 * Resolves a template string containing variables like {{title}} 
 * with the provided sample data.
 */
export const resolveVariable = (content: string, variableSource?: string, overrideData?: Record<string, string>): string => {
  const data = overrideData || sampleData;
  
  if (variableSource && variableSource !== "custom") {
    // Extract the variable name between {{ and }}
    const match = variableSource.match(/{{(.*?)}}/);
    if (match && match[1] && data[match[1]]) {
      return data[match[1]];
    }
  }

  // Fallback to replacing all {{var}} in content
  return content.replace(/{{(.*?)}}/g, (match, p1) => {
    return data[p1] || match;
  });
};
