# Feature Specification: Promote Recurring Export

**Feature Branch**: `002-promote-recurring-export`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: User description: "I want to take the additional calendar export feature for recurring transactions that appears after you load the data (either csv or demo), and implement this at the beginning of the web page as I believe this provides the most immediate value of the app - extracting recurring transactions from csv and downloading as an ics file"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Immediate Recurring Export (Priority: P1)

As a user, I want to upload my transaction CSV and immediately see an option to export recurring transactions to an ICS calendar file, so I can get the core value of the app without navigating through the calendar view.

**Why this priority**: This provides the most immediate value as stated in the user description, allowing users to access the primary functionality right after data upload.

**Independent Test**: Can upload CSV, see export button, open modal, select/deselect transactions, download ICS file with only selected recurring transactions, and verify the file contains the expected events.

**Acceptance Scenarios**:

1. **Given** I am on the home page with no data loaded, **When** I upload a valid CSV file containing transactions, **Then** I see an "Export Recurring Transactions" button appear.
2. **Given** I have uploaded a CSV with recurring transactions, **When** I click the export button, **Then** I see a modal dialog listing all identified recurring transactions with checkboxes.
3. **Given** the modal is open, **When** I deselect some transactions and click "Export", **Then** I see a loading spinner with "Generating ICS..." message.
4. **Given** the loading completes, **When** the download starts, **Then** I download an ICS file containing only the selected recurring transactions with proper recurrence rules.
4. **Given** the downloaded ICS file, **When** I import it into a calendar application (like Google Calendar or Apple Calendar), **Then** the recurring events appear correctly with their repeat schedules.

---

### User Story 2 - Demo Data Export (Priority: P2)

As a user, I want to load demo data and export recurring transactions to ICS, so I can try the feature without providing my own transaction data.

**Why this priority**: Allows users to experience the core export functionality immediately without requiring real data.

**Independent Test**: Load demo data, see export button, open modal, select/deselect transactions, export ICS file, verify it contains selected demo recurring transactions.

**Acceptance Scenarios**:

1. **Given** I am on the home page, **When** I click "Load Demo Data", **Then** I see an "Export Recurring Transactions" button appear.
2. **Given** demo data is loaded, **When** I click the export button, **Then** I see a modal dialog listing all identified recurring transactions with checkboxes.
3. **Given** the modal is open, **When** I deselect some transactions and click "Export", **Then** I see a loading spinner with "Generating ICS..." message.
4. **Given** the loading completes, **When** the download starts, **Then** I download an ICS file with the selected demo recurring transactions.
4. **Given** the demo ICS file, **When** I import it into a calendar app, **Then** the demo recurring events display correctly.

---

## Functional Requirements

1. **Export Button Visibility**: The "Export Recurring Transactions" button must appear on the home page immediately after data is loaded (either via CSV upload or demo load).
2. **ICS Export Functionality**: Clicking the export button must generate and download a valid ICS file containing all detected recurring transactions from the loaded data.
3. **Recurrence Detection**: The export must include proper ICS recurrence rules (RRULE) for each recurring transaction based on the detected patterns. Use standard ICS RRULE format (e.g., FREQ=MONTHLY;BYMONTHDAY=15 for monthly recurrences on the 15th).
4. **File Naming**: The downloaded ICS file must be named using the format "recurring-transactions-{YYYY-MM-DD-HH-MM-SS}.ics" with a timestamp to ensure uniqueness.
5. **Error Handling**: If no recurring transactions are detected, the export button should be disabled or show an appropriate message.
6. **Performance**: Export generation must complete within 3 seconds for typical transaction datasets (up to 10,000 transactions).
7. **Transaction Selection**: Before generating the ICS file, users are presented with a modal dialog showing all identified recurring transactions, allowing them to deselect any they wish to exclude from the export.
8. **Loading Feedback**: During ICS file generation, display a loading spinner with "Generating ICS..." message.

## Success Criteria

- **User Experience**: 95% of users can successfully export recurring transactions within 30 seconds of uploading data.
- **Functionality**: All recurring transactions detected in the data are included in the ICS export.
- **Compatibility**: Exported ICS files are successfully importable into at least 3 major calendar applications (Google Calendar, Apple Calendar, Outlook).
- **Performance**: Export generation takes less than 3 seconds for datasets up to 10,000 transactions.
- **Accessibility**: Export functionality is accessible via keyboard navigation and screen readers.

## Key Entities

- **ParsedTransaction**: The transaction data structure containing amount, date, description, and category.
- **ICS File**: Standard calendar file format containing events with recurrence rules.
- **Recurring Transaction**: A transaction identified as recurring using the existing algorithm that groups by normalized description and transaction direction, detecting patterns of regular monthly occurrences with similar amounts.

## Assumptions

- Recurrence detection algorithm is already implemented and working.
- ICS export library is available and functional.
- Users have access to calendar applications that support ICS import.
- Demo data includes sufficient recurring transactions for testing.

## Out of Scope

- Integration with calendar APIs for direct upload (follow-up feature).

## Edge Cases

- CSV files with no recurring transactions (export button disabled).
- Very large CSV files (performance within limits).
- Malformed CSV data (handled by existing upload validation).
- Transactions with irregular recurrence patterns (exported as individual events if recurrence cannot be determined).

## Clarifications

### Session 2025-10-17

- Q: What functionality is explicitly out of scope for this feature? → A: Integration with calendar APIs for direct upload
- Q: How are recurring transactions uniquely identified and grouped? → A: Using existing recurrence detection algorithm that groups by normalized description and direction, detecting monthly patterns with amount tolerance
- Q: What user feedback is shown during the ICS export process? → A: Show loading spinner with "Generating ICS..." message

