import { useState, useMemo } from "react";
import type { ParsedTransaction } from "@shared/schema";
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
import { buildRecurringIcs, filterRecurringTransactionsForMonth } from "@/lib/icsExport";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Download, Filter } from "lucide-react";

interface CalendarPageProps {
  transactions: ParsedTransaction[];
}

const EXPORT_TOOLTIP =
  "Generates a single-month .ics calendar file with one all-day event for each recurring transaction detected this month. Each event is set up to repeat automatically in your calendar app as needed.";

export default function CalendarPage({ transactions }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<ParsedTransaction[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minAmount: "",
    maxAmount: "",
    searchText: "",
    recurringOnly: false,
  });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { toast } = useToast();

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
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
    setSelectedDayTransactions([]);
  };

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

  const recurringTransactionsInMonth = useMemo(
    () => filterRecurringTransactionsForMonth(transactions, currentDate),
    [transactions, currentDate]
  );

  const handleExportRecurring = () => {
    const monthLabel = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (recurringTransactionsInMonth.length === 0) {
      toast({
        title: "No recurring transactions",
        description: `There are no recurring transactions in ${monthLabel}.`,
      });
      return;
    }

    try {
      const icsContent = buildRecurringIcs(transactions, {
        monthDate: currentDate,
        calendarName: `Recurring Transactions - ${monthLabel}`,
      });

      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `recurring-transactions-${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}.ics`;

      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

      toast({
        title: "Calendar exported",
        description: `Recurring transactions for ${monthLabel} saved to ${fileName}.`,
      });
    } catch (error) {
      console.error("Failed to export recurring transactions", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Unable to create the calendar file. Please try again.",
      });
    }
  };

  const currentMonthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile layout - no resizable panels */}
          <div className="lg:hidden flex-1 space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
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
                    <Button
                      variant="outline"
                      size="icon"
                      data-testid="button-mobile-filter"
                    >
                      <Filter className="w-4 h-4" />
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
                          currentMonth={currentMonthName}
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
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={10} minSize={20} maxSize={40}>
              <div className="h-full pl-3 space-y-6 overflow-y-auto">
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
                <InsightsSidebar
                  transactions={currentMonthTransactions}
                  currentMonth={currentMonthName}
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
      </div>
    </TooltipProvider>
  );
}
