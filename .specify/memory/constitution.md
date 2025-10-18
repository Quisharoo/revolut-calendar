<!--
Sync Impact Report

Version change: none → 1.0.0

List of modified principles: all new (Code Quality First, Test with Purpose, User Experience Consistency, Performance as a Feature)

Added sections: Technology Stack and Constraints, Development Workflow

Removed sections: none

Templates requiring updates: plan-template.md ✅ updated, tasks-template.md ✅ no update needed (tasks organized by user story, principles checked in plan), spec-template.md ✅ no update needed, agent-file-template.md ✅ no update needed, checklist-template.md ✅ no update needed

Follow-up TODOs: none
-->
# Transaction Calendar Constitution

## Core Principles

### Code Quality First
Maintain readable, modular, and well-documented codebases.
Prefer clear design patterns and consistent coding standards over ad hoc solutions.
Require peer review for every change touching production paths.

### Test with Purpose
Mandate automated tests that validate expected behavior and guard against regressions.
Define coverage expectations per component; investigate gaps before release.
Preserve fast, reliable pipelines; failing or flaky tests block merges until resolved.

### User Experience Consistency
Align implementations with established UX patterns, accessibility guidelines, and copy tone.
Validate user flows across supported devices and locales prior to launch.
Favor predictable interactions over novel but inconsistent behavior.

### Performance as a Feature
Budget performance metrics (latency, memory, throughput) during planning.
Profile critical paths and remediate bottlenecks before shipping.
Track performance regressions in telemetry; treat degradations as release blockers.

## Technology Stack and Constraints
The application uses React 18 with TypeScript for the frontend, Node.js 20 with Express for the backend, PostgreSQL via Drizzle ORM for data storage, and Tailwind CSS with Radix UI for consistent UI/UX. All code must adhere to these technologies and their best practices.

## Development Workflow
Code review requirements include verifying compliance with principles. Testing gates require passing Vitest suites with defined coverage. Deployment approval requires sign-off from quality, UX, and performance leads.

## Governance
Constitution supersedes all other practices; Amendments require documentation, approval, migration plan. All PRs/reviews must verify compliance; Complexity must be justified; Use agents.md for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2025-10-17
