# Prompt — Bug fix Simply

## Bug rapporté

{{BUG_DESCRIPTION}}

## Méthode

1. **Reproduire** — étapes exactes, navigateur, chantier test
2. **Localiser** — fichier/ligne, pas de fix au hasard
3. **Cause racine** — pas de patch symptôme
4. **Fix minimal** — plus petit diff correct
5. **Vérifier** — module concerné + dashboard KPIs si données liées

## Zones fréquentes

- `ChantierProvider` — sync localStorage
- `computeKpis` — calculs incorrects
- Filtre `chantierId` oublié
- Hydration client/server mismatch

## Format réponse

- Cause
- Fix
- Fichiers modifiés
- Test de non-régression
