# Implementation Plan: Promote Recurring Export

**Branch**: `002-promote-recurring-export` | **Date**: 2025-10-17 | **Spec**: specs/002-promote-recurring-export/spec.md
**Input**: Feature specification from `/specs/002-promote-recurring-export/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement recurring transaction export functionality on the home page with modal selection. Reuse existing recurrence detection algorithm and ICS export library, add UI components for transaction selection and loading feedback.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.3.1, Node.js 20  
**Primary Dependencies**: React, Tailwind CSS, Radix UI, Vitest, date-fns  
**Storage**: Client-side (no server storage required)  
**Testing**: Vitest + Testing Library + jsdom  
**Target Platform**: Web browsers (Chrome, Firefox, Safari)  
**Project Type**: Web application (client-side React app)  
**Performance Goals**: ICS export generation under 3 seconds for up to 10,000 transactions  
**Constraints**: Client-side processing only, no server-side APIs required  
**Scale/Scope**: Handle datasets up to 10,000 transactions, support CSV and demo data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality First**: Ensure the plan includes readable, modular code structure and peer review processes.
- **Test with Purpose**: Define automated testing strategy with Vitest, coverage expectations, and CI pipeline for tests.
- **User Experience Consistency**: Align with Tailwind CSS and Radix UI patterns, plan for accessibility and device validation.
- **Performance as a Feature**: Budget metrics for client-side rendering and API responses, include profiling and telemetry plans.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
client/
├── src/
│   ├── components/
│   │   ├── ExportModal.tsx          # New: Modal for transaction selection
│   │   └── ui/                      # Existing: Radix UI components
│   ├── pages/
│   │   └── home.tsx                 # Modified: Add export button and modal trigger
│   ├── lib/
│   │   ├── icsExport.ts             # Existing: Reuse buildRecurringIcs function
│   │   └── recurrenceDetection.ts   # Existing: Reuse detection logic
│   └── hooks/
│       └── use-export.ts            # New: Custom hook for export logic
├── __tests__/
│   └── components/
│       └── ExportModal.test.tsx     # New: Unit tests for modal component

shared/
└── schema.ts                        # Existing: Transaction types
```

**Structure Decision**: This is a client-side React web application. The feature adds a new modal component and modifies the existing home page to include export functionality. All changes are within the client/ directory, reusing existing lib functions and UI components.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

