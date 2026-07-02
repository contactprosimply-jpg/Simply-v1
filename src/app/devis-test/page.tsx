"use client";

import { useEffect, useState } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function DevisTestPage() {
  const [chantierId, setChantierId] = useState("");
  const [chantierNom, setChantierNom] = useState("cardinet — black swan");
  const [chantierClient, setChantierClient] = useState("pajol");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("chantier_id", chantierId.trim());

      const res = await fetch("/api/devis/analyser", { method: "POST", body: form });
      const json = (await res.json()) as { data?: unknown; error?: string; code?: string };

      if (!res.ok) {
        throw new Error(json.error ?? `Erreur ${res.status}`);
      }

      setResult(JSON.stringify(json.data, null, 2));
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
          POST /api/devis/analyser — parseur heuristique gratuit, prévisualisation JSON sans persistance.
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

      {result && (
        <pre className="max-h-[70vh] overflow-auto rounded-lg bg-surface p-4 text-xs text-brand">
          {result}
        </pre>
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
