/**
 * Utility functions for bidirectional SKU matching in Flipkart Order Process.
 * Matches across 4 explicit stages:
 * - Stage 1: Direct Match (Exact)
 * - Stage 2: DB Prefix Match (DB SKU has prefix: e.g. "Button-Pant-2055-Cream-34" matches "2055-Cream-34")
 * - Stage 3: Label Prefix Match (Label SKU has prefix: e.g. "S-Shorts-2027-Dark Grey-M" matches "Shorts-2027-Dark Grey-M")
 * - Stage 4: Middle Type Match (Core Invariant Tail: e.g. "S-Shorts-2027-Dark Grey-M" matches "Shorts-Waffle-2027-Dark Grey-M")
 *
 * CRITICAL RULE:
 * If both SKUs contain design style codes (e.g. "2055" vs "2076"), they MUST be identical!
 * "2055-Cream-34" must NEVER match "WO-Pant-2076-Cream-34".
 */

/**
 * Extracts the primary design/style number from an SKU (e.g. "2055", "2076", "2027", "5207", "2045")
 */
export const extractDesignCode = (sku: string): string => {
  if (!sku) return "";
  const str = String(sku).trim().toLowerCase();
  const match = str.match(/(?:^|-)([a-z0-9]*\d+[a-z0-9]*)(?:-|$)/i);
  return match && match[1] ? match[1].trim() : "";
};

/**
 * Normalizes tail by converting spaces/underscores to hyphens and lowercasing
 */
export const normalizeSkuTail = (tail: string): string => {
  if (!tail) return "";
  return tail
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

/**
 * Extracts invariant design and variant core tail from SKU (strictly 3 tokens: DesignCode - Color - Size)
 * e.g. "Army-Pant-2045-Mahendi-30" -> "2045-mahendi-30"
 * e.g. "2045-Mahendi-30" -> "2045-mahendi-30"
 * e.g. "Button-Pant-2055-Cream-34" -> "2055-cream-34"
 * e.g. "2055-Cream-34" -> "2055-cream-34"
 * e.g. "Shorts-Waffle-2027-Dark Grey-M" -> "2027-dark-grey-m"
 * e.g. "S-Shorts-2027-Dark Grey-M" -> "2027-dark-grey-m"
 */
export const extractCoreTail = (sku: string): string => {
  if (!sku) return "";
  const str = String(sku).trim();
  // 1. Strictly 3 tokens: <DesignCode>-<Color>-<Size>
  const match3 = str.match(/(?:^|-)([a-z0-9]*\d+[a-z0-9]*-[^-]+-[^-]+)$/i);
  if (match3 && match3[1]) {
    return normalizeSkuTail(match3[1]);
  }
  // 2. Fallback for hyphenated colors (e.g. "2027-Off-White-M")
  const matchHyphenColor = str.match(/(?:^|-)([a-z0-9]*\d+[a-z0-9]*-.*-[^-]+)$/i);
  if (matchHyphenColor && matchHyphenColor[1]) {
    return normalizeSkuTail(matchHyphenColor[1]);
  }
  return "";
};

/**
 * Gets safe candidates for an SKU by only stripping prefixes BEFORE the design code.
 * NEVER strips the design code itself (so "2055-Cream-34" will NEVER produce "Cream-34").
 */
export const getSafeSearchCandidates = (sku: string): string[] => {
  if (!sku) return [];
  const orig = String(sku).trim();
  const candidates = new Set<string>([orig]);
  const designCode = extractDesignCode(orig);

  if (designCode) {
    const idx = orig.toLowerCase().indexOf(designCode.toLowerCase());
    if (idx > 0) {
      const before = orig.substring(0, idx);
      const after = orig.substring(idx);
      const hyphenIdx = before.indexOf("-");
      if (hyphenIdx >= 0) {
        const strippedPrefix = (before.substring(hyphenIdx + 1) + after).trim();
        if (strippedPrefix && strippedPrefix !== orig) {
          candidates.add(strippedPrefix);
        }
      }
      candidates.add(after.trim());
    }
  }

  return Array.from(candidates);
};

/**
 * Bidirectional SKU matching across 4 explicit stages:
 * Stage 1: Direct match (Exact match)
 * Stage 2: DB Prefix match (DB has prefix: e.g. "Button-Pant-2055-Cream-34" matches "2055-Cream-34")
 * Stage 3: Label Prefix match (Label has prefix: e.g. "S-Shorts-2027-Dark Grey-M" matches "Shorts-2027-Dark Grey-M")
 * Stage 4: Middle Type match (Core Invariant Tail)
 *
 * CRITICAL GUARD:
 * If both SKUs contain design style codes (e.g. "2055" vs "2076"), they MUST be identical!
 * "2055-Cream-34" must NEVER match "WO-Pant-2076-Cream-34".
 */
export const isSkuBidirectionalMatch = (skuA: string, skuB: string): boolean => {
  const a = (skuA || "").trim().toLowerCase();
  const b = (skuB || "").trim().toLowerCase();
  if (!a || !b) return false;

  // Stage 1: Direct Match (Exact)
  if (a === b) return true;

  // CRITICAL GUARD: If both have design/style codes and they differ, REJECT IMMEDIATELY!
  const codeA = extractDesignCode(a);
  const codeB = extractDesignCode(b);
  if (codeA && codeB && codeA !== codeB) {
    return false;
  }

  // Stage 2: DB Prefix Match (DB SKU ends with Label SKU)
  // e.g. DB "Button-Pant-2055-Cream-34" ends with "-2055-cream-34"
  // e.g. DB "Formal-Pant-5207-Dark Grey-34" ends with "-pant-5207-dark grey-34"
  if (a.endsWith(`-${b}`) || a.endsWith(b)) return true;

  // Stage 3: Label Prefix Match (Label SKU ends with DB SKU)
  // e.g. Label "S-Shorts-2027-Dark Grey-M" ends with "-shorts-2027-dark grey-m"
  if (b.endsWith(`-${a}`) || b.endsWith(a)) return true;

  // Stage 4: Middle Type Match (Core Invariant Tail)
  // e.g. Label "S-Shorts-2027-Dark Grey-M" matches DB "Shorts-Waffle-2027-Dark Grey-M"
  const tailA = extractCoreTail(a);
  const tailB = extractCoreTail(b);
  if (tailA && tailB && tailA === tailB) return true;

  return false;
};
