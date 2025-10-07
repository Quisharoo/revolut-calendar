import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthNavigationProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function MonthNavigation({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthNavigationProps) {
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 w-full" data-testid="nav-month">
      <h2
        className="text-2xl font-semibold text-foreground flex-1 min-w-0"
        data-testid="text-month-year"
      >
        {monthYear}
      </h2>
      <div className="flex items-center gap-2 flex-none">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          data-testid="button-today"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevMonth}
          data-testid="button-prev-month"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          data-testid="button-next-month"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
