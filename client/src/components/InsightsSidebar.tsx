import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { ParsedTransaction, TransactionCategory } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCategoryDotColor,
  formatCurrency,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";
import {
  BUDGET_CATEGORIES,
  type BudgetProgress,
  type MonthBudgets,
} from "@/lib/budgetUtils";
import { TrendingUp, TrendingDown, Repeat } from "lucide-react";

const formatAbsoluteCurrency = (value: number, currencySymbol: string) => {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  return `${currencySymbol}${safeValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface InsightsSidebarProps {
  transactions: ParsedTransaction[];
  currentDate: Date;
  budgets: MonthBudgets;
  budgetProgress: Record<TransactionCategory, BudgetProgress>;
  onBudgetsChange: (next: MonthBudgets) => void;
  onResetBudgets: () => void;
}

interface BudgetModalProps {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  budgets: MonthBudgets;
  currencySymbol: string;
  monthLabel: string;
  onSubmit: (next: MonthBudgets) => void;
  onReset: () => void;
}

const BudgetModal = ({
  open,
  onOpenChange,
  budgets,
  currencySymbol,
  monthLabel,
  onSubmit,
  onReset,
}: BudgetModalProps) => {
  const [formValues, setFormValues] = useState<Record<TransactionCategory, string>>({
    Income: budgets.Income ? String(budgets.Income) : "",
    Expense: budgets.Expense ? String(budgets.Expense) : "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues({
      Income: budgets.Income ? String(budgets.Income) : "",
      Expense: budgets.Expense ? String(budgets.Expense) : "",
    });
  }, [open, budgets.Income, budgets.Expense]);

  const handleInputChange = (category: TransactionCategory) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormValues((previous) => ({
      ...previous,
      [category]: event.target.value,
    }));
  };

  const parseBudgetInput = (value: string): number | null => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.round(Math.abs(parsed) * 100) / 100;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextBudgets: MonthBudgets = {
      Income: parseBudgetInput(formValues.Income),
      Expense: parseBudgetInput(formValues.Expense),
    };
    onSubmit(nextBudgets);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    setFormValues({ Income: "", Expense: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader>
            <DialogTitle data-testid="dialog-budget-title">{monthLabel} budgets</DialogTitle>
            <DialogDescription>
              Budgets are stored locally per month. Updates will apply to this device only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {BUDGET_CATEGORIES.map((category) => (
              <div key={category} className="space-y-2">
                <Label htmlFor={`budget-${category}`} className="text-sm font-medium">
                  {category} limit
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{currencySymbol}</span>
                  <Input
                    id={`budget-${category}`}
                    data-testid={`input-budget-${category.toLowerCase()}`}
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues[category]}
                    onChange={handleInputChange(category)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-budgets"
            >
              Clear budgets
            </Button>
            <Button type="submit" data-testid="button-save-budgets">
              Save budgets
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function InsightsSidebar({
  transactions,
  currentDate,
  budgets,
  budgetProgress,
  onBudgetsChange,
  onResetBudgets,
}: InsightsSidebarProps) {
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);

  const monthName = useMemo(
    () =>
      currentDate.toLocaleDateString("en-US", {
        month: "long",
      }),
    [currentDate]
  );

  const monthLabelWithYear = useMemo(
    () =>
      currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [currentDate]
  );

  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.category === "Income"),
    [transactions]
  );
  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.category === "Expense"),
    [transactions]
  );

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalIncome + totalExpense;
  const recurringCount = transactions.filter((t) => t.isRecurring).length;
  const currencySymbol = transactions[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

  const categoryBreakdown = [
    {
      category: "Income" as const,
      count: incomeTransactions.length,
      total: totalIncome,
      actual: totalIncome,
    },
    {
      category: "Expense" as const,
      count: expenseTransactions.length,
      total: totalExpense,
      actual: Math.abs(totalExpense),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6" data-testid="card-summary">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground" data-testid="heading-month">
            {monthName} Summary
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Net Total</p>
            <p
              className={`text-3xl font-bold ${
                netTotal >= 0 ? "text-primary" : "text-destructive"
              }`}
              data-testid="text-net-total"
            >
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
              <span
                className="text-sm font-semibold text-primary"
                data-testid="text-total-income"
              >
                {formatCurrency(totalIncome, currencySymbol)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Expenses</span>
              </div>
              <span
                className="text-sm font-semibold text-destructive"
                data-testid="text-total-expense"
              >
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
            <span
              className="text-sm font-semibold text-foreground"
              data-testid="text-recurring-count"
            >
              {recurringCount} items
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-breakdown">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground" data-testid="heading-breakdown">
            Category Breakdown
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBudgetModalOpen(true)}
            data-testid="button-edit-budgets"
          >
            Edit budgets
          </Button>
        </div>

        <div className="space-y-4">
          {categoryBreakdown.map(({ category, count, total, actual }) => {
            const categoryKey = category as TransactionCategory;
            const progress = budgetProgress[categoryKey];
            const hasBudget = progress?.limit !== null;

            return (
              <div key={category} className="space-y-1.5" data-testid={`section-category-${category.toLowerCase()}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${getCategoryDotColor(category)}`}
                    />
                    <span className="text-sm font-medium text-foreground">{category}</span>
                  </div>
                  <span
                    className="text-sm font-semibold text-foreground"
                    data-testid={`text-category-${category.toLowerCase()}-total`}
                  >
                    {formatCurrency(total, currencySymbol)}
                  </span>
                </div>
                <p
                  className="text-xs text-muted-foreground pl-5"
                  data-testid={`text-category-${category.toLowerCase()}-count`}
                >
                  {count} transaction{count !== 1 ? "s" : ""}
                </p>

                <div className="pl-5 text-xs">
                  {hasBudget ? (
                    <div className="space-y-1.5" data-testid={`budget-${category.toLowerCase()}-details`}>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                        <span>Used</span>
                        <span>{formatAbsoluteCurrency(progress.limit ?? 0, currencySymbol)} limit</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={progress.limit ?? 0} aria-valuenow={progress.actual}>
                        <div
                          className={`h-2 rounded-full ${
                            category === "Income" ? "bg-primary" : "bg-destructive/80"
                          } transition-all`}
                          style={{ width: `${Math.min(progress.progress * 100, 100)}%` }}
                          data-testid={`budget-${category.toLowerCase()}-progress`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {formatAbsoluteCurrency(actual, currencySymbol)} used
                        </span>
                        {progress.isOverBudget ? (
                          <span className="font-medium text-destructive">
                            Over by {formatAbsoluteCurrency(progress.overage, currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatAbsoluteCurrency(progress.remaining ?? 0, currencySymbol)} left
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid={`budget-${category.toLowerCase()}-status`}
                    >
                      No budget set for {category.toLowerCase()}.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <BudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        budgets={budgets}
        currencySymbol={currencySymbol}
        monthLabel={monthLabelWithYear}
        onSubmit={onBudgetsChange}
        onReset={onResetBudgets}
      />
    </div>
  );
}
