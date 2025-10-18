# Research: Promote Recurring Export

**Feature**: Promote Recurring Export
**Date**: 2025-10-17
**Researcher**: AI Assistant

## Decisions

### Modal Implementation
**Decision**: Use Radix UI Dialog component for the transaction selection modal
**Rationale**: Consistent with existing UI components (already using Radix UI throughout the app), provides accessibility features out of the box, and follows the established design system.
**Alternatives Considered**:
- Custom modal implementation: Rejected due to duplication of accessibility and styling efforts
- Headless UI: Rejected as Radix UI is already in use and provides similar functionality

### Loading State UX
**Decision**: Show loading spinner with "Generating ICS..." message using Radix UI components
**Rationale**: Provides clear user feedback during potentially long operations, consistent with app's UI patterns, and prevents user confusion.
**Alternatives Considered**:
- Progress bar: Rejected as export time is typically under 3 seconds, making progress indication less valuable
- No feedback: Rejected as it could make the app feel unresponsive

### Transaction Selection UI
**Decision**: Use checkboxes in a scrollable list within the modal
**Rationale**: Simple, familiar interface that allows users to easily select/deselect transactions, with clear visual feedback.
**Alternatives Considered**:
- Multi-select dropdown: Rejected as less suitable for potentially long lists of transactions
- Drag-and-drop: Rejected as overkill for this use case

### ICS Export Optimization
**Decision**: Reuse existing buildRecurringIcs function with selected transactions
**Rationale**: Leverages proven, tested code and maintains consistency with calendar page export.
**Alternatives Considered**:
- New export function: Rejected to avoid code duplication and potential inconsistencies

### Error Handling
**Decision**: Display toast notifications for export failures, consistent with existing app patterns
**Rationale**: Maintains UX consistency and provides clear feedback without disrupting the modal flow.
**Alternatives Considered**:
- Modal error display: Rejected as toasts are already established for transient messages