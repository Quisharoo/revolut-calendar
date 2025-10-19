import MonthNavigation from "@/components/MonthNavigation";
import { useState, useMemo, useCallback } from "react";
import type { ParsedTransaction } from "@shared/schema";
import CalendarGrid from "@/components/CalendarGrid";
import InsightsSidebar from "@/components/InsightsSidebar";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import DayDetailPanel from "@/components/DayDetailPanel";
import { CalendarExportButton } from "@/components/CalendarExportButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Filter } from "lucide-react";
import RangeSummaryDrawer from "@/components/RangeSummaryDrawer";
import {
  buildRangeCsv,
  buildRangeSummary,
  filterTransactionsInRange,
} from "@/lib/rangeSummary";
import type { DateRange } from "@/types/range";

interface CalendarPageProps {
  transactions: ParsedTransaction[];
  onRequestExport: (monthDate: Date) => void;
}

const EXPORT_TOOLTIP =
  "Generates a single-month .ics calendar file with one all-day event for each recurring transaction detected this month. Each event is set up to repeat automatically in your calendar app as needed.";

export default function CalendarPage({ transactions, onRequestExport }: CalendarPageProps) {
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

  // recurringTransactionsInMonth removed; handled by ExportModal

  const rangeTransactions = useMemo(
    () => filterTransactionsInRange(filteredTransactions, selectedRange),
    [filteredTransactions, selectedRange]
  );

  const rangeSummary = useMemo(() => {
    if (!selectedRange) {
      return null;
    }
    return buildRangeSummary(rangeTransactions, selectedRange);
  }, [rangeTransactions, selectedRange]);

  const handleCopyRangeCsv = useCallback(async () => {
    if (rangeTransactions.length === 0) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      toast({
        variant: "destructive",
        title: "Clipboard unavailable",
        description: "Copying CSV data is not supported in this environment.",
      });
      return;
    }

    try {
      const csv = buildRangeCsv(rangeTransactions);
      await navigator.clipboard.writeText(csv);
      toast({
        title: "Range copied",
        description: `Copied ${rangeTransactions.length} transaction${
          rangeTransactions.length !== 1 ? "s" : ""
        } to the clipboard.`,
      });
    } catch (error) {
      console.error("Failed to copy range CSV", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy the CSV data. Please try again.",
      });
    }
  }, [rangeTransactions, toast]);

  const handleRequestExport = () => {
    onRequestExport(currentDate);
  };

  const currentMonthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 lg:p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Only render the mobile layout when below the desktop breakpoint.
                PanelGroup applies an inline display value so relying solely on utility
                {/* classes like `hidden` can leave it visible in Safari/iOS. */}
            {!isDesktop ? (
              <div className="flex-1 space-y-6">
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
                    <CalendarExportButton
                      onClick={handleRequestExport}
                      tooltip={EXPORT_TOOLTIP}
                    />
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
                        <SheetHeader>
                          <SheetTitle className="sr-only">Filters</SheetTitle>
                          <SheetDescription className="sr-only">
                            Adjust calendar transactions using filters.
                          </SheetDescription>
                        </SheetHeader>
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
                  selectedRange={selectedRange}
                  onRangeSelect={handleRangeSelect}
                />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="flex-1">
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
                      <CalendarExportButton
                        onClick={handleRequestExport}
                        tooltip={EXPORT_TOOLTIP}
                      />
                    </div>
                    <CalendarGrid
                      currentDate={currentDate}
                      transactions={filteredTransactions}
                      selectedDate={selectedDate}
                      onDayClick={handleDayClick}
                      selectedRange={selectedRange}
                      onRangeSelect={handleRangeSelect}
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
            )}
          </div>
        </div>

      {selectedDate && !isDesktop && (
        <Sheet open={selectedDate !== null} onOpenChange={(open) => !open && handleClosePanel()}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Day details</SheetTitle>
              <SheetDescription className="sr-only">
                Detailed transactions for the selected day.
              </SheetDescription>
            </SheetHeader>
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
      </div>
    </TooltipProvider>
  );
}
