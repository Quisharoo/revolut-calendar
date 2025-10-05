import { useState, useMemo } from "react";
import type { ParsedTransaction } from "@shared/schema";
import MonthNavigation from "@/components/MonthNavigation";
import CalendarGrid from "@/components/CalendarGrid";
import InsightsSidebar from "@/components/InsightsSidebar";
import FilterPanel, { type FilterState } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

interface CalendarPageProps {
  transactions: ParsedTransaction[];
}

export default function CalendarPage({ transactions }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    broker: "",
    minAmount: "",
    maxAmount: "",
    searchText: "",
  });

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(transaction.category)
      ) {
        return false;
      }

      if (
        filters.broker &&
        !transaction.broker?.toLowerCase().includes(filters.broker.toLowerCase())
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

      if (
        filters.searchText &&
        !transaction.description
          .toLowerCase()
          .includes(filters.searchText.toLowerCase())
      ) {
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

  const currentMonthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <MonthNavigation
                currentDate={currentDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
              />
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
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

            <CalendarGrid
              currentDate={currentDate}
              transactions={filteredTransactions}
            />
          </div>

          <div className="hidden lg:block w-80 xl:w-96 space-y-6">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
            <InsightsSidebar
              transactions={currentMonthTransactions}
              currentMonth={currentMonthName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
