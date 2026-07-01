# Prompt — Refactoring Simply

## Objectif

Refactoriser **{{SCOPE}}** pour maintenabilité, sans changer le comportement visible.

## Règles

1. **Tests manuels** : lister les parcours à vérifier après refactor
2. **Petits commits logiques** — un refactor = une intention
3. **Extraire** si > 300 lignes : hooks, sous-composants, `lib/`
4. **Ne pas** introduire Supabase ou auth dans un refactor UI
5. **Préserver** structure `AppData` localStorage

## Patterns Simply

- Logique → `useChantiers` ou hook dédié
- UI générique → `components/ui/`
- Utils purs → `lib/`

## Livrable

- Liste fichiers touchés
- Avant/après structure
- Confirmation : comportement identique

## Scope

{{SCOPE}}
