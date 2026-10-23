import { UploadItem } from "../types/vms.types";

const DB_NAME = "vms_upload_queue_db";
const STORE_NAME = "pending_uploads";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Persist an upload item (including video Blob) into browser IndexedDB.
 */
export async function persistQueueItem(item: UploadItem): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("Failed to persist VMS upload item to IndexedDB:", err);
  }
}

/**
 * Remove an uploaded item from browser IndexedDB once upload completes.
 */
export async function removeQueueItem(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("Failed to remove VMS upload item from IndexedDB:", err);
  }
}

/**
 * Load all pending or failed recordings stored in IndexedDB.
 */
export async function loadPersistedQueueItems(): Promise<UploadItem[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as UploadItem[]) || [];
        // Only return items that are pending or failed or uploading (reset uploading to pending)
        const uncompleted = items
          .filter((item) => item.status !== "completed")
          .map((item) => ({
            ...item,
            status: "pending" as const,
            progress: 0,
          }));
        resolve(uncompleted);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn("Failed to load VMS upload items from IndexedDB:", err);
    return [];
  }
}
