import type { ParsedTransaction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCategoryDotColor, formatCurrency } from "@/lib/transactionUtils";
import { TrendingUp, TrendingDown, Repeat, ArrowRightLeft } from "lucide-react";

interface InsightsSidebarProps {
  transactions: ParsedTransaction[];
  currentMonth: string;
}

export default function InsightsSidebar({
  transactions,
  currentMonth,
}: InsightsSidebarProps) {
  const totalIncome = transactions
    .filter((t) => t.category === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter((t) => t.category === "Expense")
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const totalTransfer = Math.abs(
    transactions
      .filter((t) => t.category === "Transfer")
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const netTotal = totalIncome - totalExpense - totalTransfer;

  const recurringCount = transactions.filter((t) => t.isRecurring).length;

  const categoryBreakdown = [
    { category: "Income", count: transactions.filter((t) => t.category === "Income").length, total: totalIncome },
    { category: "Expense", count: transactions.filter((t) => t.category === "Expense").length, total: totalExpense },
    { category: "Transfer", count: transactions.filter((t) => t.category === "Transfer").length, total: totalTransfer },
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
              {formatCurrency(netTotal)}
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
                {formatCurrency(totalIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <span className="text-sm font-semibold text-destructive" data-testid="text-total-expense">
                -{formatCurrency(totalExpense)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Transfers</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground" data-testid="text-total-transfer">
                -{formatCurrency(totalTransfer)}
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
                  {category === "Income" ? formatCurrency(total) : `-${formatCurrency(total)}`}
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
