import type { QueryClient } from "@tanstack/react-query";

export interface DropdownOptionItem {
  label: string;
  value: string;
}

export interface SavedDropdownOption {
  id?: string;
  field: string;
  value: string;
  label?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DropdownSyncDetail {
  action?: "create" | "update" | "toggle" | "delete" | "sync" | string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  oldLabel?: string;
  newLabel?: string;
  isActive?: boolean;
  timestamp?: number;
  nonce?: string;
}

export const DROPDOWN_SYNC_EVENT = "dropdown_options_updated";
export const OPTION_RENAMED_EVENT = "orderos:option-renamed";
export const DROPDOWN_BROADCAST_CHANNEL = "orderos_dropdown_sync";
export const DROPDOWN_STORAGE_SYNC_KEY = "orderos_dropdown_sync";

export function normalizeKey(key: string): string {
  const clean = String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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

const CUSTOM_OPT_PREFIXES = [
  "product_custom_opt_",
  "material_custom_opt_",
  "user_custom_opt_",
];

/**
 * Clears cached custom options from localStorage when DB Setting Masters
 * are edited, toggled, deleted, or synced so stale client entries never respawn.
 */
export function clearLocalCustomOptionCaches(field?: string): void {
  if (typeof window === "undefined") return;
  try {
    const targetNorm = field ? normalizeKey(field) : null;
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (!storageKey) continue;

      const matchingPrefix = CUSTOM_OPT_PREFIXES.find((p) =>
        storageKey.startsWith(p)
      );
      if (matchingPrefix) {
        if (!targetNorm) {
          keysToRemove.push(storageKey);
        } else {
          const suffix = storageKey.slice(matchingPrefix.length);
          if (normalizeKey(suffix) === targetNorm) {
            keysToRemove.push(storageKey);
          }
        }
      }
    }

    if (!targetNorm || targetNorm === "color") {
      keysToRemove.push("orderos_custom_colors");
    }
    if (!targetNorm || targetNorm === "size") {
      keysToRemove.push("orderos_custom_sizes");
    }
    if (!targetNorm || targetNorm === "marketplace") {
      keysToRemove.push("orderos_custom_marketplaces");
    }

    keysToRemove.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}

/**
 * Broadcasts dropdown sync across same-tab listeners, other tabs via
 * BroadcastChannel, and storage events.
 */
export function broadcastDropdownSync(detail?: DropdownSyncDetail): void {
  if (typeof window === "undefined") return;
  const payload: DropdownSyncDetail = {
    ...detail,
    field: detail?.field ? normalizeKey(detail.field) : undefined,
    timestamp: detail?.timestamp ?? Date.now(),
    nonce: Math.random().toString(36).slice(2),
  };

  try {
    window.dispatchEvent(
      new CustomEvent(DROPDOWN_SYNC_EVENT, { detail: payload })
    );
  } catch {}

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(DROPDOWN_BROADCAST_CHANNEL);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {}

  try {
    window.localStorage.setItem(
      DROPDOWN_STORAGE_SYNC_KEY,
      JSON.stringify(payload)
    );
  } catch {}
}

const DROPDOWN_QUERY_KEYS = [
  ["product-dropdown-options"],
  ["material-dropdown-options"],
  ["userManagementDropdownOptions"],
  ["user-dropdown-options"],
  ["setting-masters-groups"],
  ["setting-masters-options"],
];

const ENTITY_QUERY_KEYS_FOR_RENAME = [
  ["products"],
  ["product-variants"],
  ["product-stats"],
  ["materials"],
  ["material-variants"],
  ["material-stats"],
  ["managed-users"],
  ["users"],
  ["employees"],
  ["companies"],
  ["company-branches"],
  ["parties"],
  ["ledgers"],
  ["sales-challans"],
  ["purchase-challans"],
  ["sales-invoices"],
  ["purchase-invoices"],
  ["inventories"],
  ["sku-mappings"],
];

/**
 * Invalidates all dropdown queries (and active entity lists on rename), clears
 * stale local caches when appropriate, and broadcasts sync notifications.
 */
export function invalidateAndSyncAllDropdowns(
  queryClient: QueryClient,
  detail?: DropdownSyncDetail,
  options?: { emitBroadcast?: boolean; clearLocalCache?: boolean }
): void {
  const emitBroadcast = options?.emitBroadcast !== false;
  const shouldClearCache =
    options?.clearLocalCache ??
    (detail?.action === "update" ||
      detail?.action === "delete" ||
      detail?.action === "toggle" ||
      detail?.action === "sync");

  if (shouldClearCache) {
    clearLocalCustomOptionCaches(detail?.field);
  }

  DROPDOWN_QUERY_KEYS.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey, refetchType: "all" });
  });

  if (detail?.action === "update") {
    ENTITY_QUERY_KEYS_FOR_RENAME.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });

    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent(OPTION_RENAMED_EVENT, {
            detail: {
              ...detail,
              field: detail.field ? normalizeKey(detail.field) : undefined,
            },
          })
        );
      } catch {}
    }
  }

  if (emitBroadcast) {
    broadcastDropdownSync(detail);
  }
}

