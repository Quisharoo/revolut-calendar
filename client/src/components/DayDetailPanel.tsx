import type { ParsedTransaction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import {
  formatCurrency,
  getCategoryColor,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";

interface DayDetailPanelProps {
  date: Date;
  transactions: ParsedTransaction[];
  onClose: () => void;
}

export default function DayDetailPanel({
  date,
  transactions,
  onClose,
}: DayDetailPanelProps) {
  // Split transactions into income/expense while keeping transfers separate
  const incomeTransactions = transactions.filter(
    (t) => t.category !== "Transfer" && t.amount > 0
  );
  const expenseTransactions = transactions.filter(
    (t) => t.category !== "Transfer" && t.amount < 0
  );
  const transferTransactions = transactions.filter(
    (t) => t.category === "Transfer"
  );

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalTransfer = transferTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const currencySymbol = transactions[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-foreground" data-testid="heading-selected-date">
            {formattedDate}
          </h2>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-transaction-summary">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-panel"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {incomeTransactions.length > 0 && (
          <div data-testid="section-income">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Income</h3>
              </div>
              <span className="text-lg font-bold text-primary" data-testid="text-income-total">
                {formatCurrency(totalIncome, currencySymbol)}
              </span>
            </div>
            <Card className="p-4">
              <div className="space-y-3">
                {incomeTransactions.map((transaction) => {
                  const sourceLabel = transaction.source?.name ?? transaction.broker;
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 pb-3 last:pb-0 border-b border-border last:border-0"
                      data-testid={`item-income-${transaction.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        {sourceLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sourceLabel}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${getCategoryColor(transaction.category)} whitespace-nowrap`}>
                        {formatCurrency(transaction.amount, transaction.currencySymbol ?? currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {incomeTransactions.length > 0 &&
          (expenseTransactions.length > 0 || transferTransactions.length > 0) && (
            <Separator />
          )}

        {expenseTransactions.length > 0 && (
          <div data-testid="section-expense">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground">Expenses</h3>
              </div>
              <span className="text-lg font-bold text-destructive" data-testid="text-expense-total">
                {formatCurrency(totalExpense, currencySymbol)}
              </span>
            </div>
            <Card className="p-4">
              <div className="space-y-3">
                {expenseTransactions.map((transaction) => {
                  const sourceLabel = transaction.source?.name ?? transaction.broker;
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 pb-3 last:pb-0 border-b border-border last:border-0"
                      data-testid={`item-expense-${transaction.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        {sourceLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sourceLabel}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${getCategoryColor(transaction.category)} whitespace-nowrap`}>
                        {formatCurrency(transaction.amount, transaction.currencySymbol ?? currencySymbol)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {expenseTransactions.length > 0 && transferTransactions.length > 0 && (
          <Separator />
        )}

        {transferTransactions.length > 0 && (
          <div data-testid="section-transfer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">Transfers</h3>
              </div>
              <span
                className="text-lg font-bold text-muted-foreground"
                data-testid="text-transfer-total"
              >
                {formatCurrency(totalTransfer, currencySymbol)}
              </span>
            </div>
            <Card className="p-4">
              <div className="space-y-3">
                {transferTransactions.map((transaction) => {
                  const sourceLabel = transaction.source?.name ?? transaction.broker;
                  const amountColor =
                    transaction.amount >= 0 ? "text-primary" : "text-destructive";
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-4 pb-3 last:pb-0 border-b border-border last:border-0"
                      data-testid={`item-transfer-${transaction.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        {sourceLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sourceLabel}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-sm font-semibold whitespace-nowrap ${amountColor}`}
                      >
                        {formatCurrency(
                          transaction.amount,
                          transaction.currencySymbol ?? currencySymbol
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {transactions.length === 0 && (
          <div className="text-center py-12" data-testid="empty-state">
            <p className="text-muted-foreground">No transactions on this day</p>
          </div>
        )}
      </div>
    </div>
  );
}
