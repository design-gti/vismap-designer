// Ported from src/app/data/imageStorage.ts (no dependencies)

const DB_NAME = "org_chart_images";
const STORE_NAME = "employee_images";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("employeeId", "employeeId", { unique: false });
      }
    };
  });
}

export async function saveImage(employeeId, dataUrl) {
  const db = await openDB();
  const imageId = `img_${employeeId}_${Date.now()}`;
  const image = { id: imageId, dataUrl, employeeId, timestamp: Date.now() };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // delete old images for employee
    const index = store.index("employeeId");
    const curReq = index.openCursor(IDBKeyRange.only(employeeId));
    curReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    const addReq = store.add(image);
    addReq.onsuccess = () => resolve(imageId);
    addReq.onerror = () => reject(addReq.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getImage(imageId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(imageId);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function deleteImage(imageId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(imageId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getAllImageIds() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function imageExists(imageId) {
  const img = await getImage(imageId);
  return img !== null;
}

