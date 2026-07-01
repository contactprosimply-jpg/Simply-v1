# Prompt — Créer une fonctionnalité Simply

Tu travailles sur **Simply BTP**, app terrain tablette pour le BTP.

## Contexte à lire

- `.cursor/rules/01-simply.mdc` à `25-review.mdc`
- `docs/vision.md`, `docs/business-rules.md`
- Code existant dans `src/components/` et `src/lib/`

## Workflow obligatoire

### 1. Product Manager
Réponds avant de coder :
- **Pourquoi** cette feature ?
- **Pour qui** sur le chantier ?
- **Gain de temps** estimé ?
- Feature existante similaire ?

Si valeur faible → propose alternative ou repousse.

### 2. UX
- Parcours en < 3 clics
- Mobile/tablette first
- Boutons larges, texte lisible

### 3. Architecture
- Réutiliser `ChantierProvider`, `PageShell`, composants UI
- Nouveau module = `page.tsx` + `{Module}View.tsx`
- Types dans `lib/types.ts`

### 4. Implémentation
- TypeScript strict
- Composant < 300 lignes
- Pas de duplication

### 5. Review
Applique la checklist `25-review.mdc`.

## Format de réponse

1. Résumé produit (3 lignes)
2. Parcours UX
3. Fichiers modifiés/créés
4. Code
5. Comment tester sur tablette

## Feature demandée

{{FEATURE}}