/**
 * Optimistically inserts a newly added "+ Other" / Setting Master option
 * into cached product, material, user, and Setting Masters React Query caches
 * without creating case-insensitive duplicates.
 */
export function optimisticallyAddDropdownOptionToCache(
  queryClient: QueryClient,
  input: { field: string; value: string; label?: string }
): void {
  const normField = normalizeKey(input.field);
  const cleanValue = String(input.value || "").trim();
  const cleanLabel = String(input.label || input.value || "").trim();
  if (!normField || (!cleanValue && !cleanLabel)) return;

  const isColorHex = normField === "color" && cleanValue.startsWith("#");
  const matchTarget = (isColorHex ? cleanLabel : cleanValue).toLowerCase();

  const tempOption: SavedDropdownOption & {
    createdAt?: string;
    updatedAt?: string;
  } = {
    id: `temp-${normField}-${Date.now()}`,
    field: normField,
    value: cleanValue,
    label: cleanLabel || cleanValue,
    isActive: true,
    sortOrder: 9999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const upsertIntoSavedArray = (arr?: any[]) => {
    const list = Array.isArray(arr) ? arr : [];
    const existingIdx = list.findIndex((o) => {
      if (normalizeKey(o?.field) !== normField) return false;
      const oVal = String(o?.value || "").trim().toLowerCase();
      const oLbl = String(o?.label || "").trim().toLowerCase();
      if (isColorHex) {
        return oLbl === matchTarget || oVal === matchTarget;
      }
      return oVal === matchTarget || (oLbl && oLbl === cleanLabel.toLowerCase());
    });

    if (existingIdx !== -1) {
      const existing = list[existingIdx];
      if (existing?.isActive !== false && existing?.label !== "__DELETED__") {
        return list;
      }
      const next = [...list];
      next[existingIdx] = {
        ...existing,
        value: cleanValue,
        label: cleanLabel || cleanValue,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
      return next;
    }

    return [...list, tempOption];
  };

  // 1. Update Product & Material dropdown caches ({ success, data: { savedOptions } })
  [["product-dropdown-options"], ["material-dropdown-options"]].forEach(
    (queryKey) => {
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data) return old;
        const nextSaved = upsertIntoSavedArray(old.data.savedOptions);
        if (nextSaved === old.data.savedOptions) return old;
        return {
          ...old,
          data: {
            ...old.data,
            savedOptions: nextSaved,
          },
        };
      });
    }
  );

  // 2. Update User dropdown cache ({ savedOptions, departments, companies, genders })
  queryClient.setQueryData(["user-dropdown-options"], (old: any) => {
    if (!old) return old;
    const nextSaved = upsertIntoSavedArray(old.savedOptions);
    const next = { ...old, savedOptions: nextSaved };
    const displayVal = cleanLabel || cleanValue;
    if (
      normField === "department" &&
      Array.isArray(old.departments) &&
      !old.departments.some(
        (d: string) => d.trim().toLowerCase() === displayVal.toLowerCase()
      )
    ) {
      next.departments = [...old.departments, displayVal];
    }
    if (
      normField === "company" &&
      Array.isArray(old.companies) &&
      !old.companies.some(
        (c: string) => c.trim().toLowerCase() === displayVal.toLowerCase()
      )
    ) {
      next.companies = [...old.companies, displayVal];
    }
    if (
      normField === "gender" &&
      Array.isArray(old.genders) &&
      !old.genders.some(
        (g: string) => g.trim().toLowerCase() === displayVal.toLowerCase()
      )
    ) {
      next.genders = [...old.genders, displayVal];
    }
    return next;
  });

  // 3. Update Setting Masters options caches matching this normalized field
  const optionQueries = queryClient.getQueriesData<any[]>({
    queryKey: ["setting-masters-options"],
  });
  let wasAddedToSettingMasters = false;
  optionQueries.forEach(([qKey, qData]) => {
    const qField = Array.isArray(qKey) ? String(qKey[1] || "") : "";
    if (normalizeKey(qField) === normField && Array.isArray(qData)) {
      const nextList = upsertIntoSavedArray(qData);
      if (nextList !== qData) {
        wasAddedToSettingMasters = true;
        queryClient.setQueryData(qKey, nextList);
      }
    }
  });

  // 4. Update Setting Masters field groups counts if needed
  queryClient.setQueryData(["setting-masters-groups"], (old: any) => {
    if (!Array.isArray(old)) return old;
    return old.map((g: any) => {
      if (normalizeKey(g?.field) !== normField) return g;
      if (!wasAddedToSettingMasters && optionQueries.length > 0) return g;
      return {
        ...g,
        totalCount: (g.totalCount || 0) + 1,
        activeCount: (g.activeCount || 0) + 1,
      };
    });
  });
}

