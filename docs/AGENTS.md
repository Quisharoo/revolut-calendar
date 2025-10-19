# Transaction Calendar - Agent Guide

## Purpose
Calendar-first web app for importing, visualising, and exporting financial transactions.  
Core flow: CSV upload → recurrence detection → calendar view → ICS export.

Target: desktop browsers  
Max CSV size: 50k rows per file  
Timezone: Europe/Dublin

---

## Directory Structure
.
├── api/                      # Serverless entry for deployment  
│   └── index.ts
├── client/                   # React 18 + Vite frontend  
│   ├── src/
│   │   ├── components/       # Reusable UI primitives
│   │   ├── pages/            # Route-level components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Core logic (parser, recurrence, export)
│   │   ├── workers/          # Heavy compute off main thread
│   │   ├── normalization/    # Payee / amount cleanup
│   │   ├── styles/           # Tailwind / global CSS
│   │   ├── types/            # UI-only types
│   │   ├── main.tsx          # App entry
│   │   └── router.tsx        # Wouter route definitions
│   └── index.html
├── server/                   # Express app for local/full-stack
│   ├── createApp.ts          # Shared bootstrap
│   ├── index.ts              # Calls createApp
│   ├── routes/               # Route modules
│   └── middleware/           # Express middleware
├── shared/                   # Shared code across client/server
│   ├── schema.ts             # Zod schemas and derived types
│   ├── constants.ts
│   ├── version.ts
│   └── utils.ts
├── tests/                    # Integration and golden-file tests
│   ├── csv/
│   ├── recurrence/
│   ├── ics/
│   └── e2e/                  # Playwright smoke tests
├── docs/
│   ├── AGENTS.md
│   ├── DEPLOYMENT.md
│   ├── RECURRENCE-SPEC.md
│   └── ICS-EXAMPLES/
├── scripts/
│   ├── build.ts
│   ├── changelog.ts
│   └── metrics.ts
├── public/
│   └── favicon.svg
├── vitest.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md

### Guidelines
- Business logic in `client/src/lib/` or `shared/`. Never inline heavy logic in components.
- Heavy compute (parse, recurrence, export) runs in `client/src/workers/`.
- Server and API import only from `shared/`, never from `client/`.

---

## Architecture Rules
- Validate all boundary inputs with Zod (`shared/schema.ts`).
- UI owns orchestration and state only. Pure logic lives in `lib/` or workers.
- Single server entry via `createApp`. Serverless handler reuses it.
- Provenance uses one canonical `source` object. `broker` is an alias only.
- No cross-layer imports except into `shared/`.

---

## Contracts and Schemas
- Zod schemas for `Transaction`, `RecurringSeries`, `IcsEvent`.
- Types derive from schemas. No handwritten boundary interfaces.
- Version contracts in `shared/version.ts`. Migrations accompany breaking changes.
- CSV header map supports localized labels and synonyms.

---

## ICS Export Policy
- RFC 5545 compliant.
- Required fields: `UID`, `DTSTAMP`, and consistent timezone (`TZID` or UTC).
- Monthly recurrences prefer `RRULE:FREQ=MONTHLY;BYMONTHDAY=n`.
- Fold lines at 75 chars. Escape commas, semicolons, newlines.
- Centralize escaping/folding in `escapeIcsText`.
- Export for selected month only: exactly one VEVENT per recurring series.
- Golden examples live in `docs/ICS-EXAMPLES/`. Tests must pass.

---

## Recurrence Detection Policy
- Group key = normalized payee + amount sign + tolerance band.
  - 0–50 → ±0.50
  - 50–500 → ±1%
  - 500+ → ±0.5%
- Minimum 3 occurrences and 90-day span.
- Allow weekday drift for month-end utilities.
- Each `RecurringSeries` includes `explanation` (dates, gaps, amount deltas).
- Specs and fixtures in `docs/RECURRENCE-SPEC.md`.

---

## Performance Budget
- Parse 50k rows < 2 s on M-series laptop.
- Main thread blocked < 16 ms/frame.
- Month render < 200 ms with 2k items.
- Parser, recurrence, ICS in workers.

---

## Security Hygiene
- No secrets in client bundles.
- CSV-only allowlist. Enforce file size and max line length.
- Escape and normalize all rendered text.

---

## CI & Quality Gates
- `pnpm test --coverage` with ≥80% line coverage for CSV, recurrence, ICS.
- `pnpm typecheck` must pass.
- `pnpm knip` clean. `pnpm depcruise` no cycles.
- Bundle budget enforced via `.bundlesize`.
- A11y checks: labels, focus order, keyboard reachability.

---

## RepoMix Usage Policy
Use RepoMix only when a task spans multiple modules or needs full-repo context.  
Skip for local or single-file changes.

Workflow
1. Generate to temp:
   npx repomix --include "client/**,server/**,shared/**,docs/**,tests/**,scripts/**" \
     --exclude ".env*,**/*.pem,**/*.key,**/*.cert,node_modules/**,dist/**,coverage/**,.git/**,.worktrees/**,**/*.sqlite*,**/*.csv:!tests/fixtures/**" \
     --output /tmp/repomix-$(git rev-parse --short HEAD).md
2. Attach as PR comment. Never commit.
3. Delete after use:
   shred -u /tmp/repomix-*.md 2>/dev/null || rm -f /tmp/repomix-*.md
4. CI fails if any `repomix*` artifact remains. Max output 2 MB.

---

## Agent Responsibilities
- Extend/refactor React pages/components; keep business logic in `lib/` or workers.
- Update Express routes and shared services; do not duplicate bootstrap.
- Add/update tests with behaviour changes.
- Maintain build/test/CI scripts and deployment docs when touched.
- Record dependency updates in `CHANGELOG.md`.
- Prefer incremental, atomic PRs.

---

## When to Escalate
- Changes to data contracts or export semantics.
- Cross-cutting directory moves.
- Data model or authentication updates.

---

## Workflow
- Setup: `pnpm i`; copy `.env.example` → `.env`.
- Dev: `pnpm dev` full-stack.
- Quality: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm knip`, `pnpm depcruise`.

---

## Worker RPC Contract
- `parseCsv(file) → { ok, transactions[], errors[] }`
- `detectRecurring(transactions, options) → { series[], orphanIds[] }`
- `buildIcs(series[], monthDate) → { icsText, stats }`

---

## Review Checklist
- Zod at boundaries?
- Heavy logic off main thread?
- CSV/recurrence/ICS covered by fixtures and golden tests?
- Server entries unified and import rules respected?
- One VEVENT per series for the selected month?
- A11y verified?
- knip, depcruise, coverage, bundle budgets pass?

---

## Flexibility Clause
Rules guide quality, not block exploration. Deviations are allowed if they do not affect:
- Data contracts and schema validation
- ICS export correctness
- Security posture
- Basic CI pass (types + tests)

Document deviations in the PR and restore compliance before merge to `main`.
