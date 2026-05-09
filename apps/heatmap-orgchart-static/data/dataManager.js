// Ported from src/app/data/dataManager.ts (simplified, no dependencies)
import { employees as defaultEmployees } from "./orgChartData.js";
import { getAllImageIds, imageExists } from "./imageStorage.js";
import { generateDevelopmentData } from "./developmentData.js";

const STORAGE_KEY = "org_chart_employees_data";
const DEFAULT_DATA_KEY = "org_chart_default_employees";

function getStorageStats() {
  let totalSize = 0;
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const itemSize = (localStorage.getItem(key) || "").length;
        totalSize += itemSize + key.length;
      }
    }
  } catch {
    // ignore
  }
  const usedMB = totalSize / (1024 * 1024);
  const totalMB = 5;
  const percentUsed = (usedMB / totalMB) * 100;
  return { usedMB, totalMB, percentUsed };
}

function stripBase64Images(list) {
  return list.map((emp) => {
    const cleaned = { ...emp };
    if (cleaned.imageUrl && String(cleaned.imageUrl).startsWith("data:")) {
      delete cleaned.imageUrl;
    }
    return cleaned;
  });
}

async function cleanupBrokenImageRefs(list) {
  const ids = await getAllImageIds();
  const idSet = new Set(ids);

  const tasks = list.map(async (emp) => {
    if (!emp.imageUrl || !String(emp.imageUrl).startsWith("indexeddb:")) return;
    const imageId = String(emp.imageUrl).slice("indexeddb:".length);
    if (idSet.has(imageId)) return;
    const exists = await imageExists(imageId);
    if (!exists) delete emp.imageUrl;
  });

  await Promise.allSettled(tasks);
}

function ensureDevData(emp) {
  const needs = !emp.competencyDetails || emp.competencyDetails.length === 0;
  if (!needs) return emp;

  const readiness = emp.readinessScore ?? emp.competencyScore ?? 0;
  const dev = generateDevelopmentData(String(emp.id), Number(readiness));
  return { ...emp, ...dev };
}

function getDefaultEmployees() {
  try {
    const storedDefault = localStorage.getItem(DEFAULT_DATA_KEY);
    if (storedDefault) {
      const parsed = JSON.parse(storedDefault);
      if (Array.isArray(parsed)) return parsed.map(ensureDevData);
    }
  } catch {
    // ignore
  }

  // first load: persist bundled defaults
  try {
    localStorage.setItem(DEFAULT_DATA_KEY, JSON.stringify(defaultEmployees));
  } catch {
    // ignore
  }
  return defaultEmployees.map(ensureDevData);
}

function getEmployees() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const cleaned = stripBase64Images(parsed).map(ensureDevData);
        // kick async cleanup
        if (cleaned.some((e) => String(e.imageUrl || "").startsWith("indexeddb:"))) {
          cleanupBrokenImageRefs(cleaned);
        }
        return cleaned;
      }
    }
  } catch {
    // ignore
  }
  return getDefaultEmployees();
}

function saveEmployees(list) {
  const cleaned = stripBase64Images(list);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
}

function resetToDefault() {
  const defaults = getDefaultEmployees();
  saveEmployees(defaults);
}

function saveCurrentAsDefault() {
  const current = getEmployees();
  localStorage.setItem(DEFAULT_DATA_KEY, JSON.stringify(current));
}

function exportData() {
  return JSON.stringify(getEmployees(), null, 2);
}

function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return false;
    saveEmployees(parsed);
    return true;
  } catch {
    return false;
  }
}

export const dataManager = {
  getEmployees,
  saveEmployees,
  resetToDefault,
  exportData,
  importData,
  getStorageStats,
  cleanupBrokenImageRefs,
  saveCurrentAsDefault,
  getDefaultEmployees,
};

