const KEY = "heatmapConfig";

export const defaultHeatmapConfig = {
  needDevelop: [
    { color: "#fe0d00", min: 0, max: 65 },
    { color: "#F59B02", min: 66, max: 75 },
    { color: "#f0dc02", min: 76, max: 85 },
    { color: "#9de20f", min: 86, max: 92 },
    { color: "#0de627", min: 93, max: 100 },
  ],
  readinessScore: [
    { color: "#DE350B", min: 0, max: 65 },
    { color: "#FD9F28", min: 66, max: 80 },
    { color: "#00875A", min: 81, max: 100 },
  ],
};

export function getHeatmapConfig() {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return defaultHeatmapConfig;
    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.needDevelop || !parsed.readinessScore) return defaultHeatmapConfig;
    return parsed;
  } catch {
    return defaultHeatmapConfig;
  }
}

export function setHeatmapConfig(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

