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
import { withRetardFlag } from "@/lib/taches";
import type { Chantier, ChantierStatut, Tache, TachePriorite, TacheStatut } from "@/lib/types";

const STORAGE_KEY = "simply-btp-data";

interface AppData {
  chantiers: Chantier[];
  taches: Tache[];
  selectedId: string | null;
}

export interface CreateTacheInput {
  titre: string;
  description?: string;
  priorite?: TachePriorite;
  echeance?: string;
  statut?: TacheStatut;
}

export interface UpdateTacheInput {
  titre?: string;
  description?: string | null;
  priorite?: TachePriorite;
  echeance?: string | null;
  statut?: TacheStatut;
}

interface ChantierContextValue {
  chantiers: Chantier[];
  selectedId: string | null;
  selectedChantier: Chantier | null;
  taches: Tache[];
  ready: boolean;
  selectChantier: (id: string) => void;
  createChantier: (nom: string, client?: string) => void;
  createTache: (input: CreateTacheInput) => void;
  updateTache: (id: string, input: UpdateTacheInput) => void;
  updateTacheStatut: (id: string, statut: TacheStatut) => void;
  deleteTache: (id: string) => void;
  tachesForSelected: Tache[];
}

const defaultData: AppData = { chantiers: [], taches: [], selectedId: null };

const ChantierContext = createContext<ChantierContextValue | null>(null);

function loadData(): AppData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...parsed,
      taches: (parsed.taches ?? []).map((t) =>
        withRetardFlag({ ...t, description: t.description ?? null, createdAt: t.createdAt ?? new Date().toISOString() }),
      ),
    };
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

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const selectChantier = useCallback(
    (id: string) => persist((prev) => ({ ...prev, selectedId: id })),
    [persist],
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
      persist((prev) => ({
        ...prev,
        chantiers: [chantier, ...prev.chantiers],
        selectedId: chantier.id,
      }));
    },
    [persist],
  );

  const createTache = useCallback(
    (input: CreateTacheInput) => {
      persist((prev) => {
        if (!prev.selectedId) return prev;
        const tache = withRetardFlag({
          id: crypto.randomUUID(),
          chantierId: prev.selectedId,
          titre: input.titre,
          description: input.description ?? null,
          statut: input.statut ?? "a_faire",
          priorite: input.priorite ?? "normale",
          echeance: input.echeance ?? null,
          retard: false,
          createdAt: new Date().toISOString(),
        });
        return { ...prev, taches: [tache, ...prev.taches] };
      });
    },
    [persist],
  );

  const updateTache = useCallback(
    (id: string, input: UpdateTacheInput) => {
      persist((prev) => ({
        ...prev,
        taches: prev.taches.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...input };
          return withRetardFlag(updated);
        }),
      }));
    },
    [persist],
  );

  const updateTacheStatut = useCallback(
    (id: string, statut: TacheStatut) => updateTache(id, { statut }),
    [updateTache],
  );

  const deleteTache = useCallback(
    (id: string) => persist((prev) => ({ ...prev, taches: prev.taches.filter((t) => t.id !== id) })),
    [persist],
  );

  const selectedChantier = useMemo(
    () => data.chantiers.find((c) => c.id === data.selectedId) ?? null,
    [data.chantiers, data.selectedId],
  );

  const tachesForSelected = useMemo(
    () => data.taches.filter((t) => t.chantierId === data.selectedId),
    [data.taches, data.selectedId],
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
      createTache,
      updateTache,
      updateTacheStatut,
      deleteTache,
      tachesForSelected,
    }),
    [
      data.chantiers,
      data.selectedId,
      data.taches,
      selectedChantier,
      ready,
      selectChantier,
      createChantier,
      createTache,
      updateTache,
      updateTacheStatut,
      deleteTache,
      tachesForSelected,
    ],
  );

  return <ChantierContext.Provider value={value}>{children}</ChantierContext.Provider>;
}

export function useChantiers() {
  const ctx = useContext(ChantierContext);
  if (!ctx) throw new Error("useChantiers must be used within ChantierProvider");
  return ctx;
}