/**
 * Helper to check if a newly entered custom value already exists (case-insensitive)
 * inside the active option list, returning the canonical existing option if found.
 */
export function findExistingOptionMatch(
  options: DropdownOptionItem[],
  candidate: string
): DropdownOptionItem | undefined {
  const needle = String(candidate || "").trim().toLowerCase();
  if (!needle) return undefined;
  return options.find((opt) => {
    const valMatch = String(opt.value || "").trim().toLowerCase() === needle;
    const lblMatch = String(opt.label || "").trim().toLowerCase() === needle;
    return valMatch || lblMatch;
  });
}

/**
 * Merges options for dropdowns with strict case-insensitive deduplication.
 * Once `savedOptions` is loaded from DB (`Array.isArray(savedOptions)`), DB acts
 * as the Single Source of Truth so deleted or disabled Setting Masters defaults
 * never respawn. While DB is still loading (`savedOptions === undefined`),
 * falls back to `defaultOptions`.
 */
export function buildMergedOptions(
  field: string | string[],
  defaultOptions: Array<string | DropdownOptionItem>,
  savedOptions?: SavedDropdownOption[],
  extraValues?: Array<string | null | undefined>
): DropdownOptionItem[] {
  const fieldsToMatch = new Set(
    (Array.isArray(field) ? field : [field]).map(normalizeKey).filter(Boolean)
  );

  const disabledSet = new Set<string>();
  const activeSaved: SavedDropdownOption[] = [];

  if (Array.isArray(savedOptions)) {
    savedOptions.forEach((o) => {
      if (!o || !fieldsToMatch.has(normalizeKey(o.field))) return;
      const val = String(o.value || "").trim();
      const lbl = String(o.label || "").trim();
      if (o.isActive === false || lbl === "__DELETED__") {
        if (val) disabledSet.add(val.toLowerCase());
        if (lbl && lbl !== "__DELETED__") disabledSet.add(lbl.toLowerCase());
      } else if (val || lbl) {
        activeSaved.push(o);
      }
    });
  }

  const seenKeys = new Set<string>();
  const result: DropdownOptionItem[] = [];

  const addOption = (rawValue: string, rawLabel?: string) => {
    const value = String(rawValue || "").trim();
    const label = String(rawLabel || value).trim();
    if (!value && !label) return;

    const valLower = value.toLowerCase();
    const lblLower = label.toLowerCase();

    if (disabledSet.has(valLower) || disabledSet.has(lblLower)) return;

    // For hex-valued colors (e.g. value: "#E11D48", label: "Ruby"), deduplicate by color name
    // so two custom colors sharing a default hex don't collide while matching "Ruby" by name.
    const isHexValue = valLower.startsWith("#");
    if (isHexValue) {
      if (seenKeys.has(lblLower)) return;
      seenKeys.add(lblLower);
    } else {
      if (seenKeys.has(valLower) || seenKeys.has(lblLower)) return;
      seenKeys.add(valLower);
      seenKeys.add(lblLower);
    }

    result.push({
      label: label || value,
      value: value || label,
    });
  };

  if (Array.isArray(savedOptions)) {
    activeSaved.forEach((o) => {
      addOption(o.value, o.label || o.value);
    });
  } else {
    (defaultOptions || []).forEach((item) => {
      if (typeof item === "string") {
        addOption(item, item);
      } else if (item) {
        addOption(item.value, item.label || item.value);
      }
    });
  }

  (extraValues || []).forEach((ext) => {
    const clean = String(ext || "").trim();
    if (clean) addOption(clean, clean);
  });

  return result;
}

