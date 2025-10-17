# Transaction Calendar – Agent Guide

This guide aligns with the project constitution at `.specify/memory/constitution.md`.

## Project Purpose
- Provide a calendar-centric dashboard for importing, visualising, and managing financial transactions with real-time insights and CSV uploads.

## Tech Stack Snapshot
- **Frontend:** React 18 + TypeScript (Vite), Tailwind CSS, Radix UI, Wouter routing, TanStack React Query, Recharts for visualisation.
- **Backend:** Node.js 20 with Express, TypeScript, Drizzle ORM, PostgreSQL (Neon), session storage via `express-session`/`connect-pg-simple`.
- **Shared & Tooling:** Vite + esbuild builds, tsx dev runner, Drizzle Kit for schema pushes, Vitest + Testing Library + jsdom for tests, git-cliff for changelog automation, Husky hooks.

## Recommended Agent Responsibilities
- Extend or refactor React components/pages, Tailwind styling, and shared UI primitives.
- Update Express routes, services, and Drizzle schema/queries to support new features.
- Create or adjust Vitest/Testing Library tests and shared utilities to keep coverage in step with behaviour changes.
- Maintain build/test/CI scripts, Drizzle configs, and deployment settings when required.
- Perform scoped dependency upgrades and document noteworthy changes (e.g. via changelog).

## Safety & Quality Guardrails
- Run `npm test`, `npm run check`, and `npm run build` locally before proposing changes; never merge failing builds.
- Follow existing TypeScript/Tailwind conventions; prefer incremental, composable updates over sweeping rewrites.
- Add or update unit/integration tests whenever behaviour or contracts change.
- Keep secrets, credentials, and production data out of commits; avoid bulk deletions or schema drops without review.
- Use small, atomic commits and open PRs for peer review; document context in commit/PR messages.

## Autonomy & When to Escalate
- Proceed autonomously on low/medium-risk items (UI tweaks, isolated bug fixes, incremental tests, config nits).
- Pause and request human guidance for ambiguous requirements, large UX/product shifts, cross-cutting refactors, data model or auth changes, and any production-impacting configuration.

## Contributor Workflow Cheatsheet
- **Setup:** `npm install`; copy env (`cp .env.example .env`) and fill credentials; run `npm run db:push` if schema changes are required.
- **Develop:** `npm run dev` for full-stack dev server.
- **Quality:** `npm test` for the suite, `npm run test:watch` while iterating, `npm run check` for types, `npm run build` to mirror CI build.
- **CI Verification:** Ensure the above commands pass; preview changelog updates with `npm run changelog:preview` when relevant; confirm Vercel deployment settings via `DEPLOYMENT.md` if making release changes.
