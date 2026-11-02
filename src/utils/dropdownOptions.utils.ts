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
  return String(key || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
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

  // 1. Matching DB options
  const matchingDb = (savedOptions || []).filter((o) =>
    targetKeys.includes(normalizeKey(o.field))
  );

  // 2. Disabled set (isActive === false)
  const disabledSet = new Set(
    matchingDb
      .filter((o) => o.isActive === false)
      .map((o) => String(o.value).trim().toLowerCase())
  );

  // 3. Active DB map: value.toLowerCase() -> DropdownOptionItem
  const activeDbMap = new Map<string, DropdownOptionItem>();
  matchingDb
    .filter((o) => o.isActive !== false)
    .forEach((o) => {
      const v = String(o.value).trim();
      if (v) {
        activeDbMap.set(v.toLowerCase(), {
          label: o.label?.trim() || v,
          value: v,
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

    const dbOverride = activeDbMap.get(v.toLowerCase());
    resultMap.set(v.toLowerCase(), {
      label: dbOverride?.label || rawLabel || v,
      value: v,
    });
  });

  // 5. Append newly added active options from DB (not in defaults)
  activeDbMap.forEach((dbItem, lowerKey) => {
    if (!resultMap.has(lowerKey)) {
      resultMap.set(lowerKey, dbItem);
    }
  });

  // 6. Append distinct values (skipping disabled)
  (distinctValues || []).forEach((item) => {
    if (item === null || item === undefined) return;
    const v = String(item).trim();
    if (!v || disabledSet.has(v.toLowerCase())) return;
    if (!resultMap.has(v.toLowerCase())) {
      resultMap.set(v.toLowerCase(), {
        label: v,
        value: v,
      });
    }
  });

  return Array.from(resultMap.values());
}

