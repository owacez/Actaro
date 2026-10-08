# 001 — Mobile stack and feature boundaries

Date: 2026-10-08

## Decision

Initialize in the existing Actaro folder with the official Expo default template.
Preserve its generated `src/app/` structure and dependencies. Use React Native,
strict TypeScript, and Expo Router. Display name: `Actaro`; slug: `actaro`.
Do not invent production identifiers.

Routes handle navigation and composition. Add feature folders only when
implementing approved features, separating UI, business logic, and data access.
Share components when reuse is justified.

Supabase is approved for later PostgreSQL, Auth, RLS, and Storage integration.
No backend connection or schema belongs to this initialization. React state is
the default; TanStack Query and Zustand require real needs. Native development
builds will be configured when authorized and required; none are verified yet.

## Context and consequences

Only the canonical docs existed at assessment. The default generator selected
SDK 57 / React Native 0.86. Its example screens, theme, and assets remain starter
content, not Figma implementation. Avoid speculative services or infrastructure.

Use the supplied `docs/ACTARO_DECELOPMENT_PLAN.md` despite its filename mismatch.
Preserve the canonical content. Explicit setup-only user instructions narrow
the broader Phase 0 work order in the docs. Stop for review before feature work.
Figma tools are available; initialization needs no Figma calls or changes.
