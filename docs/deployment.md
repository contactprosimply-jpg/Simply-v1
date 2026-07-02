# Simply BTP — Déploiement

## Production actuelle

- **URL** : https://simply-v1-tvz7.vercel.app
- **Repo** : `contactprosimply-jpg/Simply-v1`
- **Branche** : `main` → auto-deploy Vercel

## Config

### vercel.json
```json
{
  "framework": "nextjs"
}
```

### next.config.ts
- Redirect `/login` → `/dashboard` (legacy Vite)

## Commandes

```bash
npm run dev      # Dev local Turbopack
npm run build    # Build production
npm run start    # Serveur production local
```

## Variables d'environnement

### v1 (actuel)
Aucune requise — app standalone localStorage.

### v2 (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # serveur uniquement
SUPABASE_DEFAULT_OWNER_ID=    # MVP sans auth
```

**Jamais** exposer service role côté client. Aucune clé IA requise (parseur heuristique).

## Déploiement manuel

```bash
git push origin main          # Auto Vercel
# ou
npx vercel --prod
```

## Checklist pré-deploy

- [ ] `npm run build` OK
- [ ] Pas de secrets dans le code
- [ ] Redirects OK (pas de boucle)
- [ ] Test responsive tablette

## Warning connu

Lockfile parent `C:\Users\Utilisateur\package-lock.json` — optionnel : `turbopack.root` dans `next.config.ts`.

## Monitoring (futur)

- Vercel Analytics
- Sentry erreurs client
- Supabase logs API
