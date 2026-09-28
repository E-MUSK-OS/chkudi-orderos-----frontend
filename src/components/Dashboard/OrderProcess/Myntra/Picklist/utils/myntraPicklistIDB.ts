"use client";

const IDB_NAME = "myntra_picklist_idb_v1";
const IDB_STORE = "picklist_cache";
const IDB_KEY = "current_batch";

export interface StoredMyntraFileRecord {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: ArrayBuffer;
}

export interface StoredMyntraPicklistState {
  files: StoredMyntraFileRecord[];
  hasResults: boolean;
  picklistItems: any[];
  summary: any;
  timestamp: number;
}

/**
 * Open or initialize IndexedDB connection
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject("IndexedDB not available");
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Convert native File objects to serializable records with ArrayBuffers
 */
export async function filesToStoredRecords(files: File[]): Promise<StoredMyntraFileRecord[]> {
  const records: StoredMyntraFileRecord[] = [];
  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      records.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        data: buffer,
      });
    } catch (err) {
      console.warn(`Failed to serialize file ${file.name} for IndexedDB:`, err);
    }
  }
  return records;
}

/**
 * Reconstruct native File objects from stored records
 */
export function storedRecordsToFiles(records: StoredMyntraFileRecord[]): File[] {
  if (!Array.isArray(records)) return [];
  return records.map((rec) => {
    return new File([rec.data], rec.name, {
      type: rec.type,
      lastModified: rec.lastModified,
    });
  });
}

/**
 * Save current picklist state and files to IndexedDB
 */
export async function saveMyntraPicklistToIDB(
  files: File[],
  hasResults: boolean,
  picklistItems: any[],
  summary: any
): Promise<void> {
  try {
    const fileRecords = await filesToStoredRecords(files);
    const payload: StoredMyntraPicklistState = {
      files: fileRecords,
      hasResults,
      picklistItems,
      summary,
      timestamp: Date.now(),
    };

    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(payload, IDB_KEY);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to save Myntra picklist to IndexedDB:", err);
  }
}

/**
 * Load temporary picklist state and files from IndexedDB
 */
export async function loadMyntraPicklistFromIDB(): Promise<{
  files: File[];
  hasResults: boolean;
  picklistItems: any[];
  summary: any;
  timestamp: number;
} | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(IDB_KEY);

    const result: StoredMyntraPicklistState | null = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!result) return null;

    const files = storedRecordsToFiles(result.files);

    return {
      files,
      hasResults: result.hasResults,
      picklistItems: result.picklistItems || [],
      summary: result.summary || {
        totalOrders: 0,
        totalUnits: 0,
        uniqueSkus: 0,
        matchedSkus: 0,
        unmatchedSkus: 0,
      },
      timestamp: result.timestamp || 0,
    };
  } catch (err) {
    console.warn("Failed to load Myntra picklist from IndexedDB:", err);
    return null;
  }
}

/**
 * Clear temporary Myntra picklist state from IndexedDB (e.g. on "New Batch" or "Clear Files")
 */
export async function clearMyntraPicklistIDB(): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.delete(IDB_KEY);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to clear Myntra picklist from IndexedDB:", err);
  }
}
