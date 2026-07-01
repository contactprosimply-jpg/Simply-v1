"use client";

import { FileSpreadsheet, Link2, ListChecks, Loader2, Sparkles, Upload } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { DevisImportRow } from "@/lib/database.types";
import type { DevisAnalyzeResult } from "@/lib/devis-parser/types";
import { formatCurrency, formatDateFr } from "@/lib/types";
import { AlertBanner, BtnPrimary, BtnSecondary, Card } from "@/components/ui/PageShell";

export interface DevisImportPanelHandle {
  /** Ouvre le sélecteur de fichier — doit être appelé synchronement au clic utilisateur. */
  pickFile: () => void;
}

interface DevisImportPanelProps {
  chantierNom: string;
  chantierClient: string | null;
  chantierMontant: number | null;
  supabaseChantierId: string | null;
  onLinked: (supabaseChantierId: string) => void;
  onBusyChange?: (busy: boolean) => void;
  hideActions?: boolean;
  onAnalyzed?: (result: DevisAnalyzeResult, nomFichier: string) => void;
}

const STATUT_LABELS: Record<string, string> = {
  importe: "Importé",
  valide: "Validé",
};

const TYPE_LABELS: Record<string, string> = {
  xlsx: "Excel",
  pdf: "PDF",
  csv: "CSV",
};

