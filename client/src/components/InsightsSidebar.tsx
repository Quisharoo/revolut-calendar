import type { ParsedTransaction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getCategoryDotColor,
  formatCurrency,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";
import { TrendingUp, TrendingDown, Repeat } from "lucide-react";

interface InsightsSidebarProps {
  transactions: ParsedTransaction[];
  currentMonth: string;
}

export default function InsightsSidebar({
  transactions,
  currentMonth,
}: InsightsSidebarProps) {
  const incomeTransactions = transactions.filter((t) => t.category === "Income");
  const expenseTransactions = transactions.filter((t) => t.category === "Expense");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const netTotal = totalIncome + totalExpense;

  const recurringCount = transactions.filter((t) => t.isRecurring).length;

  const currencySymbol = transactions[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

  const categoryBreakdown = [
    {
      category: "Income",
      count: incomeTransactions.length,
      total: totalIncome,
    },
    {
      category: "Expense",
      count: expenseTransactions.length,
      total: totalExpense,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6" data-testid="card-summary">
        <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="heading-month">
          {currentMonth} Summary
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Net Total</p>
            <p className={`text-3xl font-bold ${netTotal >= 0 ? "text-primary" : "text-destructive"}`} data-testid="text-net-total">
              {formatCurrency(netTotal, currencySymbol)}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Income</span>
              </div>
              <span className="text-sm font-semibold text-primary" data-testid="text-total-income">
                {formatCurrency(totalIncome, currencySymbol)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <span className="text-sm font-semibold text-destructive" data-testid="text-total-expense">
                {formatCurrency(totalExpense, currencySymbol)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Recurring</span>
            </div>
            <span className="text-sm font-semibold text-foreground" data-testid="text-recurring-count">
              {recurringCount} items
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-breakdown">
        <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="heading-breakdown">
          Category Breakdown
        </h3>

        <div className="space-y-3">
          {categoryBreakdown.map(({ category, count, total }) => (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${getCategoryDotColor(category)}`} />
                  <span className="text-sm font-medium text-foreground">{category}</span>
                </div>
                <span className="text-sm font-semibold text-foreground" data-testid={`text-category-${category.toLowerCase()}-total`}>
                  {formatCurrency(total, currencySymbol)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-5" data-testid={`text-category-${category.toLowerCase()}-count`}>
                {count} transaction{count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
