"use client";

import { useState } from "react";

export default function DevisTestPage() {
  const [chantierId, setChantierId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !chantierId.trim()) return;

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
          POST /api/devis/analyser — prévisualisation JSON, sans persistance postes/tâches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-surface-dark bg-white p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">chantier_id (UUID Supabase)</span>
          <input
            type="text"
            value={chantierId}
            onChange={(e) => setChantierId(e.target.value)}
            className="w-full rounded-lg border border-surface-dark px-3 py-2 text-sm"
            placeholder="uuid du chantier"
            required
          />
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
          disabled={loading || !file}
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
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{`$uri = "http://localhost:3000/api/devis/analyser"
$form = @{
  chantier_id = "VOTRE_CHANTIER_UUID"
  file = Get-Item -Path "C:\\chemin\\devis.xlsx"
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form`}</pre>
      </section>
    </main>
  );
}
