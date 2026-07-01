# Simply BTP — Modèle de données

## v1 — localStorage

Clé : `simply-btp-data`

```typescript
AppData {
  chantiers: Chantier[]
  taches: Tache[]
  plans: Plan[]
  photos: Photo[]
  budgetLignes: BudgetLigne[]
  comptesRendus: CompteRendu[]
  pointages: Pointage[]
  reunions: Reunion[]
  certificats: Certificat[]
  selectedId: string | null
}
```

## Entités

### Chantier
`id`, `nom`, `createdAt`

### Tache
`id`, `chantierId`, `titre`, `description?`, `statut`, `priorite`, `echeance?`, `createdAt`

Statuts : `a_faire` | `en_cours` | `termine`

### Plan
`id`, `chantierId`, `nom`, `url`, `createdAt`

### Photo
`id`, `chantierId`, `url`, `tags[]`, `note?`, `createdAt`

### BudgetLigne
`id`, `chantierId`, `libelle`, `montant`, `type`, `createdAt`

Types : `devis` | `facture` | `depense`

### CompteRendu
`id`, `chantierId`, `titre`, `date`, `contenu`, `createdAt`

### Pointage
`id`, `chantierId`, `ouvrier`, `date`, `heureArrivee`, `heureDepart`, `pauseMinutes`, `createdAt`

### Reunion
`id`, `chantierId`, `titre`, `date`, `participants`, `compteRendu`, `createdAt`

### Certificat
`id`, `chantierId`, `type`, `contenu`, `date`, `createdAt`

## Relations

Toutes les entités (sauf `chantiers`) ont `chantierId` FK logique.

## KPIs (`computeKpis`)

- `avancementPct` — tâches terminées / total
- `tachesEnRetard` — échéance passée + non terminé
- `budgetPrevu` — somme devis
- `budgetConsomme` — somme depense + facture
- `photosCount`
- `prochainesEcheances` — 5 prochaines tâches datées

## v2 — Supabase (prévu)

Tables : `chantiers`, `taches`, `plans`, `photos`, `budget_lignes`, etc.

Migrations : `supabase/migrations/001_initial_schema.sql`
Pont Operis : `supabase/migrations/future/operis_bridge.sql`

## Index prévus

- `chantier_id` sur toutes les tables enfants
- `statut`, `echeance` sur taches
- `created_at` pour tri chronologique
