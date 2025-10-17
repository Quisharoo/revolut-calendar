# Data Model: Promote Recurring Export

**Feature**: Promote Recurring Export
**Date**: 2025-10-17

## Entities

### ParsedTransaction
Represents a single financial transaction loaded from CSV or demo data.

**Fields**:
- `id`: string - Unique identifier for the transaction
- `date`: Date - Transaction date
- `amount`: number - Transaction amount (positive for income, negative for expenses)
- `description`: string - Transaction description from bank
- `category`: string (optional) - Categorized transaction type
- `source`: object (optional) - Source information (e.g., {name: "Revolut"})
- `isRecurring`: boolean - Whether this transaction is part of a recurring pattern

**Validation Rules**:
- `id` must be unique within the dataset
- `date` must be a valid Date object
- `amount` must be a number
- `description` must be non-empty string

**Relationships**:
- Belongs to RecurringGroup (many-to-one, optional)

### RecurringGroup
Represents a group of transactions that form a recurring pattern.

**Fields**:
- `key`: string - Grouping key (normalized description + direction)
- `transactions`: ParsedTransaction[] - Array of transactions in this group
- `pattern`: string - Detected recurrence pattern description

**Validation Rules**:
- `key` must be unique
- `transactions` must contain at least 3 transactions
- All transactions in group must have same direction (income/expense)

**Relationships**:
- Has many ParsedTransaction

### ExportSelection
Represents the user's selection of transactions for export.

**Fields**:
- `selectedTransactions`: ParsedTransaction[] - Transactions chosen for export
- `totalRecurring`: number - Total number of recurring transactions available
- `selectedCount`: number - Number of transactions selected

**Validation Rules**:
- `selectedTransactions` must be subset of available recurring transactions
- `selectedCount` <= totalRecurring

**Relationships**:
- References ParsedTransaction (many-to-many)

### ICSEvent
Represents a calendar event in the exported ICS file.

**Fields**:
- `summary`: string - Event title
- `startDate`: Date - Event start date
- `recurrenceRule`: string - ICS RRULE for recurrence
- `description`: string - Event description

**Validation Rules**:
- `summary` must be non-empty
- `startDate` must be valid Date
- `recurrenceRule` must be valid ICS RRULE format

**Relationships**:
- Generated from ParsedTransaction (one-to-one)

## State Transitions

### Transaction Loading State
1. **Initial**: No data loaded
2. **Loading**: Processing CSV or demo data
3. **Loaded**: Transactions available, recurring detection complete
4. **Error**: Failed to load data

### Export Process State
1. **Idle**: Export button visible
2. **Selecting**: Modal open, user selecting transactions
3. **Generating**: Processing selected transactions into ICS
4. **Complete**: ICS file downloaded
5. **Error**: Export failed

## Data Flow

1. User uploads CSV → ParsedTransaction[] created
2. Recurrence detection → isRecurring flags set, RecurringGroup[] created
3. User clicks export → ExportSelection created via modal
4. Selected transactions → ICSEvent[] generated
5. ICSEvent[] → ICS file created and downloaded