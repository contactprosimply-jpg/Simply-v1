# Simply BTP — UX Guidelines

## Règle d'or

**Action principale en moins de 3 clics**, depuis n'importe quel écran.

## Contexte utilisateur

- Tablette 10" sur échafaudage
- Gants possible
- Luminosité forte (soleil)
- Connexion 4G instable
- Peu de temps entre deux contrôles

## Parcours types

### Documenter la journée
1. Ouvrir app (chantier déjà sélectionné)
2. Comptes rendus → Nouveau
3. Remplir + enregistrer

### Prendre une photo réserve
1. Photos → Ajouter
2. URL/capture + tag « réserve »
3. Enregistrer

### Voir les retards
1. Dashboard → KPI « Tâches en retard »
2. Clic → Tâches filtrées

## Principes

| Faire | Éviter |
|-------|--------|
| Gros boutons (44px+) | Petits liens texte |
| Info critique en haut | Scroll pour l'essentiel |
| 1 CTA principal | 5 boutons égaux |
| Labels courts | Paragraphes d'aide |
| Feedback immédiat | Attente sans indicateur |

## Formulaires

- Max 8 champs visibles
- Champs optionnels en accordéon ou étape 2
- Clavier adapté (numeric pour montants)
- Validation inline, pas modal d'erreur

## Navigation

- Sidebar : 10 modules max
- Toujours visible : chantier actif (topbar)
- Retour arrière : historique navigateur OK

## Accessibilité terrain

- Contraste WCAG AA minimum
- Pas de hover-only (touch)
- Zones tactiles espacées (pas de boutons collés)

## Tests UX

Avant validation feature :
1. Parcours complet au pouce sur tablette
2. Compter les clics
3. Tester état vide et erreur réseau
