"use client";

import { useEffect, useState } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function DevisTestPage() {
  const [chantierId, setChantierId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !chantierId.trim()) return;

    if (!UUID_RE.test(chantierId.trim())) {
      setError(
        "chantier_id doit être un UUID Supabase (ex. a1b2c3d4-…), pas un nom de chantier. Récupérez-le dans Supabase → table chantiers.",
      );
      return;
    }

    if (supabaseOk === false) {
      setError("Supabase non configuré sur ce déploiement — voir l'encadré orange ci-dessus.");
      return;
    }

    setLoading(true);
    setError(null);
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
            Variables manquantes :{" "}
            <code className="rounded bg-white px-1">
              {missingEnv.length > 0 ? missingEnv.join(", ") : "NEXT_PUBLIC_SUPABASE_URL, …"}
            </code>
          </p>
          <p className="mt-2">
            Copiez les variables depuis le projet{" "}
            <strong>simply-v1-tvz7</strong> vers <strong>simply-v1</strong> dans{" "}
            <a
              href="https://vercel.com/planning-nikodex/simply-v1/settings/environment-variables"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Vercel → Settings → Environment Variables
            </a>
            , puis redéployez.
          </p>
          <p className="mt-2">
            En attendant :{" "}
            <a href="https://simply-v1-tvz7.vercel.app/devis-test" className="font-medium underline">
              simply-v1-tvz7.vercel.app/devis-test
            </a>{" "}
            (Supabase déjà configuré).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-dark bg-white p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">chantier_id (UUID Supabase)</span>
          <input
            type="text"
            value={chantierId}
            onChange={(e) => setChantierId(e.target.value)}
            className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm"
            placeholder="ex. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            required
          />
          <span className="text-xs text-ink-muted">
            Pas le nom du chantier — l&apos;UUID de la ligne dans Supabase (table chantiers).
          </span>
        </label>
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
          disabled={loading || !file || supabaseOk === false}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Analyse en cours…" : "Analyser"}
        </button>
      </form>

      {error && (
        <pre className="overflow-auto rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</pre>
      )}

      {result && (
        <pre className="max-h-[70vh] overflow-auto rounded-lg bg-surface p-4 text-xs text-brand">
          {result}
        </pre>
      )}

      <section className="rounded-xl border border-dashed border-surface-dark p-4 text-sm text-ink-muted">
        <h2 className="font-semibold text-brand">Exemple PowerShell</h2>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{`$uri = "https://simply-v1-tvz7.vercel.app/api/devis/analyser"
$form = @{
  chantier_id = "VOTRE_CHANTIER_UUID"
  file = Get-Item -Path "C:\\chemin\\devis.xlsx"
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form | ConvertTo-Json -Depth 10`}</pre>
      </section>
    </main>
  );
}
