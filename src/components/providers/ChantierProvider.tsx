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
import { defaultAppData, loadAppData, saveAppData, scopeByChantier } from "@/lib/storage";
import { withRetardFlag } from "@/lib/taches";
import type {
  AppData,
  BudgetLigne,
  BudgetType,
  Certificat,
  Chantier,
  ChantierStatut,
  CompteRendu,
  Photo,
  Plan,
  Pointage,
  Reunion,
  Tache,
  TachePriorite,
  TacheStatut,
} from "@/lib/types";

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

interface AppContextValue {
  ready: boolean;
  data: AppData;
  chantiers: Chantier[];
  selectedId: string | null;
  selectedChantier: Chantier | null;
  taches: Tache[];
  tachesForSelected: Tache[];
  plansForSelected: Plan[];
  photosForSelected: Photo[];
  budgetForSelected: BudgetLigne[];
  comptesRendusForSelected: CompteRendu[];
  pointagesForSelected: Pointage[];
  reunionsForSelected: Reunion[];
  certificatsForSelected: Certificat[];
  selectChantier: (id: string) => void;
  createChantier: (nom: string, client?: string) => void;
  createTache: (input: CreateTacheInput) => void;
  updateTache: (id: string, input: UpdateTacheInput) => void;
  updateTacheStatut: (id: string, statut: TacheStatut) => void;
  deleteTache: (id: string) => void;
  createPlan: (nom: string, pdfUrl: string) => void;
  deletePlan: (id: string) => void;
  createPhoto: (url: string, tags: string[], note?: string) => void;
  deletePhoto: (id: string) => void;
  createBudgetLigne: (type: BudgetType, libelle: string, montant: number, date: string) => void;
  deleteBudgetLigne: (id: string) => void;
  createCompteRendu: (titre: string, contenu: string, date: string) => void;
  deleteCompteRendu: (id: string) => void;
  createPointage: (ouvrier: string, date: string, heures: number, pauses: number) => void;
  deletePointage: (id: string) => void;
  createReunion: (titre: string, date: string, participants: string[], contenu: string) => void;
  deleteReunion: (id: string) => void;
  createCertificat: (type: string, contenu: string, date: string) => void;
  deleteCertificat: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function requireChantierId(prev: AppData): string | null {
  return prev.selectedId;
}

export function ChantierProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadAppData();
    const selectedId =
      stored.selectedId && stored.chantiers.some((c) => c.id === stored.selectedId)
        ? stored.selectedId
        : stored.chantiers[0]?.id ?? null;
    setData({
      ...stored,
      selectedId,
      taches: stored.taches.map((t) =>
        withRetardFlag({ ...t, description: t.description ?? null }),
      ),
    });
    setReady(true);
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
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
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const tache = withRetardFlag({
          id: crypto.randomUUID(),
          chantierId,
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
          return withRetardFlag({ ...t, ...input });
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

  const createPlan = useCallback(
    (nom: string, pdfUrl: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const plan: Plan = {
          id: crypto.randomUUID(),
          chantierId,
          nom,
          pdfUrl,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, plans: [plan, ...prev.plans] };
      });
    },
    [persist],
  );

  const deletePlan = useCallback(
    (id: string) => persist((prev) => ({ ...prev, plans: prev.plans.filter((p) => p.id !== id) })),
    [persist],
  );

