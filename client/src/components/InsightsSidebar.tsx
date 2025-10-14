import type { ParsedTransaction } from "@shared/schema";
import type { CategoryAnomaly } from "@/lib/anomalyDetection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getCategoryDotColor,
  getCategoryColor,
  formatCurrency,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";
import { TrendingUp, TrendingDown, Repeat } from "lucide-react";

interface InsightsSidebarProps {
  transactions: ParsedTransaction[];
  currentMonth: string;
  surprises: CategoryAnomaly[];
  isSurprisesOnly: boolean;
  onToggleSurprises: (nextValue: boolean) => void;
}

export default function InsightsSidebar({
  transactions,
  currentMonth,
  surprises,
  isSurprisesOnly,
  onToggleSurprises,
}: InsightsSidebarProps) {
  const incomeTransactions = transactions.filter((t) => t.category === "Income");
  const expenseTransactions = transactions.filter((t) => t.category === "Expense");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const netTotal = totalIncome + totalExpense;

  const recurringCount = transactions.filter((t) => t.isRecurring).length;

  const currencySymbol =
    transactions[0]?.currencySymbol ??
    surprises[0]?.transaction.currencySymbol ??
    DEFAULT_CURRENCY_SYMBOL;

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

      <Card className="p-6" data-testid="card-surprises">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold text-foreground" data-testid="heading-surprises">
            Surprises
          </h3>
          <Button
            size="sm"
            variant={isSurprisesOnly ? "default" : "outline"}
            onClick={() => onToggleSurprises(!isSurprisesOnly)}
            data-testid="button-toggle-surprises"
          >
            {isSurprisesOnly ? "Viewing surprises" : "Show surprises"}
          </Button>
        </div>
        {surprises.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-no-surprises"
          >
            No outliers detected for this month.
          </p>
        ) : (
          <div className="space-y-4">
            {surprises.map((surprise) => {
              const transaction = surprise.transaction;
              const transactionCurrency =
                transaction.currencySymbol ?? currencySymbol;
              const formattedAmount = formatCurrency(
                transaction.amount,
                transactionCurrency
              );
              const difference = formatCurrency(
                transaction.amount - surprise.median,
                transactionCurrency
              );
              const formattedMedian = formatCurrency(
                surprise.median,
                transactionCurrency
              );
              const dateLabel = transaction.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"
                  data-testid={`item-surprise-${transaction.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dateLabel} • {transaction.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${getCategoryColor(transaction.category)} whitespace-nowrap`}
                    >
                      {formattedAmount}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      Δ {difference}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      Median {formattedMedian}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {surprise.score.toFixed(1)}× MAD
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
