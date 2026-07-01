"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Chantier, ChantierStatut, Tache } from "@/lib/types";

const STORAGE_KEY = "simply-btp-data";

interface AppData {
  chantiers: Chantier[];
  taches: Tache[];
  selectedId: string | null;
}

interface ChantierContextValue {
  chantiers: Chantier[];
  selectedId: string | null;
  selectedChantier: Chantier | null;
  taches: Tache[];
  ready: boolean;
  selectChantier: (id: string) => void;
  createChantier: (nom: string, client?: string) => void;
}

const defaultData: AppData = { chantiers: [], taches: [], selectedId: null };

const ChantierContext = createContext<ChantierContextValue | null>(null);

function loadData(): AppData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw) as AppData;
  } catch {
    return defaultData;
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function ChantierProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadData();
    const selectedId =
      stored.selectedId && stored.chantiers.some((c) => c.id === stored.selectedId)
        ? stored.selectedId
        : stored.chantiers[0]?.id ?? null;
    setData({ ...stored, selectedId });
    setReady(true);
  }, []);

  const persist = useCallback((next: AppData) => {
    setData(next);
    saveData(next);
  }, []);

  const selectChantier = useCallback(
    (id: string) => {
      persist({ ...data, selectedId: id });
    },
    [data, persist],
  );

  const createChantier = useCallback(
    (nom: string, client?: string) => {
      const chantier: Chantier = {
        id: crypto.randomUUID(),
        nom,
        client: client ?? null,
        montant: null,
        statut: "en_cours" satisfies ChantierStatut,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...data,
        chantiers: [chantier, ...data.chantiers],
        selectedId: chantier.id,
      });
    },
    [data, persist],
  );

  const selectedChantier = useMemo(
    () => data.chantiers.find((c) => c.id === data.selectedId) ?? null,
    [data.chantiers, data.selectedId],
  );

  const value = useMemo(
    () => ({
      chantiers: data.chantiers,
      selectedId: data.selectedId,
      selectedChantier,
      taches: data.taches,
      ready,
      selectChantier,
      createChantier,
    }),
    [data, selectedChantier, ready, selectChantier, createChantier],
  );

  return <ChantierContext.Provider value={value}>{children}</ChantierContext.Provider>;
}

export function useChantiers() {
  const ctx = useContext(ChantierContext);
  if (!ctx) throw new Error("useChantiers must be used within ChantierProvider");
  return ctx;
}
