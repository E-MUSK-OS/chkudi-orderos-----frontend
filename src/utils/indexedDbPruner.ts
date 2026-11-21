/**
 * 7-Day Auto-Cleanup Utility for IndexedDB
 * 
 * Retention Period: 7 days (604,800,000 ms)
 * STRICT RULE:
 * NEVER delete any record unless there is EXPLICIT PROOF that it is > 7 days old!
 * Fresh records (< 7 days) are ALWAYS preserved.
 * 
 * Automatically cleans:
 * 1. chkudi_orderos_idb_v2:
 *    - amazon_files: removes batch PDFs and files older than 7 days
 *    - flipkart_files: removes files older than 7 days
 *    - flipkart_batch_blobs: removes batch blobs older than 7 days
 * 2. myntra_picklist_idb_v1:
 *    - picklist_cache: removes cached picklist state older than 7 days
 * 3. Legacy Databases:
 *    - Permanently deletes obsolete legacy databases: chkudi_orderos_idb, chkudi_orderos_idb_v1
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms
const PRUNE_THROTTLE_MS = 60 * 1000; // 1 minute throttle
const PRUNE_STORAGE_KEY = "chkudi_idb_last_prune_timestamp";

/**
 * Open a specified IndexedDB database safely
 */
function openDatabase(name: string, version?: number): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return resolve(null);
    }
    const request = version ? window.indexedDB.open(name, version) : window.indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn(`[IDBPruner] Notice: Could not open database "${name}":`, request.error);
      resolve(null);
    };
    request.onblocked = () => {
      console.warn(`[IDBPruner] Notice: Database "${name}" open was blocked.`);
      resolve(null);
    };
  });
}

/**
 * Clean expired keys (> 7 days) from an object store in chkudi_orderos_idb_v2.
 * Uses a safe two-phase architecture:
 * Phase 1: Read all keys and timestamps.
 * Phase 2: ONLY delete keys that are PROVEN to be older than 7 days.
 * If a key is NOT older than 7 days, it is NEVER deleted!
 */
async function pruneStore(db: IDBDatabase, storeName: string, now: number): Promise<number> {
  if (!db.objectStoreNames.contains(storeName)) return 0;

  // 1. READ PHASE: Collect all keys and values in a single readonly transaction
  const entries: { key: string; value: any }[] = await new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const keysReq = store.getAllKeys();
      const valsReq = store.getAll();

      let keys: IDBValidKey[] = [];
      let vals: any[] = [];
      let done = 0;

      const checkDone = () => {
        done++;
        if (done === 2) {
          const result = keys.map((k, i) => ({
            key: String(k),
            value: vals[i],
          }));
          resolve(result);
        }
      };

      keysReq.onsuccess = () => {
        keys = keysReq.result || [];
        checkDone();
      };
      keysReq.onerror = () => resolve([]);

      valsReq.onsuccess = () => {
        vals = valsReq.result || [];
        checkDone();
      };
      valsReq.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });

  if (!entries || entries.length === 0) return 0;

  // 2. IN-MEMORY EVALUATION: Identify keys that are EXPLICITLY older than 7 days
  const keysToDelete = new Set<string>();
  const keysToBackfill = new Map<string, number>();

  // Map companion _saved_at keys
  const timestampMap = new Map<string, number>();
  for (const entry of entries) {
    if (entry.key.endsWith("_saved_at")) {
      const baseKey = entry.key.replace(/_saved_at$/, "");
      const ts = Number(entry.value);
      if (ts) {
        timestampMap.set(baseKey, ts);
      }
    }
  }

  for (const entry of entries) {
    const key = entry.key;
    if (key.endsWith("_saved_at")) continue;

    // Case 1: Record has explicit companion timestamp
    if (timestampMap.has(key)) {
      const savedAt = timestampMap.get(key)!;
      if (now - savedAt > SEVEN_DAYS_MS) {
        // EXPIRED (> 7 days) -> Mark for deletion
        keysToDelete.add(key);
        keysToDelete.add(`${key}_saved_at`);
      }
      // If <= 7 days, DO NOTHING! Keep safe!
      continue;
    }

    // Case 2: Latest uploaded files (inspect File.lastModified if available)
    if (key === "latest_files" || key === "latest_flipkart_files") {
      const val = entry.value;
      let fileDate = 0;
      if (val && typeof val === "object") {
        const sampleFile =
          val.rawExcelFile ||
          val.originalPdfFile ||
          val.shippingLabelsPdfFile ||
          val.excelFile ||
          val.pdfFile;
        if (sampleFile && typeof sampleFile.lastModified === "number") {
          fileDate = sampleFile.lastModified;
        }
      }

      if (fileDate && now - fileDate > SEVEN_DAYS_MS) {
        // Explicitly older than 7 days -> Delete
        keysToDelete.add(key);
      } else {
        // Fresh or recently modified: Keep it safe and record a timestamp
        keysToBackfill.set(`${key}_saved_at`, fileDate || now);
      }
      continue;
    }

    // Case 3: Batch blobs (batch_<id> or batch_pdf_<id>) without timestamp
    if (key.startsWith("batch_") || key.startsWith("batch_pdf_")) {
      // Check if key contains an embedded date pattern (e.g. YYYYMMDD or YYYY-MM-DD)
      const dateMatch = key.match(/\b(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)\b/);
      let embeddedDate = 0;
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        embeddedDate = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
      }

      if (embeddedDate && now - embeddedDate > SEVEN_DAYS_MS) {
        // Proven older than 7 days -> Delete
        keysToDelete.add(key);
      } else {
        // NOT proven older than 7 days -> NEVER DELETE!
        // Backfill timestamp so it has an accurate 7-day timer from today
        keysToBackfill.set(`${key}_saved_at`, embeddedDate || now);
      }
    }
  }

  // 3. WRITE PHASE: Apply deletions & backfill timestamps synchronously in ONE readwrite transaction
  if (keysToDelete.size === 0 && keysToBackfill.size === 0) return 0;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      // Delete only expired keys
      keysToDelete.forEach((key) => {
        store.delete(key);
      });

      // Backfill timestamps for fresh untracked keys
      keysToBackfill.forEach((ts, tsKey) => {
        store.put(ts, tsKey);
      });

      tx.oncomplete = () => {
        if (keysToDelete.size > 0) {
          console.log(`[IDBPruner] Deleted ${keysToDelete.size} expired (>7d) key(s) from "${storeName}".`);
        }
        resolve(keysToDelete.size);
      };
      tx.onerror = (err) => {
        console.warn(`[IDBPruner] Error executing writes on "${storeName}":`, err);
        resolve(0);
      };
    } catch (e) {
      console.warn(`[IDBPruner] Could not open write transaction on "${storeName}":`, e);
      resolve(0);
    }
  });
}