  const createPhoto = useCallback(
    (url: string, tags: string[], note?: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const photo: Photo = {
          id: crypto.randomUUID(),
          chantierId,
          url,
          tags,
          note: note ?? null,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, photos: [photo, ...prev.photos] };
      });
    },
    [persist],
  );

  const deletePhoto = useCallback(
    (id: string) => persist((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== id) })),
    [persist],
  );

  const createBudgetLigne = useCallback(
    (type: BudgetType, libelle: string, montant: number, date: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const ligne: BudgetLigne = {
          id: crypto.randomUUID(),
          chantierId,
          type,
          libelle,
          montant,
          date,
        };
        return { ...prev, budgetLignes: [ligne, ...prev.budgetLignes] };
      });
    },
    [persist],
  );

  const deleteBudgetLigne = useCallback(
    (id: string) =>
      persist((prev) => ({ ...prev, budgetLignes: prev.budgetLignes.filter((b) => b.id !== id) })),
    [persist],
  );

  const createCompteRendu = useCallback(
    (titre: string, contenu: string, date: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const cr: CompteRendu = {
          id: crypto.randomUUID(),
          chantierId,
          titre,
          contenu,
          date,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, comptesRendus: [cr, ...prev.comptesRendus] };
      });
    },
    [persist],
  );

  const deleteCompteRendu = useCallback(
    (id: string) =>
      persist((prev) => ({
        ...prev,
        comptesRendus: prev.comptesRendus.filter((c) => c.id !== id),
      })),
    [persist],
  );

  const createPointage = useCallback(
    (ouvrier: string, date: string, heures: number, pauses: number) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const pt: Pointage = {
          id: crypto.randomUUID(),
          chantierId,
          ouvrier,
          date,
          heures,
          pauses,
        };
        return { ...prev, pointages: [pt, ...prev.pointages] };
      });
    },
    [persist],
  );

  const deletePointage = useCallback(
    (id: string) =>
      persist((prev) => ({ ...prev, pointages: prev.pointages.filter((p) => p.id !== id) })),
    [persist],
  );

  const createReunion = useCallback(
    (titre: string, date: string, participants: string[], contenu: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const reunion: Reunion = {
          id: crypto.randomUUID(),
          chantierId,
          titre,
          date,
          participants,
          contenu,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, reunions: [reunion, ...prev.reunions] };
      });
    },
    [persist],
  );

  const deleteReunion = useCallback(
    (id: string) =>
      persist((prev) => ({ ...prev, reunions: prev.reunions.filter((r) => r.id !== id) })),
    [persist],
  );

  const createCertificat = useCallback(
    (type: string, contenu: string, date: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const cert: Certificat = {
          id: crypto.randomUUID(),
          chantierId,
          type,
          contenu,
          date,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, certificats: [cert, ...prev.certificats] };
      });
    },
    [persist],
  );

  const deleteCertificat = useCallback(
    (id: string) =>
      persist((prev) => ({ ...prev, certificats: prev.certificats.filter((c) => c.id !== id) })),
    [persist],
  );

  const selectedChantier = useMemo(
    () => data.chantiers.find((c) => c.id === data.selectedId) ?? null,
    [data.chantiers, data.selectedId],
  );

  const sid = data.selectedId;

  const value = useMemo(
    (): AppContextValue => ({
      ready,
      data,
      chantiers: data.chantiers,
      selectedId: sid,
      selectedChantier,
      taches: data.taches,
      tachesForSelected: scopeByChantier(data.taches, sid),
      plansForSelected: scopeByChantier(data.plans, sid),
      photosForSelected: scopeByChantier(data.photos, sid),
      budgetForSelected: scopeByChantier(data.budgetLignes, sid),
      comptesRendusForSelected: scopeByChantier(data.comptesRendus, sid),
      pointagesForSelected: scopeByChantier(data.pointages, sid),
      reunionsForSelected: scopeByChantier(data.reunions, sid),
      certificatsForSelected: scopeByChantier(data.certificats, sid),
      selectChantier,
      createChantier,
      createTache,
      updateTache,
      updateTacheStatut,
      deleteTache,
      createPlan,
      deletePlan,
      createPhoto,
      deletePhoto,
      createBudgetLigne,
      deleteBudgetLigne,
      createCompteRendu,
      deleteCompteRendu,
      createPointage,
      deletePointage,
      createReunion,
      deleteReunion,
      createCertificat,
      deleteCertificat,
    }),
    [
      ready,
      data,
      sid,
      selectedChantier,
      selectChantier,
      createChantier,
      createTache,
      updateTache,
      updateTacheStatut,
      deleteTache,
      createPlan,
      deletePlan,
      createPhoto,
      deletePhoto,
      createBudgetLigne,
      deleteBudgetLigne,
      createCompteRendu,
      deleteCompteRendu,
      createPointage,
      deletePointage,
      createReunion,
      deleteReunion,
      createCertificat,
      deleteCertificat,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useChantiers() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useChantiers must be used within ChantierProvider");
  return ctx;
}
