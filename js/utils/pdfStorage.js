/**
 * IndexedDB helper for storing uploaded book PDF data URLs safely
 * without running into localStorage quota limits (5MB).
 */

const DB_NAME = "StudyMartPdfStorageDB";
const STORE_NAME = "pdf_files";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

export async function saveBookFileToIDB(bookId, fileKey, dataUrl) {
  if (!bookId || !dataUrl) return false;
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const storageKey = `${bookId}_${fileKey}`;
      store.put(dataUrl, storageKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (err) {
      console.warn("IndexedDB save failed:", err);
      resolve(false);
    }
  });
}

export async function getBookFileFromIDB(bookId, fileKey) {
  if (!bookId) return null;
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const storageKey = `${bookId}_${fileKey}`;
      const getReq = store.get(storageKey);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    } catch (err) {
      console.warn("IndexedDB read failed:", err);
      resolve(null);
    }
  });
}

if (typeof window !== "undefined") {
  window.saveBookFileToIDB = saveBookFileToIDB;
  window.getBookFileFromIDB = getBookFileFromIDB;
}
