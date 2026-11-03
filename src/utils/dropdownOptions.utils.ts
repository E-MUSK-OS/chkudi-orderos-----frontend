export interface DropdownOptionItem {
  label: string;
  value: string;
}

export interface SavedDropdownOption {
  id?: string;
  field: string;
  value: string;
  label?: string;
  isActive?: boolean;
}

/**
 * Normalizes field key to lowercase alphanumeric for reliable matching
 */
export function normalizeKey(key: string): string {
  const clean = String(key || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean === "productcategory") return "category";
  if (clean === "productsubcategory") return "subcategory";
  if (clean === "colour" || clean === "colours") return "color";
  if (clean === "brandname") return "brand";
  if (clean === "companyname") return "company";
  if (clean === "userdepartment") return "department";
  if (clean === "sizes" || clean === "sizelist") return "size";
  if (clean === "gst") return "gstrate";
  return clean;
}

/**
 * Builds active, deduplicated, and label-synced dropdown options.
 *
 * Rules:
 * 1. Collects all DB options matching fieldKey(s).
 * 2. Any option with isActive === false is STRICTLY excluded from the result
 *    (even if present in defaultOptions or distinctValues).
 * 3. Default options are included unless deactivated. If a DB entry has a custom label,
 *    it overrides the default label so Setting Masters renames are reflected immediately.
 * 4. User-created active options are appended.
 * 5. Distinct values from existing records are appended unless deactivated.
 * 6. Case-insensitive deduplication ensures a clean, unique list.
 */
export function buildMergedOptions(
  fieldKeys: string | string[],
  defaultOptions: Array<DropdownOptionItem | string> = [],
  savedOptions: SavedDropdownOption[] = [],
  distinctValues: Array<string | number> = []
): DropdownOptionItem[] {
  const targetKeys = (Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys]).map(normalizeKey);
  const isGst = targetKeys.includes("gstrate") || targetKeys.includes("gst");

  // 1. Matching DB options
  const matchingDb = (savedOptions || []).filter((o) =>
    targetKeys.includes(normalizeKey(o.field))
  );

  // 2. Disabled set (isActive === false or label === "__DELETED__")
  const disabledSet = new Set<string>();
  matchingDb
    .filter((o) => o.isActive === false || o.label === "__DELETED__")
    .forEach((o) => {
      const v = String(o.value).trim().toLowerCase();
      disabledSet.add(v);
      if (o.label && o.label !== "__DELETED__") {
        disabledSet.add(String(o.label).trim().toLowerCase());
      }
      if (isGst) {
        disabledSet.add(v.replace("%", "").trim());
        disabledSet.add(`${v.replace("%", "").trim()}%`);
      }
    });

  // 3. Active DB map: value.toLowerCase() -> DropdownOptionItem
  const activeDbMap = new Map<string, DropdownOptionItem>();
  matchingDb
    .filter((o) => o.isActive !== false && o.label !== "__DELETED__")
    .forEach((o) => {
      const rawV = String(o.value).trim();
      if (!rawV) return;
      if (disabledSet.has(rawV.toLowerCase())) return;
      if (o.label && disabledSet.has(String(o.label).trim().toLowerCase())) return;

      if (isGst) {
        const numStr = rawV.replace("%", "").trim();
        const displayLabel = o.label?.trim() || (rawV.endsWith("%") ? rawV : `${rawV}%`);
        const item = { label: displayLabel, value: numStr };
        activeDbMap.set(numStr.toLowerCase(), item);
        activeDbMap.set(`${numStr}%`.toLowerCase(), item);
      } else {
        activeDbMap.set(rawV.toLowerCase(), {
          label: o.label?.trim() || rawV,
          value: rawV,
        });
      }
    });

  const resultMap = new Map<string, DropdownOptionItem>();

  // 4. Process defaults (skipping disabled, and overriding label if activeDbMap has a custom label)
  (defaultOptions || []).forEach((opt) => {
    const rawVal = typeof opt === "string" ? opt : opt.value;
    const rawLabel = typeof opt === "string" ? opt : opt.label;
    const v = String(rawVal ?? "").trim();
    if (!v || disabledSet.has(v.toLowerCase())) return;

    if (isGst) {
      const numStr = v.replace("%", "").trim();
      if (disabledSet.has(numStr.toLowerCase())) return;
      const dbOverride = activeDbMap.get(numStr.toLowerCase()) || activeDbMap.get(`${numStr}%`.toLowerCase());
      resultMap.set(numStr.toLowerCase(), {
        label: dbOverride?.label || (rawLabel ? String(rawLabel).trim() : `${numStr}%`),
        value: numStr,
      });
    } else {
      const dbOverride = activeDbMap.get(v.toLowerCase());
      resultMap.set(v.toLowerCase(), {
        label: dbOverride?.label || rawLabel || v,
        value: v,
      });
    }
  });

  // 5. Append newly added active options from DB (not in defaults)
  activeDbMap.forEach((dbItem, lowerKey) => {
    if (disabledSet.has(lowerKey) || (dbItem.label && disabledSet.has(dbItem.label.toLowerCase()))) return;
    const keyToUse = isGst ? dbItem.value.toLowerCase() : lowerKey;
    if (!resultMap.has(keyToUse)) {
      resultMap.set(keyToUse, dbItem);
    }
  });

  // 6. Append distinct values (skipping disabled)
  (distinctValues || []).forEach((item) => {
    if (item === null || item === undefined) return;
    const v = String(item).trim();
    if (!v || disabledSet.has(v.toLowerCase())) return;

    if (isGst) {
      const numStr = v.replace("%", "").trim();
      if (!disabledSet.has(numStr.toLowerCase()) && !resultMap.has(numStr.toLowerCase())) {
        resultMap.set(numStr.toLowerCase(), {
          label: `${numStr}%`,
          value: numStr,
        });
      }
    } else {
      if (!resultMap.has(v.toLowerCase())) {
        resultMap.set(v.toLowerCase(), {
          label: v,
          value: v,
        });
      }
    }
  });

  return Array.from(resultMap.values());
}

