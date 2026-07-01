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
import {
  cascadeDeleteChantier,
  defaultAppData,
  loadAppData,
  saveAppData,
  scopeByChantier,
} from "@/lib/storage";
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
  Reserve,
  ReserveStatut,
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
  lot?: string;
  reserveId?: string;
}

export interface UpdateTacheInput {
  titre?: string;
  description?: string | null;
  priorite?: TachePriorite;
  echeance?: string | null;
  statut?: TacheStatut;
  lot?: string | null;
  reserveId?: string | null;
}

export interface UpdateChantierInput {
  nom?: string;
  client?: string | null;
  adresse?: string | null;
  montant?: number | null;
  statut?: ChantierStatut;
  supabaseChantierId?: string | null;
}

interface AppContextValue {
  ready: boolean;
  data: AppData;
  chantiers: Chantier[];
  selectedId: string | null;
  selectedChantier: Chantier | null;
  taches: Tache[];
  tachesForSelected: Tache[];
  reservesForSelected: Reserve[];
  plansForSelected: Plan[];
  photosForSelected: Photo[];
  budgetForSelected: BudgetLigne[];
  comptesRendusForSelected: CompteRendu[];
  pointagesForSelected: Pointage[];
  reunionsForSelected: Reunion[];
  certificatsForSelected: Certificat[];
  selectChantier: (id: string) => void;
  createChantier: (nom: string, client?: string, adresse?: string) => void;
  updateChantier: (id: string, input: UpdateChantierInput) => void;
  deleteChantier: (id: string) => void;
  createTache: (input: CreateTacheInput) => string;
  createTachesBulk: (titres: string[]) => void;
  updateTache: (id: string, input: UpdateTacheInput) => void;
  updateTacheStatut: (id: string, statut: TacheStatut) => void;
  deleteTache: (id: string) => void;
  createReserve: (titre: string, lot?: string, description?: string) => string;
  updateReserve: (
    id: string,
    input: Partial<Pick<Reserve, "titre" | "description" | "lot" | "statut" | "tacheId">>,
  ) => void;
  deleteReserve: (id: string) => void;
  createPlan: (nom: string, pdfUrl: string, lot?: string) => void;
  updatePlan: (id: string, input: Partial<Pick<Plan, "nom" | "pdfUrl" | "lot">>) => void;
  deletePlan: (id: string) => void;
  createPhoto: (
    url: string,
    tags: string[],
    note?: string,
    tacheId?: string,
    reserveId?: string,
  ) => void;
  updatePhoto: (
    id: string,
    input: Partial<Pick<Photo, "url" | "tags" | "note" | "tacheId" | "reserveId">>,
  ) => void;
  deletePhoto: (id: string) => void;
  createBudgetLigne: (
    type: BudgetType,
    libelle: string,
    montant: number,
    date: string,
    lot?: string,
  ) => void;
  updateBudgetLigne: (
    id: string,
    input: Partial<Pick<BudgetLigne, "type" | "libelle" | "montant" | "date" | "lot">>,
  ) => void;
  deleteBudgetLigne: (id: string) => void;
  createCompteRendu: (titre: string, contenu: string, date: string) => void;
  updateCompteRendu: (
    id: string,
    input: Partial<Pick<CompteRendu, "titre" | "contenu" | "date">>,
  ) => void;
  deleteCompteRendu: (id: string) => void;
  createPointage: (ouvrier: string, date: string, heures: number, pauses: number) => void;
  updatePointage: (
    id: string,
    input: Partial<Pick<Pointage, "ouvrier" | "date" | "heures" | "pauses">>,
  ) => void;
  deletePointage: (id: string) => void;
  createReunion: (titre: string, date: string, participants: string[], contenu: string) => void;
  updateReunion: (
    id: string,
    input: Partial<Pick<Reunion, "titre" | "date" | "participants" | "contenu">>,
  ) => void;
  deleteReunion: (id: string) => void;
  createCertificat: (type: string, contenu: string, date: string) => void;
  updateCertificat: (
    id: string,
    input: Partial<Pick<Certificat, "type" | "contenu" | "date">>,
  ) => void;
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
      taches: stored.taches.map((t) => withRetardFlag({ ...t, description: t.description ?? null })),
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
    (nom: string, client?: string, adresse?: string) => {
      const chantier: Chantier = {
        id: crypto.randomUUID(),
        nom,
        client: client ?? null,
        adresse: adresse ?? null,
        montant: null,
        statut: "en_cours",
        supabaseChantierId: null,
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

  const updateChantier = useCallback(
    (id: string, input: UpdateChantierInput) => {
      persist((prev) => ({
        ...prev,
        chantiers: prev.chantiers.map((c) => (c.id === id ? { ...c, ...input } : c)),
      }));
    },
    [persist],
  );

  const deleteChantier = useCallback(
    (id: string) => persist((prev) => cascadeDeleteChantier(prev, id)),
    [persist],
  );

  const createTache = useCallback(
    (input: CreateTacheInput): string => {
      const id = crypto.randomUUID();
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const tache = withRetardFlag({
          id,
          chantierId,
          titre: input.titre,
          description: input.description ?? null,
          statut: input.statut ?? "a_faire",
          priorite: input.priorite ?? "normale",
          echeance: input.echeance ?? null,
          lot: input.lot ?? null,
          reserveId: input.reserveId ?? null,
          retard: false,
          createdAt: new Date().toISOString(),
        });
        let reserves = prev.reserves ?? [];
        if (input.reserveId) {
          reserves = reserves.map((r) =>
            r.id === input.reserveId ? { ...r, tacheId: id, statut: "en_cours" as ReserveStatut } : r,
          );
        }
        return { ...prev, taches: [tache, ...prev.taches], reserves };
      });
      return id;
    },
    [persist],
  );

