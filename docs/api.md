# Simply BTP — API (futur)

## État v1

**Pas d'API REST** — données en localStorage via `ChantierProvider`.

## v2 — Conventions prévues

### Base URL
```
/api/v1/
```

### Authentification
Header `Authorization: Bearer <token>` — vérifié serveur via `getUser()`.

### Format réponse

```json
// Succès
{ "data": { ... } }

// Erreur
{ "error": "Message lisible", "code": "NOT_FOUND" }
```

### Endpoints prévus

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/v1/chantiers` | Liste chantiers user |
| POST | `/api/v1/chantiers` | Créer chantier |
| GET | `/api/v1/chantiers/:id/taches` | Tâches du chantier |
| POST | `/api/v1/chantiers/:id/taches` | Créer tâche |
| PATCH | `/api/v1/taches/:id` | Modifier tâche |
| DELETE | `/api/v1/taches/:id` | Supprimer tâche |
| ... | `/budget`, `/photos`, etc. | Même pattern |

### Validation

Zod schemas dans `lib/validations/`.

### Dynamic

```typescript
export const dynamic = 'force-dynamic';
```

Sur toutes les routes authentifiées.

## Server Actions (alternative)

Préférer Server Actions pour mutations simples si pas besoin d'API publique.

## Operis bridge

Webhook ou sync job pour import/export projet ↔ chantier.

Voir `supabase/migrations/future/operis_bridge.sql`.
