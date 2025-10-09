# Changelog

## Bug Fixes - October 9, 2025

### 1. Fixed Timezone-Related Date Shift Bug
**Problem**: Transactions were appearing on the wrong day in the calendar. For example, a transaction at 23:19 on September 30 would appear on October 1.

**Root Cause**: The code was using `.toISOString().split("T")[0]` to generate date keys, which converts dates to UTC. This caused timezone shifts:
- A date like "Sept 30, 2025 23:19 IST (GMT+1)" converts to "Sept 30, 2025 22:19 UTC"
- But when comparing with calendar cells created in local time, "Oct 1, 2025 00:00 IST" converts to "Sept 30, 2025 23:00 UTC"
- This mismatch caused transactions to appear on the wrong day

**Solution**: Created a new `getLocalDateKey()` helper function that generates date keys using local date components instead of UTC:
```typescript
export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

**Files Changed**:
- `client/src/lib/transactionUtils.ts` - Added `getLocalDateKey()` function and updated `summarizeTransactionsByDate()`
- `client/src/components/CalendarGrid.tsx` - Updated to use `getLocalDateKey()`
- `client/src/components/CalendarDayCell.tsx` - Updated to use `getLocalDateKey()`

### 2. Fixed Sidebar Calculation Bug with Transfer Transactions
**Problem**: When filtering transactions (e.g., by source), the sidebar's Net Total and Category Breakdown didn't match the calendar grid totals. The sidebar was excluding Transfer transactions that should have been included.

**Root Cause**: The `InsightsSidebar` and `DayDetailPanel` components were trying to re-categorize Transfer transactions based on their sign:
```typescript
// Old buggy code
.filter((t) => t.category === "Income" || (t.category === "Transfer" && t.amount > 0))
```
However, when users applied category filters upstream, Transfer transactions were already filtered out before reaching the sidebar.

**Solution**: Simplified the logic to group transactions purely by amount sign, which works correctly regardless of category:
```typescript
// New correct code
.filter((t) => t.amount > 0)  // All positive amounts
.filter((t) => t.amount < 0)  // All negative amounts
```

**Files Changed**:
- `client/src/components/InsightsSidebar.tsx` - Updated calculation logic
- `client/src/components/DayDetailPanel.tsx` - Updated grouping logic

### Test Coverage
Added comprehensive test suites to prevent regressions:
- `client/src/components/__tests__/InsightsSidebar.test.tsx` - 13 tests covering Transfer handling, calculations, edge cases
- `client/src/components/__tests__/DayDetailPanel.test.tsx` - 15 tests covering grouping, display, interactions

**Total Test Suite**: 51 tests, all passing ✅