  const createTachesBulk = useCallback(
    (titres: string[]) => {
      titres.forEach((titre) => createTache({ titre, priorite: "normale" }));
    },
    [createTache],
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
    (id: string) =>
      persist((prev) => ({
        ...prev,
        taches: prev.taches.filter((t) => t.id !== id),
        photos: prev.photos.map((p) => (p.tacheId === id ? { ...p, tacheId: null } : p)),
        reserves: (prev.reserves ?? []).map((r) => (r.tacheId === id ? { ...r, tacheId: null } : r)),
      })),
    [persist],
  );

  const createReserve = useCallback(
    (titre: string, lot?: string, description?: string): string => {
      const id = crypto.randomUUID();
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const reserve: Reserve = {
          id,
          chantierId,
          titre,
          description: description ?? null,
          lot: lot ?? null,
          statut: "ouverte",
          tacheId: null,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, reserves: [reserve, ...(prev.reserves ?? [])] };
      });
      return id;
    },
    [persist],
  );

  const updateReserve = useCallback(
    (
      id: string,
      input: Partial<Pick<Reserve, "titre" | "description" | "lot" | "statut" | "tacheId">>,
    ) => {
      persist((prev) => ({
        ...prev,
        reserves: (prev.reserves ?? []).map((r) => (r.id === id ? { ...r, ...input } : r)),
      }));
    },
    [persist],
  );

  const deleteReserve = useCallback(
    (id: string) =>
      persist((prev) => ({
        ...prev,
        reserves: (prev.reserves ?? []).filter((r) => r.id !== id),
        photos: prev.photos.map((p) => (p.reserveId === id ? { ...p, reserveId: null } : p)),
        taches: prev.taches.map((t) => (t.reserveId === id ? { ...t, reserveId: null } : t)),
      })),
    [persist],
  );

  const createPlan = useCallback(
    (nom: string, pdfUrl: string, lot?: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const plan: Plan = {
          id: crypto.randomUUID(),
          chantierId,
          nom,
          pdfUrl,
          lot: lot ?? null,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, plans: [plan, ...prev.plans] };
      });
    },
    [persist],
  );

  const updatePlan = useCallback(
    (id: string, input: Partial<Pick<Plan, "nom" | "pdfUrl" | "lot">>) => {
      persist((prev) => ({
        ...prev,
        plans: prev.plans.map((p) => (p.id === id ? { ...p, ...input } : p)),
      }));
    },
    [persist],
  );

  const deletePlan = useCallback(
    (id: string) => persist((prev) => ({ ...prev, plans: prev.plans.filter((p) => p.id !== id) })),
    [persist],
  );

  const createPhoto = useCallback(
    (url: string, tags: string[], note?: string, tacheId?: string, reserveId?: string) => {
      persist((prev) => {
        const chantierId = requireChantierId(prev);
        if (!chantierId) return prev;
        const photo: Photo = {
          id: crypto.randomUUID(),
          chantierId,
          url,
          tags,
          note: note ?? null,
          tacheId: tacheId ?? null,
          reserveId: reserveId ?? null,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, photos: [photo, ...prev.photos] };
      });
    },
    [persist],
  );

  const updatePhoto = useCallback(
    (
      id: string,
      input: Partial<Pick<Photo, "url" | "tags" | "note" | "tacheId" | "reserveId">>,
    ) => {
      persist((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === id ? { ...p, ...input } : p)),
      }));
    },
    [persist],
  );

  const deletePhoto = useCallback(
    (id: string) => persist((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== id) })),
    [persist],
  );

  const createBudgetLigne = useCallback(
    (type: BudgetType, libelle: string, montant: number, date: string, lot?: string) => {
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
          lot: lot ?? null,
        };
        return { ...prev, budgetLignes: [ligne, ...prev.budgetLignes] };
      });
    },
    [persist],
  );

  const updateBudgetLigne = useCallback(
    (
      id: string,
      input: Partial<Pick<BudgetLigne, "type" | "libelle" | "montant" | "date" | "lot">>,
    ) => {
      persist((prev) => ({
        ...prev,
        budgetLignes: prev.budgetLignes.map((b) => (b.id === id ? { ...b, ...input } : b)),
      }));
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

  const updateCompteRendu = useCallback(
    (id: string, input: Partial<Pick<CompteRendu, "titre" | "contenu" | "date">>) => {
      persist((prev) => ({
        ...prev,
        comptesRendus: prev.comptesRendus.map((c) => (c.id === id ? { ...c, ...input } : c)),
      }));
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
        const pt: Pointage = { id: crypto.randomUUID(), chantierId, ouvrier, date, heures, pauses };
        return { ...prev, pointages: [pt, ...prev.pointages] };
      });
    },
    [persist],
  );

  const updatePointage = useCallback(
    (id: string, input: Partial<Pick<Pointage, "ouvrier" | "date" | "heures" | "pauses">>) => {
      persist((prev) => ({
        ...prev,
        pointages: prev.pointages.map((p) => (p.id === id ? { ...p, ...input } : p)),
      }));
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

  const updateReunion = useCallback(
    (
      id: string,
      input: Partial<Pick<Reunion, "titre" | "date" | "participants" | "contenu">>,
    ) => {
      persist((prev) => ({
        ...prev,
        reunions: prev.reunions.map((r) => (r.id === id ? { ...r, ...input } : r)),
      }));
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

  const updateCertificat = useCallback(
    (id: string, input: Partial<Pick<Certificat, "type" | "contenu" | "date">>) => {
      persist((prev) => ({
        ...prev,
        certificats: prev.certificats.map((c) => (c.id === id ? { ...c, ...input } : c)),
      }));
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
      reservesForSelected: scopeByChantier(data.reserves ?? [], sid),
      plansForSelected: scopeByChantier(data.plans, sid),
      photosForSelected: scopeByChantier(data.photos, sid),
      budgetForSelected: scopeByChantier(data.budgetLignes, sid),
      comptesRendusForSelected: scopeByChantier(data.comptesRendus, sid),
      pointagesForSelected: scopeByChantier(data.pointages, sid),
      reunionsForSelected: scopeByChantier(data.reunions, sid),
      certificatsForSelected: scopeByChantier(data.certificats, sid),
      selectChantier,
      createChantier,
      updateChantier,
      deleteChantier,
      createTache,
      createTachesBulk,
      updateTache,
      updateTacheStatut,
      deleteTache,
      createReserve,
      updateReserve,
      deleteReserve,
      createPlan,
      updatePlan,
      deletePlan,
      createPhoto,
      updatePhoto,
      deletePhoto,
      createBudgetLigne,
      updateBudgetLigne,
      deleteBudgetLigne,
      createCompteRendu,
      updateCompteRendu,
      deleteCompteRendu,
      createPointage,
      updatePointage,
      deletePointage,
      createReunion,
      updateReunion,
      deleteReunion,
      createCertificat,
      updateCertificat,
      deleteCertificat,
    }),
    [
      ready,
      data,
      sid,
      selectedChantier,
      selectChantier,
      createChantier,
      updateChantier,
      deleteChantier,
      createTache,
      createTachesBulk,
      updateTache,
      updateTacheStatut,
      deleteTache,
      createReserve,
      updateReserve,
      deleteReserve,
      createPlan,
      updatePlan,
      deletePlan,
      createPhoto,
      updatePhoto,
      deletePhoto,
      createBudgetLigne,
      updateBudgetLigne,
      deleteBudgetLigne,
      createCompteRendu,
      updateCompteRendu,
      deleteCompteRendu,
      createPointage,
      updatePointage,
      deletePointage,
      createReunion,
      updateReunion,
      deleteReunion,
      createCertificat,
      updateCertificat,
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
