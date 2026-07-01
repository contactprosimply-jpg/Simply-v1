# Simply BTP — Coding Guidelines

## Stack

- Next.js 16.2+ (App Router, Turbopack)
- React 19, TypeScript strict
- Tailwind CSS v4 (`@theme` dans `globals.css`)
- Lucide React (icônes)
- localStorage v1 → Supabase v2

## Structure projet

```
src/
  app/                 # Routes Next.js
  components/
    layout/            # AppShell, Sidebar, Topbar
    providers/         # ChantierProvider
    ui/                # Composants génériques
    {module}/          # Vues métier
  lib/
    types.ts           # Types + computeKpis + formatters
    storage.ts         # load/save localStorage
    taches.ts          # Helpers tâches
```

## Conventions nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composant | PascalCase | `BudgetView` |
| Hook | use + PascalCase | `useChantiers` |
| Type | PascalCase | `BudgetLigne` |
| Fichier composant | PascalCase.tsx | `TacheCard.tsx` |
| Fichier util | camelCase.ts | `storage.ts` |
| Route | kebab-case | `/comptes-rendus` |

## Règles code

1. Composant **< 300 lignes**
2. **Pas de duplication** — factoriser
3. `"use client"` seulement si nécessaire
4. Types dans `lib/types.ts`
5. Pas de `any`
6. Imports `@/` absolus

## Ajouter un module

1. Type dans `types.ts`
2. CRUD dans `ChantierProvider`
3. `src/app/(app)/{module}/page.tsx`
4. `src/components/{module}/{Module}View.tsx`
5. Entrée sidebar dans `Sidebar.tsx`

## Git

Messages : `feat:`, `fix:`, `refactor:`, `docs:`
Exemple : `feat: module Budget — lignes devis/facture/dépense`

## Cursor

- Rules : `.cursor/rules/01-simply.mdc` → `25-review.mdc`
- Prompts : `.cursor/prompts/create-feature.md` etc.

## Qualité

Avant PR : build `npm run build`, checklist `25-review.mdc`.
