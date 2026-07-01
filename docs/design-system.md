# Simply BTP — Design System

## Identité

- **Nom** : Simply BTP
- **Position** : Premium terrain, sobre, professionnel BTP
- **Inspirations** : Linear, Notion, Procore, Stripe Dashboard

## Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `brand` | `#021246` | Titres, sidebar, texte principal |
| `brand-light` | `#0a2a6e` | Hover sidebar |
| `accent-blue` | `#3b7fe8` | Liens, CTA secondaires |
| `accent-cyan` | `#1ecbe1` | Accents KPI, highlights |
| `surface` | `#f4f7fc` | Fond cartes internes |
| `surface-dark` | `#e8eef8` | Bordures |

## Typographie

- Font : Segoe UI, system-ui
- Titre page : `text-2xl font-bold text-brand sm:text-3xl`
- Sous-titre : `text-sm text-gray-500`
- Corps : `text-sm`
- Labels : `text-xs font-medium uppercase tracking-wide`

## Espacement

- Section : `space-y-6`
- Carte : `p-5`
- Grille : `gap-4`
- Touch target : `min-h-11`

## Composants

### Carte standard
```tsx
className="rounded-2xl border border-surface-dark bg-white p-5 shadow-sm"
```

### Bouton primaire
```tsx
className="flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-white"
```

### Bouton secondaire
```tsx
className="flex min-h-11 items-center justify-center rounded-xl border border-surface-dark bg-white px-4 text-sm font-medium text-brand"
```

## Icônes

Lucide React, taille standard `h-5 w-5`.

## Animation

`animate-fade-in` — 0.35s ease-out sur entrées de page.

## Layout

- **Sidebar** : fond brand, liens blancs, drawer mobile
- **Topbar** : sélecteur chantier + menu hamburger
- **Content** : fond blanc/gris clair, max-width fluide

## Responsive breakpoints

- Mobile : < 640px — onglets, drawer
- Tablette : 640–1024px — **cible principale**
- Desktop : > 1024px — kanban, grilles 4 col

## États

| État | Pattern |
|------|---------|
| Vide | Message + CTA |
| Chargement | `LoadingSpinner` / skeleton |
| Erreur | Message rouge + action retry |
| Succès | Feedback discret, pas de toast spam |
