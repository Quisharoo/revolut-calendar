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
├── client/                   # React 18 + Vite frontend  
│   ├── src/  
│   │   ├── components/       # Reusable UI primitives  
│   │   ├── pages/            # Route-level components  
│   │   ├── hooks/            # Custom React hooks  
│   │   ├── lib/              # Core logic (parser, recurrence, export)  
│   │   ├── workers/          # Web Workers for heavy compute  
│   │   ├── normalization/    # Payee / amount cleanup  
│   │   ├── styles/           # Tailwind / global CSS  
│   │   ├── types/            # UI-only types  
│   │   ├── main.tsx          # App entry  
│   │   └── router.tsx        # Wouter route definitions  
│   └── index.html  
├── server/                   # Express app for local or full-stack mode  
│   ├── createApp.ts  
│   ├── index.ts  
│   ├── routes/  
│   └── middleware/  
├── shared/                   # Shared logic between client and server  
│   ├── schema.ts             # Zod schemas and derived types  
│   ├── constants.ts  
│   ├── version.ts  
│   └── utils.ts  
├── tests/                    # Integration and golden tests  
│   ├── csv/  
│   ├── recurrence/  
│   ├── ics/  
│   └── e2e/                  # Playwright smoke tests  
├── docs/                     # Documentation and ADRs  
│   ├── AGENTS.md  
│   ├── DEPLOYMENT.md  
│   ├── RECURRENCE-SPEC.md  
│   ├── ICS-EXAMPLES/  
│   └── ADR-002-Workers-vs-Server.md  
├── scripts/                  # Build / release / metrics scripts  
│   ├── build.ts  
│   ├── changelog.ts  
│   └── metrics.ts  
├── public/                   # Static assets  
│   └── favicon.svg  
├── vitest.config.ts  
├── tsconfig.json  
├── vite.config.ts  
├── package.json  
└── README.md

### Guidelines
- Core logic in `client/src/lib/` or `shared/`.  
- Heavy compute (parse, recurrence, export) in workers.  
- Server and API import only from `shared/`.

---

## Architecture Rules
- Validate all boundary inputs with Zod (`shared/schema.ts`).  
- UI handles state and orchestration only.  
- Single Express entry via `createApp`, reused by API handler.  
- Canonical `source` object for provenance; `broker` deprecated.

---

## Contracts and Schemas
- Define Zod schemas for `Transaction`, `RecurringSeries`, `IcsEvent`.  
- Derive TS types from schemas; no handwritten interfaces.  
- Version contracts in `shared/version.ts`; migrate on breaking changes.  
- CSV header maps support localized field names.

---

## ICS Export Policy
ICS export is a core feature and must comply with RFC 5545.  
- Emit `UID`, `DTSTAMP`, and consistent timezone (`TZID` or UTC).  
- Use `RRULE:FREQ=MONTHLY;BYMONTHDAY=n` for monthly recurrences.  
- Fold lines at 75 chars; escape commas, semicolons, newlines.  
- Centralize escaping in `escapeIcsText`.  
- Export covers only the selected month – one VEVENT per recurring series.  
- Validate output via `pnpm test:ics` using `docs/ICS-EXAMPLES/`.  
- Lint outputs with `ical-linter` before merge.

---

## Recurrence Detection Policy
- Group key = normalized payee + sign + tolerance band.  
  - 0–50 → ±0.50  
  - 50–500 → ±1%  
  - 500+ → ±0.5%  
- ≥3 occurrences and ≥90-day span required.  
- Allow weekday drift for month-end payments.  
- Each series includes an `explanation` object (dates, gaps, deltas).  
- Specs and fixtures in `docs/RECURRENCE-SPEC.md`.

---

## Performance Budget
- CSV parse (50k rows) <2 s on M-series laptop.  
- Main thread blocked <16 ms/frame.  
- Month render <200 ms with 2k items.  
- Worker offload for parse, recurrence, and export.

---

## Security Hygiene
- No secrets in client bundles.  
- Enforce CSV size and line-length limits.  
- Escape and normalize text before rendering.  
- Allowlist `.csv` only; reject HTML or script inputs.

---

## CI & Quality Gates
- `pnpm test --coverage`  
- `pnpm typecheck`  
- `pnpm knip`  
- `pnpm depcruise`  
- Bundle size thresholds in `.bundlesize`.  
- A11y check for labels, focus order, keyboard reachability.

---

## RepoMix Usage Policy
Use RepoMix only when a task spans multiple modules or requires full-repo context.  
Skip for local or single-file changes.

### Workflow
1. Generate to temp  
   npx repomix --include "client/**,server/**,shared/**,docs/**,tests/**,scripts/**" \
     --exclude ".env*,**/*.pem,**/*.key,**/*.cert,node_modules/**,dist/**,coverage/**,.git/**,.worktrees/**,**/*.sqlite*,**/*.csv:!tests/fixtures/**" \
     --output /tmp/repomix-$(git rev-parse --short HEAD).md
2. Attach summary as PR comment – never commit.  
3. Delete after use  
   shred -u /tmp/repomix-*.md 2>/dev/null || rm -f /tmp/repomix-*.md
4. CI fails if any `repomix*` artifact remains.  
Max output 2 MB and secrets must be excluded.

---

## Agent Responsibilities
- Extend or refactor React components/pages and shared UI primitives.  
- Update Express routes and shared services without duplicating bootstrap.  
- Add or update tests for changed behaviour.  
- Maintain build/test/CI scripts and deployment docs when touched.  
- Record dependency updates in `CHANGELOG.md`.  
- Prefer incremental, composable updates over sweeping rewrites.  
- Use atomic PRs with clear context.

---

## When to Escalate
- Ambiguous requirements or breaking contract updates.  
- Major UX or export-semantics changes.  
- Data-model or authentication refactors.

---

## Workflow
- Setup: `pnpm i`; copy `.env.example` → `.env`.  
- Dev: `pnpm dev` for full-stack mode.  
- Quality: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm knip`, `pnpm depcruise`.  

---

## Worker RPC Contract
- `parseCsv(file) → { ok, transactions[], errors[] }`  
- `detectRecurring(transactions, options) → { series[], orphanIds[] }`  
- `buildIcs(series[], monthDate) → { icsText, stats }`

---

## Review Checklist
- Inputs validated with Zod?  
- Heavy logic off main thread?  
- CSV / recurrence / export tested with fixtures?  
- Server entries unified (API → static → SPA)?  
- Export produces one VEVENT per recurring series for selected month?  
- Accessibility verified?  
- `knip`, `depcruise`, and coverage checks pass?

---

## Flexibility Clause
Prescriptive rules guide quality, not block exploration.  
During feature work, deviations are allowed if they do not affect:
- Data contracts or schema validation  
- ICS export correctness  
- Security posture  
- Basic CI pass (types + tests)

Document any deviation in the PR and restore compliance before merge to `main`.