export const DevisImportPanel = forwardRef<DevisImportPanelHandle, DevisImportPanelProps>(
  function DevisImportPanel(
    {
      chantierNom,
      chantierClient,
      chantierMontant,
      supabaseChantierId,
      onLinked,
      onBusyChange,
      hideActions = false,
      onAnalyzed,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cloudIdRef = useRef<string | null>(supabaseChantierId);
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [missingEnv, setMissingEnv] = useState<string[]>([]);
    const [hasDefaultOwner, setHasDefaultOwner] = useState(true);
    const [cloudId, setCloudId] = useState<string | null>(supabaseChantierId);
    const [imports, setImports] = useState<DevisImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analyzeResult, setAnalyzeResult] = useState<DevisAnalyzeResult | null>(null);
    const didAutoAnalyze = useRef(false);

    const setBusy = useCallback(
      (busy: boolean) => {
        onBusyChange?.(busy);
      },
      [onBusyChange],
    );

    useEffect(() => {
      setCloudId(supabaseChantierId);
      cloudIdRef.current = supabaseChantierId;
    }, [supabaseChantierId]);

    useEffect(() => {
      fetch("/api/health/supabase")
        .then((r) => r.json())
        .then(
          (json: {
            data?: { configured?: boolean; missing?: string[]; hasDefaultOwner?: boolean };
          }) => {
            setConfigured(json.data?.configured ?? false);
            setMissingEnv(json.data?.missing ?? []);
            setHasDefaultOwner(json.data?.hasDefaultOwner ?? false);
          },
        )
        .catch(() => {
          setConfigured(false);
          setMissingEnv([]);
        });
    }, []);

    const loadImports = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/devis/import?chantierId=${encodeURIComponent(id)}`);
        const json = (await res.json()) as {
          data?: { imports?: DevisImportRow[] };
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Impossible de charger les imports");
        setImports(json.data?.imports ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      if (cloudId) void loadImports(cloudId);
      else setImports([]);
    }, [cloudId, loadImports]);

    const linkChantier = useCallback(async (): Promise<string> => {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/chantiers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseChantierId: cloudIdRef.current,
          nom: chantierNom,
          client: chantierClient,
          montant: chantierMontant,
        }),
      });
      const json = (await res.json()) as {
        data?: { supabaseChantierId?: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Liaison impossible");
      const id = json.data?.supabaseChantierId;
      if (!id) throw new Error("Réponse invalide");
      setCloudId(id);
      cloudIdRef.current = id;
      onLinked(id);
      setSuccess("Chantier lié à Supabase.");
      return id;
    }, [chantierClient, chantierMontant, chantierNom, onLinked]);

    const handleLink = useCallback(async () => {
      setLinking(true);
      setBusy(true);
      try {
        await linkChantier();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLinking(false);
        setBusy(false);
      }
    }, [linkChantier, setBusy]);

    const runAnalyze = useCallback(
      async (importId: string, nomFichier: string, force = false) => {
        setAnalyzingId(importId);
        setBusy(true);
        setError(null);
        try {
          const url = `/api/devis/import/${importId}/analyze${force ? "?force=true" : ""}`;
          const res = await fetch(url, { method: "POST" });
          const json = (await res.json()) as {
            data?: { analyze?: DevisAnalyzeResult };
            error?: string;
          };
          if (!res.ok) throw new Error(json.error ?? "Analyse impossible");
          const result = json.data?.analyze;
          if (!result) throw new Error("Réponse analyse invalide");
          setAnalyzeResult(result);
          setSuccess(
            `${result.postesCount} postes → ${result.tachesCount} tâches (1 par unité si applicable).`,
          );
          onAnalyzed?.(result, nomFichier);
          if (cloudIdRef.current) await loadImports(cloudIdRef.current);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erreur");
        } finally {
          setAnalyzingId(null);
          setBusy(false);
        }
      },
      [loadImports, onAnalyzed, setBusy],
    );

    useEffect(() => {
      if (didAutoAnalyze.current || imports.length === 0) return;
      const pending = imports.find((i) => i.statut === "importe");
      if (pending) {
        didAutoAnalyze.current = true;
        void runAnalyze(pending.id, pending.nom_fichier ?? "devis");
      }
    }, [imports, runAnalyze]);

    const handleFilePicked = async (file: File | undefined) => {
      if (!file) return;

      if (configured === false) {
        setError("Supabase non configuré sur le serveur (variables Vercel manquantes).");
        return;
      }

      setUploading(true);
      setBusy(true);
      setError(null);
      setSuccess(null);

      try {
        let activeCloudId = cloudIdRef.current;
        if (!activeCloudId) {
          activeCloudId = await linkChantier();
          cloudIdRef.current = activeCloudId;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("chantierId", activeCloudId);
        const res = await fetch("/api/devis/import", { method: "POST", body: form });
        const json = (await res.json()) as {
          error?: string;
          data?: { devisImport?: { id: string } };
        };
        if (!res.ok) throw new Error(json.error ?? "Upload impossible");
        setSuccess(`« ${file.name} » importé — analyse en cours…`);
        await loadImports(activeCloudId);
        const importId = json.data?.devisImport?.id;
        if (importId) await runAnalyze(importId, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setUploading(false);
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };

    const pickFile = useCallback(() => {
      if (configured === false) {
        setError("Supabase non configuré sur le serveur (variables Vercel manquantes).");
        return;
      }
      inputRef.current?.click();
    }, [configured]);

    useImperativeHandle(ref, () => ({ pickFile }), [pickFile]);

    const fileInput = (
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.pdf,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(e) => void handleFilePicked(e.target.files?.[0])}
      />
    );

    if (configured === null) {
      return (
        <>
          {fileInput}
          <Card className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification Supabase…
          </Card>
        </>
      );
    }

    if (!configured) {
      return (
        <>
          {fileInput}
          <Card className="space-y-3">
            <p className="text-sm font-medium text-brand">Import devis / DPGF (cloud)</p>
            <p className="text-sm text-gray-500">
              Ajoutez les variables sur Vercel puis redéployez le projet.
            </p>
            {missingEnv.length > 0 && (
              <ul className="list-inside list-disc text-sm text-red-700">
                {missingEnv.map((name) => (
                  <li key={name}>
                    <code className="text-xs">{name}</code>
                  </li>
                ))}
              </ul>
            )}
            {!hasDefaultOwner && (
              <p className="text-sm text-amber-800">
                Recommandé aussi : <code className="text-xs">SUPABASE_DEFAULT_OWNER_ID</code> (UUID
                utilisateur Supabase → Authentication → Users).
              </p>
            )}
            <a
              href="https://vercel.com/planning-nikodex/simply-v1/settings/environment-variables"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-orange-600 underline"
            >
              Ouvrir les variables Vercel →
            </a>
            {error && <AlertBanner variant="danger">{error}</AlertBanner>}
          </Card>
        </>
      );
    }

    return (
      <>
        {fileInput}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-brand">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                Import devis / DPGF
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Fichiers .xlsx, .pdf ou .csv — max 20 Mo. Stockage privé Supabase.
              </p>
            </div>
            {!hideActions && !cloudId && (
              <BtnPrimary onClick={() => void handleLink()} className="shrink-0" disabled={linking}>
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {linking ? "Liaison…" : "Lier au cloud"}
              </BtnPrimary>
            )}
          </div>

          {error && <AlertBanner variant="danger">{error}</AlertBanner>}
          {success && <AlertBanner variant="success">{success}</AlertBanner>}

          {cloudId ? (
            <>
              {!hideActions && (
                <div className="flex flex-wrap gap-2">
                  <BtnPrimary
                    onClick={pickFile}
                    disabled={uploading || linking}
                    className="min-h-11"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? "Envoi…" : "Importer un fichier"}
                  </BtnPrimary>
                  <BtnSecondary onClick={() => void loadImports(cloudId)} disabled={loading}>
                    Actualiser
                  </BtnSecondary>
                </div>
              )}

              {loading ? (
                <p className="text-sm text-gray-500">Chargement des imports…</p>
              ) : imports.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun devis importé pour ce chantier.</p>
              ) : (
                <>
                  {analyzeResult && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                            Prix final détecté
                          </p>
                          <p className="text-2xl font-bold text-brand">
                            {analyzeResult.prixFinal != null
                              ? formatCurrency(analyzeResult.prixFinal)
                              : "—"}
                          </p>
                          {analyzeResult.prixFinalLabel && (
                            <p className="text-xs text-gray-500">{analyzeResult.prixFinalLabel}</p>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-sm text-gray-600">
                          <ListChecks className="h-4 w-4" />
                          {analyzeResult.tachesCount} tâches
                        </p>
                      </div>
                      <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                        {analyzeResult.taches.slice(0, 30).map((t, i) => (
                          <li key={`${t.titre}-${i}`} className="rounded-lg bg-white/80 px-3 py-2">
                            <span className="font-medium text-brand">{t.titre}</span>
                            {(t.lot || t.quantite != null) && (
                              <span className="ml-2 text-xs text-gray-400">
                                {t.lot ? `${t.lot}` : ""}
                                {t.quantite != null && t.unite
                                  ? ` · ${t.quantite} ${t.unite}`
                                  : ""}
                              </span>
                            )}
                          </li>
                        ))}
                        {analyzeResult.taches.length > 30 && (
                          <li className="text-xs text-gray-400 px-3">
                            + {analyzeResult.taches.length - 30} autres tâches (voir onglet Tâches)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <ul className="divide-y divide-surface-dark rounded-xl border border-surface-dark">
                    {imports.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-brand truncate">
                            {item.nom_fichier ?? "Sans nom"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {TYPE_LABELS[item.type_fichier ?? ""] ?? item.type_fichier ?? "—"} ·{" "}
                            {formatDateFr(item.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(item.statut === "importe" || item.statut === "valide") && (
                            <BtnSecondary
                              disabled={analyzingId === item.id}
                              onClick={() =>
                                void runAnalyze(
                                  item.id,
                                  item.nom_fichier ?? "devis",
                                  item.statut === "valide",
                                )
                              }
                            >
                              {analyzingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              {item.statut === "valide" ? "Ré-analyser" : "Analyser"}
                            </BtnSecondary>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.statut === "valide"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {STATUT_LABELS[item.statut] ?? item.statut}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Cliquez « Importer devis » en haut — liaison cloud puis envoi du fichier.
            </p>
          )}
        </Card>
      </>
    );
  },
);
