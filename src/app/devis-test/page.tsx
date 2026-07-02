"use client";

import { useEffect, useState } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AnalysePoste {
  numero_position: string | null;
  designation: string;
  quantite: number | null;
  unite: string | null;
  prix_total: number | null;
  type_ligne: string;
}

interface AnalyseResume {
  posteCount: number;
  totalTtc: number | null;
  pdfSansRep: boolean;
  postes: AnalysePoste[];
  remarques: string[];
}

function buildResume(data: unknown): AnalyseResume | null {
  if (!data || typeof data !== "object") return null;
  const d = data as {
    document?: { total_ttc?: number | null; remarques?: string[] };
    postes?: AnalysePoste[];
  };
  const postes = (d.postes ?? []).filter((p) => p.type_ligne === "poste");
  const remarques = d.document?.remarques ?? [];
  return {
    posteCount: postes.length,
    totalTtc: d.document?.total_ttc ?? null,
    pdfSansRep: remarques.some((r) => r.includes("Position 1, 2, 3") || r.includes("REP")),
    postes: postes.slice(0, 8),
    remarques,
  };
}

export default function DevisTestPage() {
  const [chantierId, setChantierId] = useState("");
  const [chantierNom, setChantierNom] = useState("cardinet — black swan");
  const [chantierClient, setChantierClient] = useState("pajol");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resume, setResume] = useState<AnalyseResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(true);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/health/supabase")
      .then((r) => r.json())
      .then((json: { data?: { configured?: boolean; missing?: string[] } }) => {
        setSupabaseOk(json.data?.configured ?? false);
        setMissingEnv(json.data?.missing ?? []);
      })
      .catch(() => {
        setSupabaseOk(false);
      });
  }, []);

  async function handleCreateChantier() {
    if (!chantierNom.trim()) return;
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/chantiers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: chantierNom.trim(),
          client: chantierClient.trim() || null,
        }),
      });
      const json = (await res.json()) as {
        data?: { supabaseChantierId?: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Création impossible");

      const id = json.data?.supabaseChantierId;
      if (!id) throw new Error("UUID non retourné");

      setChantierId(id);
      setSuccess(`Chantier créé / lié dans Supabase : ${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !chantierId.trim()) return;

    if (!UUID_RE.test(chantierId.trim())) {
      setError(
        "chantier_id invalide. Cliquez « Créer le chantier dans Supabase » ci-dessous, ou collez un UUID depuis Supabase.",
      );
      return;
    }

    if (supabaseOk === false) {
      setError("Supabase non configuré sur ce déploiement — voir l'encadré orange ci-dessus.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    setResume(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("chantier_id", chantierId.trim());
      if (showDiagnostic) form.append("debug", "1");

      const res = await fetch("/api/devis/analyser", { method: "POST", body: form });
      const json = (await res.json()) as { data?: unknown; error?: string; code?: string };

      if (!res.ok) {
        throw new Error(json.error ?? `Erreur ${res.status}`);
      }

      setResult(JSON.stringify(json.data, null, 2));
      setResume(buildResume(json.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Test analyse devis (jetable)</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Import PDF : montants et quantités. Résumé lisible ci-dessous (le détail technique est en JSON).
        </p>
      </div>

      {supabaseOk === false && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Supabase non configuré sur ce déploiement Vercel</p>
          <p className="mt-2">
            Utilisez{" "}
            <a href="https://simply-v1-tvz7.vercel.app/devis-test" className="font-medium underline">
              simply-v1-tvz7.vercel.app/devis-test
            </a>{" "}
            (variables Supabase déjà en place).
          </p>
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-surface-dark bg-white p-4">
        <h2 className="text-sm font-semibold text-brand">1. Chantier Supabase</h2>
        <p className="text-xs text-ink-muted">
          Le chantier de l&apos;app (localStorage) n&apos;est pas dans Supabase tant qu&apos;il n&apos;est pas
          synchronisé. « pajol » est le client, pas l&apos;UUID.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Nom du chantier</span>
            <input
              type="text"
              value={chantierNom}
              onChange={(e) => setChantierNom(e.target.value)}
              className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Client</span>
            <input
              type="text"
              value={chantierClient}
              onChange={(e) => setChantierClient(e.target.value)}
              className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={syncing || supabaseOk === false}
          onClick={() => void handleCreateChantier()}
          className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand disabled:opacity-50"
        >
          {syncing ? "Création…" : "Créer le chantier dans Supabase"}
        </button>
        <label className="block space-y-1">
          <span className="text-xs font-medium">chantier_id (UUID — rempli automatiquement)</span>
          <input
            type="text"
            value={chantierId}
            onChange={(e) => setChantierId(e.target.value)}
            className="w-full rounded-lg border border-surface-dark px-3 py-2 font-mono text-sm"
            placeholder="UUID après création ou depuis Supabase"
          />
        </label>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-dark bg-white p-4">
        <h2 className="text-sm font-semibold text-brand">2. Analyser le devis</h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Fichier (.xlsx, .csv, .pdf)</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDiagnostic}
            onChange={(e) => setShowDiagnostic(e.target.checked)}
          />
          Diagnostic extraction PDF (REP détecté dans le texte ?)
        </label>
        <button
          type="submit"
          disabled={loading || !file || !chantierId.trim() || supabaseOk === false}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Analyse en cours…" : "Analyser"}
        </button>
      </form>

      {success && (
        <pre className="overflow-auto rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</pre>
      )}

      {error && (
        <pre className="overflow-auto rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</pre>
      )}

      {resume && (
        <section className="space-y-3 rounded-xl border border-brand/20 bg-white p-4">
          <h2 className="text-sm font-semibold text-brand">Résultat (lisible)</h2>
          <p className="text-sm">
            <strong>{resume.posteCount}</strong> postes détectés
            {resume.totalTtc != null && (
              <>
                {" "}
                · Total TTC{" "}
                <strong>{resume.totalTtc.toLocaleString("fr-FR")} €</strong>
              </>
            )}
          </p>
          {resume.pdfSansRep && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Les noms <strong>REP N°04</strong> etc. ne sont pas lisibles dans ce PDF (dessins).
              Les postes sont numérotés <strong>Position 1, 2, 3…</strong> avec les bons montants.
              Tu peux renommer les tâches plus tard dans l&apos;onglet <strong>Tâches</strong>.
            </p>
          )}
          <ul className="space-y-1 text-sm">
            {resume.postes.map((p) => (
              <li key={p.numero_position ?? p.designation} className="border-b border-surface py-1">
                <span className="font-medium">{p.designation}</span>
                {p.quantite != null && p.unite && (
                  <span className="text-ink-muted"> · {p.quantite} {p.unite}</span>
                )}
              </li>
            ))}
            {resume.posteCount > 8 && (
              <li className="text-xs text-ink-muted">… et {resume.posteCount - 8} autres postes</li>
            )}
          </ul>
          <p className="text-xs text-ink-muted">
            Pour utiliser sur un chantier : importe le même PDF dans <a href="/budget" className="underline">Budget</a> puis
            clique Analyser.
          </p>
        </section>
      )}

      {result && (
        <details className="rounded-lg border border-surface-dark bg-surface">
          <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-ink-muted">
            Détail technique (JSON)
          </summary>
          <pre className="max-h-[50vh] overflow-auto p-4 text-xs text-brand">{result}</pre>
        </details>
      )}

      <section className="rounded-xl border border-dashed border-surface-dark p-4 text-sm text-ink-muted">
        <h2 className="font-semibold text-brand">SQL Supabase (alternative)</h2>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{`-- Lister tous les chantiers
SELECT id, nom, client, created_at FROM chantiers ORDER BY created_at DESC;

-- Créer manuellement
INSERT INTO chantiers (nom, client, statut, owner_id)
VALUES ('cardinet — black swan', 'pajol', 'en_cours', 'VOTRE_OWNER_UUID')
RETURNING id, nom;`}</pre>
      </section>
    </main>
  );
}
