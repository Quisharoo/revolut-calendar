import { useState, useMemo, useCallback } from "react";
import type { ParsedTransaction, TransactionCategory } from "@shared/schema";
import MonthNavigation from "@/components/MonthNavigation";
import CalendarGrid from "@/components/CalendarGrid";
import InsightsSidebar from "@/components/InsightsSidebar";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import DayDetailPanel from "@/components/DayDetailPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyBudgets } from "@/hooks/use-monthly-budgets";
import { buildRecurringIcs, filterRecurringTransactionsForMonth } from "@/lib/icsExport";
import {
  calculateCategoryActuals,
  calculateBudgetProgress,
} from "@/lib/budgetUtils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Download, Filter } from "lucide-react";
import RangeSummaryDrawer from "@/components/RangeSummaryDrawer";
import {
  buildRangeCsv,
  buildRangeSummary,
  filterTransactionsInRange,
  type DateRange,
} from "@/lib/rangeSummary";

interface CalendarPageProps {
  transactions: ParsedTransaction[];
}

const EXPORT_TOOLTIP =
  "Generates a single-month .ics calendar file with one all-day event for each recurring transaction detected this month. Each event is set up to repeat automatically in your calendar app as needed.";

export default function CalendarPage({ transactions }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [isRangeDrawerOpen, setRangeDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minAmount: "",
    maxAmount: "",
    searchText: "",
    recurringOnly: false,
  });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { toast } = useToast();
  const { budgets, saveBudgets, resetBudgets } = useMonthlyBudgets(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date, dayTransactions: ParsedTransaction[]) => {
    setSelectedDate(dayTransactions.length > 0 ? date : null);
    setSelectedDayTransactions(dayTransactions);
    setRangeDrawerOpen(false);
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
    setSelectedDayTransactions([]);
  };

  const handleRangeSelect = useCallback((range: DateRange) => {
    console.log("[Calendar] handleRangeSelect called with range:", range);
    
    const start = new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      range.start.getDate()
    );
    const end = new Date(
      range.end.getFullYear(),
      range.end.getMonth(),
      range.end.getDate()
    );

    const normalizedRange = start.getTime() <= end.getTime() 
      ? { start, end } 
      : { start: end, end: start };

    console.log("[Calendar] Setting selectedRange:", normalizedRange);
    console.log("[Calendar] Opening drawer: isRangeDrawerOpen = true");
    
    setSelectedRange(normalizedRange);
    setSelectedDate(null);
    setSelectedDayTransactions([]);
    setRangeDrawerOpen(true);
  }, []);

  const filteredTransactions = useMemo(() => {
    const searchQuery = filters.searchText.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const sourceLabel = transaction.source?.name ?? transaction.broker ?? "";
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(transaction.category)
      ) {
        return false;
      }

      const absAmount = Math.abs(transaction.amount);
      if (filters.minAmount && absAmount < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && absAmount > parseFloat(filters.maxAmount)) {
        return false;
      }

      if (searchQuery) {
        const matchesDescription = transaction.description
          .toLowerCase()
          .includes(searchQuery);
        const matchesSource = sourceLabel.toLowerCase().includes(searchQuery);
        const matchesCategory = transaction.category
          .toLowerCase()
          .includes(searchQuery);
        if (!matchesDescription && !matchesSource && !matchesCategory) {
          return false;
        }
      }

      if (filters.recurringOnly && !transaction.isRecurring) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  const currentMonthTransactions = useMemo(() => {
    return filteredTransactions.filter(
      (t) =>
        t.date.getMonth() === currentDate.getMonth() &&
        t.date.getFullYear() === currentDate.getFullYear()
    );
  }, [filteredTransactions, currentDate]);

  const categoryActuals = useMemo(
    () => calculateCategoryActuals(currentMonthTransactions),
    [currentMonthTransactions]
  );

  const incomeActual = categoryActuals.Income;
  const expenseActual = categoryActuals.Expense;

  const incomeBudgetProgress = useMemo(
    () => calculateBudgetProgress(incomeActual, budgets.Income),
    [incomeActual, budgets.Income]
  );

  const expenseBudgetProgress = useMemo(
    () => calculateBudgetProgress(expenseActual, budgets.Expense),
    [expenseActual, budgets.Expense]
  );

  const budgetProgress = useMemo(
    () => ({
      Income: incomeBudgetProgress,
      Expense: expenseBudgetProgress,
    }),
    [incomeBudgetProgress, expenseBudgetProgress]
  );

  const overBudgetCategories = useMemo(() => {
    const set = new Set<TransactionCategory>();
    if (expenseBudgetProgress.isOverBudget) {
      set.add("Expense");
    }
    if (incomeBudgetProgress.isOverBudget) {
      set.add("Income");
    }
    return set;
  }, [expenseBudgetProgress.isOverBudget, incomeBudgetProgress.isOverBudget]);

  const recurringTransactionsInMonth = useMemo(
    () => filterRecurringTransactionsForMonth(transactions, currentDate),
    [transactions, currentDate]
  );

  const rangeTransactions = useMemo(
    () => (selectedRange ? filterTransactionsInRange(filteredTransactions, selectedRange) : []),
    [filteredTransactions, selectedRange]
  );

  const rangeSummary = useMemo(
    () => (selectedRange ? buildRangeSummary(rangeTransactions, selectedRange) : null),
    [rangeTransactions, selectedRange]
  );

  const handleExportRecurring = () => {
    if (recurringTransactionsInMonth.length === 0) {
      toast({
        title: "No recurring transactions",
        description: "There are no recurring transactions to export for this month.",
        variant: "destructive",
      });
      return;
    }

    const icsContent = buildRecurringIcs(recurringTransactionsInMonth, currentDate);
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const monthYear = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
    link.download = `recurring-transactions-${monthYear}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${recurringTransactionsInMonth.length} recurring transactions for ${monthYear}.`,
    });
  };

  const handleCopyRangeCsv = () => {
    if (!rangeSummary || rangeTransactions.length === 0) {
      toast({
        title: "No transactions",
        description: "There are no transactions in the selected range to export.",
        variant: "destructive",
      });
      return;
    }

    const csv = buildRangeCsv(rangeTransactions);
    navigator.clipboard.writeText(csv).then(
      () => {
        toast({
          title: "CSV copied",
          description: `Copied ${rangeTransactions.length} transactions to clipboard.`,
        });
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy CSV to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {/* Mobile layout - full width with sheet sidebar */}
          <div className="lg:hidden flex h-full flex-col p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[260px]">
                <MonthNavigation
                  currentDate={currentDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onToday={handleToday}
                />
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportRecurring}
                        disabled={recurringTransactionsInMonth.length === 0}
                        data-testid="button-export-ics"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {EXPORT_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="mt-6 space-y-6">
                      <FilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                      <div className="border-t border-border pt-6">
                        <InsightsSidebar
                          transactions={currentMonthTransactions}
                          currentDate={currentDate}
                          budgets={budgets}
                          budgetProgress={budgetProgress}
                          onBudgetsChange={saveBudgets}
                          onResetBudgets={resetBudgets}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <CalendarGrid
              currentDate={currentDate}
              transactions={filteredTransactions}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              selectedRange={selectedRange}
              onRangeSelect={handleRangeSelect}
              overBudgetCategories={overBudgetCategories}
            />
          </div>

          {/* Desktop layout - with resizable panels */}
          <ResizablePanelGroup
            direction="horizontal"
            className="hidden lg:flex flex-1"
          >
            <ResizablePanel defaultSize={60} minSize={50}>
              <div className="h-full pr-3 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[260px]">
                    <MonthNavigation
                      currentDate={currentDate}
                      onPrevMonth={handlePrevMonth}
                      onNextMonth={handleNextMonth}
                      onToday={handleToday}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportRecurring}
                          disabled={recurringTransactionsInMonth.length === 0}
                          data-testid="button-export-ics"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end">
                      {EXPORT_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CalendarGrid
                  currentDate={currentDate}
                  transactions={filteredTransactions}
                  selectedDate={selectedDate}
                  onDayClick={handleDayClick}
                  selectedRange={selectedRange}
                  onRangeSelect={handleRangeSelect}
                  overBudgetCategories={overBudgetCategories}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={10} minSize={20} maxSize={40}>
              <div className="h-full pl-3 space-y-6 overflow-y-auto">
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
                <InsightsSidebar
                  transactions={currentMonthTransactions}
                  currentDate={currentDate}
                  budgets={budgets}
                  budgetProgress={budgetProgress}
                  onBudgetsChange={saveBudgets}
                  onResetBudgets={resetBudgets}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {selectedDate && !isDesktop && (
        <Sheet open={selectedDate !== null} onOpenChange={(open) => !open && handleClosePanel()}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <DayDetailPanel
              date={selectedDate}
              transactions={selectedDayTransactions}
              onClose={handleClosePanel}
            />
          </SheetContent>
        </Sheet>
      )}

      {selectedDate && isDesktop && (
        <>
          <div
            className="fixed top-0 right-0 z-[60] h-screen w-96 bg-white dark:bg-neutral-950 border-l border-border shadow-xl animate-in slide-in-from-right duration-300"
            data-testid="panel-day-detail"
          >
            <DayDetailPanel
              date={selectedDate}
              transactions={selectedDayTransactions}
              onClose={handleClosePanel}
            />
          </div>

          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClosePanel}
            data-testid="overlay-backdrop"
          />
        </>
      )}
      <RangeSummaryDrawer
        open={isRangeDrawerOpen}
        onOpenChange={setRangeDrawerOpen}
        summary={rangeSummary}
        range={selectedRange}
        transactions={rangeTransactions}
        onCopyCsv={handleCopyRangeCsv}
      />
    </TooltipProvider>
  );
}
