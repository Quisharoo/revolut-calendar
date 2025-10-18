# Export Contract

**Feature**: Promote Recurring Export
**Date**: 2025-10-17

## ExportRecurringTransactions Function

### Interface
```typescript
interface ExportOptions {
  transactions: ParsedTransaction[];
  selectedIds: string[];
  calendarName?: string;
}

interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

function exportRecurringTransactions(options: ExportOptions): Promise<ExportResult>;
```

### Parameters
- `transactions`: Array of all loaded transactions (required)
- `selectedIds`: Array of transaction IDs to include in export (required)
- `calendarName`: Optional name for the ICS calendar (defaults to "Recurring Transactions")

### Returns
- `success`: Boolean indicating if export completed successfully
- `fileName`: Name of downloaded file (if successful)
- `error`: Error message (if failed)

### Behavior
1. Filters transactions to only those with IDs in `selectedIds`
2. Validates that selected transactions are recurring
3. Generates ICS content using `buildRecurringIcs`
4. Creates blob and triggers download
5. Returns success/failure result

### Error Conditions
- No transactions selected → Error: "No transactions selected"
- Selected transactions include non-recurring → Error: "Selected transactions must be recurring"
- ICS generation fails → Error: "Failed to generate calendar file"
- Download fails → Error: "Failed to download file"

### Dependencies
- `buildRecurringIcs` from `@/lib/icsExport`
- `detectRecurringTransactions` from `@/lib/recurrenceDetection`