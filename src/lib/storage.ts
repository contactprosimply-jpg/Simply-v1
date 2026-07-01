import type { AppData, BudgetLigne, Chantier, Photo, Plan, Tache } from "@/lib/types";

export const STORAGE_KEY = "simply-btp-data";
export const DATA_VERSION = 2;

export const defaultAppData: AppData = {
  version: DATA_VERSION,
  chantiers: [],
  taches: [],
  reserves: [],
  plans: [],
  photos: [],
  budgetLignes: [],
  comptesRendus: [],
  pointages: [],
  reunions: [],
  certificats: [],
  selectedId: null,
};

export function migrateAppData(raw: Partial<AppData>): AppData {
  const base = { ...defaultAppData, ...raw, version: DATA_VERSION };

  return {
    ...base,
    reserves: base.reserves ?? [],
    chantiers: base.chantiers.map(
      (c): Chantier => ({
        ...c,
        adresse: c.adresse ?? null,
        client: c.client ?? null,
        montant: c.montant ?? null,
        supabaseChantierId: c.supabaseChantierId ?? null,
      }),
    ),
    taches: base.taches.map(
      (t): Tache => ({
        ...t,
        description: t.description ?? null,
        lot: t.lot ?? null,
        reserveId: t.reserveId ?? null,
        retard: t.retard ?? false,
      }),
    ),
    photos: base.photos.map(
      (p): Photo => ({
        ...p,
        tags: p.tags ?? [],
        note: p.note ?? null,
        tacheId: p.tacheId ?? null,
        reserveId: p.reserveId ?? null,
      }),
    ),
    plans: base.plans.map((p): Plan => ({ ...p, lot: p.lot ?? null })),
    budgetLignes: base.budgetLignes.map((b): BudgetLigne => ({ ...b, lot: b.lot ?? null })),
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return defaultAppData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppData;
    return migrateAppData(JSON.parse(raw));
  } catch {
    return defaultAppData;
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: DATA_VERSION }));
}

export function scopeByChantier<T extends { chantierId: string }>(
  items: T[],
  chantierId: string | null,
): T[] {
  if (!chantierId) return [];
  return items.filter((i) => i.chantierId === chantierId);
}

export function cascadeDeleteChantier(data: AppData, chantierId: string): AppData {
  const filter = <T extends { chantierId: string }>(arr: T[]) =>
    arr.filter((i) => i.chantierId !== chantierId);
  const chantiers = data.chantiers.filter((c) => c.id !== chantierId);
  const selectedId =
    data.selectedId === chantierId ? (chantiers[0]?.id ?? null) : data.selectedId;
  return {
    ...data,
    chantiers,
    selectedId,
    taches: filter(data.taches),
    reserves: filter(data.reserves ?? []),
    plans: filter(data.plans),
    photos: filter(data.photos),
    budgetLignes: filter(data.budgetLignes),
    comptesRendus: filter(data.comptesRendus),
    pointages: filter(data.pointages),
    reunions: filter(data.reunions),
    certificats: filter(data.certificats),
  };
}
