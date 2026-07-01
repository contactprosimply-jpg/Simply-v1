import type { AppData } from "@/lib/types";

export const STORAGE_KEY = "simply-btp-data";

export const defaultAppData: AppData = {
  chantiers: [],
  taches: [],
  plans: [],
  photos: [],
  budgetLignes: [],
  comptesRendus: [],
  pointages: [],
  reunions: [],
  certificats: [],
  selectedId: null,
};

export function loadAppData(): AppData {
  if (typeof window === "undefined") return defaultAppData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppData;
    return { ...defaultAppData, ...JSON.parse(raw) };
  } catch {
    return defaultAppData;
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function scopeByChantier<T extends { chantierId: string }>(
  items: T[],
  chantierId: string | null,
): T[] {
  if (!chantierId) return [];
  return items.filter((i) => i.chantierId === chantierId);
}
