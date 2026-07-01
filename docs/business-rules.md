# Simply BTP — Règles métier

## Entité centrale : le Chantier

Toute donnée appartient à un chantier. Pas d'entité orpheline.

## Modules et règles

### Tâches
- 3 statuts : à faire → en cours → terminé
- Retard = `echeance < aujourd'hui` ET statut ≠ terminé
- Priorités : basse, normale, haute, urgente
- Le planning est une **vue** des tâches datées

### Budget
- `devis` = prévisionnel (budget prévu)
- `depense` + `facture` = consommé
- Marge = prévu − consommé
- Alerte si consommation > 90 %

### Photos
- Preuves contractuelles — horodatage `createdAt`
- Tags libres (réserve, avancement, livraison…)
- Liées au chantier, pas au projet Operis (v1)

### Plans
- Référence PDF par URL (v1)
- Futur : versioning, annotations, lien réserves

### Comptes rendus
- Un CR par entrée journalière ou hebdo
- Date + contenu structuré libre (v1)

### Pointage
- Heures par ouvrier par jour
- Pauses en minutes
- Total calculé : départ − arrivée − pause

### PV Réunions
- Participants (texte libre v1)
- Compte-rendu + date

### Certificats
- Types : réception partielle, totale, levée réserves
- Document formel — pas de suppression (v2 : soft delete)

## Vocabulaire BTP (FR)

| Terme | Définition Simply |
|-------|-------------------|
| Réserve | Défaut à corriger — tag photo ou tâche |
| OPR | Opérations préalables réception — futur module |
| DOE | Dossier ouvrages exécutés — futur GED |
| Lot | Corps d'état — tag ou filtre futur |
| PV | Procès-verbal — module Réunions |

## Relation Operis (futur)

- Operis crée le **projet/marché**
- Simply exécute le **chantier**
- Sync via `operis_bridge` — pas de duplication logique bureau

## Règles de validation

1. Chantier requis pour toute action (gate `ChantierGate`)
2. Montants > 0
3. Dates au format ISO
4. Titres non vides