/**
 * Clean expired Myntra picklist state (> 7 days) from myntra_picklist_idb_v1
 */
async function pruneMyntraPicklist(now: number): Promise<boolean> {
  const db = await openDatabase("myntra_picklist_idb_v1", 1);
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains("picklist_cache")) {
        db.close();
        return resolve(false);
      }

      const tx = db.transaction("picklist_cache", "readwrite");
      const store = tx.objectStore("picklist_cache");
      const request = store.get("current_batch");

      request.onsuccess = () => {
        const record = request.result;
        // Strictly delete ONLY if record has timestamp AND is older than 7 days
        if (record && typeof record.timestamp === "number") {
          const age = now - record.timestamp;
          if (age > SEVEN_DAYS_MS) {
            store.delete("current_batch");
            console.log(`[IDBPruner] Cleared expired Myntra picklist cache (${Math.round(age / 86400000)} days old)`);
          }
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch (e) {
      console.warn("[IDBPruner] Error pruning Myntra picklist IDB:", e);
      db.close();
      resolve(false);
    }
  });
}

/**
 * Permanently delete legacy obsolete IndexedDB databases
 */
function pruneLegacyDatabases(): void {
  try {
    if (typeof window === "undefined" || !window.indexedDB) return;
    window.indexedDB.deleteDatabase("chkudi_orderos_idb");
    window.indexedDB.deleteDatabase("chkudi_orderos_idb_v1");
  } catch (err) {
    // Ignore legacy cleanup errors
  }
}

/**
 * Main 7-day auto-cleanup runner
 * Safely invoked on app load across all pages.
 */
export async function pruneExpiredIndexedDB(force = false): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;

  const now = Date.now();
  const lastPrune = Number(localStorage.getItem(PRUNE_STORAGE_KEY) || 0);

  // Throttle execution: Only run once per minute to avoid redundant runs on instant fast clicks
  if (!force && lastPrune && now - lastPrune < PRUNE_THROTTLE_MS) {
    return;
  }

  try {
    // 1. Delete legacy obsolete databases
    pruneLegacyDatabases();

    // 2. Prune Amazon & Flipkart stores in chkudi_orderos_idb_v2
    const mainDb = await openDatabase("chkudi_orderos_idb_v2", 2);
    if (mainDb) {
      const stores = ["amazon_files", "flipkart_files", "flipkart_batch_blobs"];
      for (const storeName of stores) {
        await pruneStore(mainDb, storeName, now);
      }
      mainDb.close();
    }

    // 3. Prune Myntra picklist cache
    await pruneMyntraPicklist(now);

    // 4. Update throttle marker
    localStorage.setItem(PRUNE_STORAGE_KEY, now.toString());
  } catch (error) {
    console.warn("[IDBPruner] Auto-cleanup encountered a notice:", error);
  }
}
