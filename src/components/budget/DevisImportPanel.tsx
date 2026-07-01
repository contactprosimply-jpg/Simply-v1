"use client";

import { FileSpreadsheet, Link2, Loader2, Upload } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { DevisImportRow } from "@/lib/database.types";
import { formatDateFr } from "@/lib/types";
import { AlertBanner, BtnPrimary, BtnSecondary, Card } from "@/components/ui/PageShell";

export interface DevisImportPanelHandle {
  /** Lie au cloud si besoin, puis ouvre le sélecteur de fichier. */
  openImport: () => Promise<void>;
}

interface DevisImportPanelProps {
  chantierNom: string;
  chantierClient: string | null;
  chantierMontant: number | null;
  supabaseChantierId: string | null;
  onLinked: (supabaseChantierId: string) => void;
  /** Masque les boutons d'action (utiliser le bouton header). */
  hideActions?: boolean;
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
      hideActions = false,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cloudIdRef = useRef<string | null>(supabaseChantierId);
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [cloudId, setCloudId] = useState<string | null>(supabaseChantierId);
    const [imports, setImports] = useState<DevisImportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
      setCloudId(supabaseChantierId);
      cloudIdRef.current = supabaseChantierId;
    }, [supabaseChantierId]);

    useEffect(() => {
      fetch("/api/health/supabase")
        .then((r) => r.json())
        .then((json: { data?: { configured?: boolean } }) => setConfigured(json.data?.configured ?? false))
        .catch(() => setConfigured(false));
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

    const handleLink = useCallback(async (): Promise<string> => {
      setLinking(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch("/api/chantiers/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseChantierId: cloudId,
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
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erreur";
        setError(message);
        throw e;
      } finally {
        setLinking(false);
      }
    }, [chantierClient, chantierMontant, chantierNom, cloudId, onLinked]);

    const handleUpload = async (file: File | undefined) => {
      const activeCloudId = cloudIdRef.current;
      if (!file || !activeCloudId) return;
      setUploading(true);
      setError(null);
      setSuccess(null);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("chantierId", activeCloudId);
        const res = await fetch("/api/devis/import", { method: "POST", body: form });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload impossible");
        setSuccess(`« ${file.name} » importé.`);
        await loadImports(activeCloudId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };

    const openImport = useCallback(async () => {
      if (configured === false) {
        setError("Supabase non configuré sur le serveur.");
        return;
      }
      let id = cloudIdRef.current;
      if (!id) {
        id = await handleLink();
        cloudIdRef.current = id;
      }
      inputRef.current?.click();
    }, [configured, handleLink]);

    useImperativeHandle(ref, () => ({ openImport }), [openImport]);

    if (configured === null) {
      return (
        <Card className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Vérification Supabase…
        </Card>
      );
    }

    if (!configured) {
      return (
        <Card>
          <p className="text-sm font-medium text-brand">Import devis / DPGF (cloud)</p>
          <p className="mt-2 text-sm text-gray-500">
            Configurez les variables Supabase sur le serveur pour activer l&apos;upload cloud.
          </p>
        </Card>
      );
    }

    return (
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

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.pdf,.csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files?.[0])}
        />

        {cloudId ? (
          <>
            {!hideActions && (
              <div className="flex flex-wrap gap-2">
                <BtnPrimary
                  onClick={() => void openImport()}
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
              <ul className="divide-y divide-surface-dark rounded-xl border border-surface-dark">
                {imports.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-brand">{item.nom_fichier ?? "Sans nom"}</p>
                      <p className="text-xs text-gray-400">
                        {TYPE_LABELS[item.type_fichier ?? ""] ?? item.type_fichier ?? "—"} ·{" "}
                        {formatDateFr(item.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                      {STATUT_LABELS[item.statut] ?? item.statut}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Utilisez « Importer devis » en haut de page — la liaison cloud se fera automatiquement.
          </p>
        )}
      </Card>
    );
  },
);
