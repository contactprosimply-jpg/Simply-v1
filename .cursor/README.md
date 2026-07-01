# Simply BTP — Kit IA v1.0

Framework Cursor pour développer Simply de façon cohérente sur le long terme.

## Structure

```
.cursor/
├── rules/          # 25 règles numérotées (agents virtuels)
└── prompts/        # 6 workflows IA réutilisables

docs/               # Documentation produit & technique
```

## Règles (`.cursor/rules/`)

| # | Fichier | Agent | Scope |
|---|---------|-------|-------|
| 01 | `01-simply.mdc` | Fondateur | Toujours actif |
| 02 | `02-product-manager.mdc` | Product Manager | Toujours actif |
| 03 | `03-ux.mdc` | UX Expert | Toujours actif |
| 04 | `04-ui.mdc` | UI Designer | `*.tsx`, `*.css` |
| 05 | `05-design-system.mdc` | Design System | `*.tsx`, `*.css` |
| 06 | `06-react.mdc` | React Architect | `*.tsx` |
| 07 | `07-typescript.mdc` | TypeScript | `*.{ts,tsx}` |
| 08 | `08-nextjs.mdc` | Next.js | `src/app/**` |
| 09 | `09-tailwind.mdc` | Tailwind v4 | `*.tsx`, `*.css` |
| 10 | `10-shadcn.mdc` | shadcn/ui | `components/ui/**` |
| 11 | `11-architecture.mdc` | Architecte | Toujours actif |
| 12 | `12-database.mdc` | Database | `lib/**`, `supabase/**` |
| 13 | `13-supabase.mdc` | Supabase | API, supabase |
| 14 | `14-auth.mdc` | Auth | auth, API |
| 15 | `15-api.mdc` | API | `src/app/api/**` |
| 16 | `16-performance.mdc` | Performance | À la demande |
| 17 | `17-security.mdc` | Security | API, supabase |
| 18 | `18-testing.mdc` | QA | `*.test.ts` |
| 19 | `19-btp-business.mdc` | Expert BTP | Toujours actif |
| 20 | `20-plans.mdc` | Plans | `**/plans/**` |
| 21 | `21-budget.mdc` | Budget | `**/budget/**` |
| 22 | `22-planning.mdc` | Planning | `**/planning/**` |
| 23 | `23-report.mdc` | Rapports | CR, réunions, certificats |
| 24 | `24-ai.mdc` | IA | `**/ai/**` |
| 25 | `25-review.mdc` | CEO / Review | À la demande |

## Prompts (`.cursor/prompts/`)

| Fichier | Usage |
|---------|-------|
| `create-feature.md` | Nouvelle fonctionnalité |
| `improve-feature.md` | Améliorer l'existant |
| `refactor.md` | Refactoring ciblé |
| `bug-fix.md` | Correction de bug |
| `review.md` | Revue de code |
| `architecture.md` | Décision architecture |

**Utilisation** : copier le prompt dans le chat, remplacer `{{FEATURE}}` etc.

## Documentation (`docs/`)

| Fichier | Contenu |
|---------|---------|
| `vision.md` | Mission, personas, north star |
| `roadmap.md` | v1.0 → v2.1 |
| `database.md` | Modèle données localStorage + Supabase |
| `design-system.md` | Couleurs, typo, composants |
| `ux-guidelines.md` | 3 clics, terrain, parcours |
| `business-rules.md` | Règles métier BTP par module |
| `coding-guidelines.md` | Conventions code |
| `api.md` | API future v2 |
| `deployment.md` | Vercel, env, checklist |

## Exemple d'utilisation

```
@create-feature.md

Feature : Ajouter une gestion documentaire par chantier
```

Cursor charge automatiquement les règles pertinentes + tu guides avec le prompt.

## Évolution

Ce kit est **v1.0 évolutif**. Enrichir les docs et rules au fil du développement :
- Nouveau module → enrichir `business-rules.md` + rule dédiée si besoin
- Supabase activé → mettre à jour `database.md` + `13-supabase.mdc`
- Pont Operis → `roadmap.md` + migration bridge

## Version

- **Kit** : v1.0
- **Simply app** : v1.0 (localStorage, 10 modules)
- **Date** : juillet 2026
