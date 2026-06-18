export function ConfigErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-navy">Configuration manquante</h1>
        <p className="mt-3 text-sm text-gray-600">
          Les variables Supabase ne sont pas définies sur Vercel. Ajoutez-les puis redéployez :
        </p>
        <ul className="mt-4 space-y-2 rounded-xl bg-surface p-4 font-mono text-xs text-navy">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          Vercel → Settings → Environment Variables → cochez Production, Preview et Development → Redeploy.
        </p>
      </div>
    </div>
  )
}
