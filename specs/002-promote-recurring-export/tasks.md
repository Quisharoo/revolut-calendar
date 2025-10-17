---
description: "Task list template for feature implementation"
---

# Tasks: Promote Recurring Export

**Input**: Design documents from `/specs/002-promote-recurring-export/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are included per constitution requirements for Vitest unit and integration testing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `client/src/` for React components
- Adjust based on plan.md structure

## Dependencies

**User Story Completion Order**:
- US1 (P1) can be implemented independently
- US2 (P2) can be implemented independently after foundational components
- No cross-dependencies between user stories

**Parallel Opportunities**:
- Foundational components can be developed in parallel
- US1 and US2 can be developed in parallel after foundational

## Implementation Strategy

**MVP Scope**: User Story 1 (CSV export) provides the core value
**Incremental Delivery**: Each user story delivers independently testable functionality
**Shared Components**: Modal and export logic are shared between stories

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - using existing project structure and dependencies

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared components that MUST be complete before any user story can be implemented

- [ ] T001 Create ExportModal component with transaction selection in client/src/components/ExportModal.tsx
- [ ] T002 Create use-export custom hook for export logic in client/src/hooks/use-export.ts
- [ ] T003 Modify home page to show export button after data load in client/src/pages/home.tsx
- [ ] T004 [P] Create unit tests for ExportModal component in client/src/components/__tests__/ExportModal.test.tsx
- [ ] T005 [P] Create unit tests for use-export hook in client/src/hooks/__tests__/use-export.test.ts

**Checkpoint**: Foundational components ready - user story implementation can now begin in parallel

## Phase 3: User Story 1 - Immediate Recurring Export (Priority: P1) 🎯 MVP

**Goal**: Enable CSV upload and immediate recurring transaction export

**Independent Test**: Upload CSV → see export button → open modal → select/deselect → download ICS → verify calendar import

- [ ] T006 [US1] Integrate export button trigger in CSV upload flow in client/src/pages/home.tsx
- [ ] T007 [US1] Connect modal to CSV data in client/src/pages/home.tsx
- [ ] T008 [US1] Create integration test for CSV upload to export flow in client/src/__tests__/home-export-csv.test.tsx

**Checkpoint**: US1 fully functional - CSV users can export recurring transactions

## Phase 4: User Story 2 - Demo Data Export (Priority: P2)

**Goal**: Enable demo data loading and recurring transaction export

**Independent Test**: Load demo → see export button → open modal → select/deselect → download ICS → verify calendar import

- [ ] T009 [US2] Integrate export button trigger in demo load flow in client/src/pages/home.tsx
- [ ] T010 [US2] Connect modal to demo data in client/src/pages/home.tsx
- [ ] T011 [US2] Create integration test for demo load to export flow in client/src/__tests__/home-export-demo.test.tsx

**Checkpoint**: US2 fully functional - demo users can export recurring transactions

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, accessibility, and any remaining concerns

- [ ] T012 Verify accessibility compliance for export modal in client/src/components/ExportModal.tsx
- [ ] T013 Add error handling for edge cases in client/src/hooks/use-export.ts
- [ ] T014 Update component documentation and TypeScript types
- [ ] T015 Test with large datasets (performance validation)
- [ ] T016 Run full test suite and verify all tests pass