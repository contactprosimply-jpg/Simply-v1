# Prompt — Décision architecture Simply

## Question

{{QUESTION}}

## Contexte stack

- Next.js 16 App Router, TypeScript, Tailwind v4
- v1 localStorage (`ChantierProvider`)
- v2 Supabase serveur + pont Operis

## Méthode

1. Reformuler le besoin
2. Lister 2–3 options avec **pour/contre**
3. Recommander 1 option alignée terrain-first
4. Impact fichiers / migration données
5. Risques et dette technique

## Principes

- Simplicité > élégance théorique
- Évolutif vers Supabase sans réécrire tout
- Pas de logique bureau dans Simply

## Agents à consulter mentalement

- Product Manager — utile ?
- UX — parcours court ?
- Database — relations simples ?
- Security — RLS ready ?
- CEO Advisor — scope creep ?