const STANDARD_ALPHA_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "4XL"];

/**
 * Extracts active alpha and numeric preset size lists from Setting Masters `savedOptions`.
 */
export function extractDbSizeGroups(savedOptions?: SavedDropdownOption[]): {
  alphaSizes: string[];
  numericSizes: string[];
} {
  if (!Array.isArray(savedOptions)) {
    return { alphaSizes: [], numericSizes: [] };
  }

  const alphaSet = new Set(STANDARD_ALPHA_ORDER.map((s) => s.toLowerCase()));
  const activeSizes = buildMergedOptions(
    ["size", "sizes", "sizelist"],
    [],
    savedOptions
  ).map((o) => o.label || o.value);

  const alphaSizes: string[] = [];
  const numericSizes: string[] = [];

  activeSizes.forEach((sz) => {
    const clean = String(sz || "").trim();
    if (!clean) return;
    if (alphaSet.has(clean.toLowerCase())) {
      alphaSizes.push(clean);
    } else if (/^\d+$/.test(clean)) {
      numericSizes.push(clean);
    }
  });

  return { alphaSizes, numericSizes };
}

/**
 * Remaps a single form field value when its underlying Setting Master option is renamed.
 */
export function remapRenamedValue(
  currentValue: string | null | undefined,
  detail?: DropdownSyncDetail
): string | null {
  if (!currentValue || !detail) return null;
  const trimmed = String(currentValue).trim();
  const candidates = [detail.oldValue, detail.oldLabel]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
  if (candidates.length === 0) return null;

  if (candidates.includes(trimmed.toLowerCase())) {
    const replacement = String(detail.newLabel || detail.newValue || "").trim();
    if (replacement && replacement !== trimmed) {
      return replacement;
    }
  }
  return null;
}

/**
 * Remaps an array of selected option values when a Setting Master option is renamed.
 */
export function remapRenamedArray(
  currentValues: string[] | null | undefined,
  detail?: DropdownSyncDetail
): string[] | null {
  if (!Array.isArray(currentValues) || currentValues.length === 0 || !detail) {
    return null;
  }
  let changed = false;
  const seen = new Set<string>();
  const next: string[] = [];

  currentValues.forEach((item) => {
    const mapped = remapRenamedValue(item, detail);
    const val = mapped ?? String(item || "").trim();
    if (mapped) changed = true;
    const key = val.toLowerCase();
    if (val && !seen.has(key)) {
      seen.add(key);
      next.push(val);
    }
  });

  return changed ? next : null;
}
