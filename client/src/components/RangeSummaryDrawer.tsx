import type { ParsedTransaction } from "@shared/schema";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  type RangeSummary,
  type DateRange,
} from "@/lib/rangeSummary";
import { formatCurrency, getCategoryDotColor } from "@/lib/transactionUtils";
import { Copy, TrendingUp, TrendingDown, Layers, Star } from "lucide-react";

interface RangeSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: RangeSummary | null;
  range: DateRange | null;
  transactions: ParsedTransaction[];
  onCopyCsv: () => void;
}

const SectionLabel = ({ label }: { label: string }) => (
  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
    {label}
  </h3>
);

export default function RangeSummaryDrawer({
  open,
  onOpenChange,
  summary,
  range,
  transactions,
  onCopyCsv,
}: RangeSummaryDrawerProps) {
  const incomeCount = summary
    ? transactions.filter((transaction) => transaction.amount >= 0).length
    : 0;
  const expenseCount = summary
    ? transactions.filter((transaction) => transaction.amount < 0).length
    : 0;
  const largestTransactionSource = summary?.largestTransaction
    ? summary.largestTransaction.source?.name ?? ""
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] overflow-y-auto border-t border-border sm:h-auto sm:max-h-[80vh] sm:rounded-t-2xl sm:px-10"
      >
        <div className="flex flex-col gap-6 pt-2 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Range Summary
              </p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-range-label">
                {summary?.rangeLabel ?? "Select a range"}
              </p>
              {summary && (
                <p className="text-sm text-muted-foreground" data-testid="text-range-meta">
                  {summary.dayCount} day{summary.dayCount !== 1 ? "s" : ""}
                  {" · "}
                  {summary.transactionCount} transaction{summary.transactionCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyCsv}
              disabled={!summary || transactions.length === 0}
              data-testid="button-copy-range-csv"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy CSV
            </Button>
          </div>

          <Separator />

          {summary ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3" data-testid="section-range-totals">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <SectionLabel label="Net" />
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-xl font-semibold",
                      summary.netTotal >= 0 ? "text-primary" : "text-destructive"
                    )}
                    data-testid="text-range-net"
                  >
                    {formatCurrency(summary.netTotal, summary.currencySymbol)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCurrency(summary.dailyAverage, summary.currencySymbol)} per day
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <SectionLabel label="Income" />
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-primary" data-testid="text-range-income">
                    {formatCurrency(summary.totalIncome, summary.currencySymbol)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {incomeCount} transaction{incomeCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <SectionLabel label="Expenses" />
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-destructive" data-testid="text-range-expense">
                    {formatCurrency(summary.totalExpense, summary.currencySymbol)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2" data-testid="section-range-details">
                <div className="space-y-3">
                  <SectionLabel label="Top Merchants" />
                  {summary.topMerchants.length > 0 ? (
                    <ul className="space-y-2">
                      {summary.topMerchants.map((merchant) => (
                        <li
                          key={merchant.name}
                          className="flex items-center justify-between text-sm"
                          data-testid={`item-top-merchant-${merchant.name}`}
                        >
                          <span className="font-medium text-foreground truncate pr-3">
                            {merchant.name}
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              merchant.total >= 0 ? "text-primary" : "text-destructive"
                            )}
                          >
                            {formatCurrency(merchant.total, summary.currencySymbol)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No merchants in range.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <SectionLabel label="Top Categories" />
                  {summary.topCategories.length > 0 ? (
                    <ul className="space-y-2">
                      {summary.topCategories.map((category) => (
                        <li
                          key={category.category}
                          className="flex items-center justify-between text-sm"
                          data-testid={`item-top-category-${category.category}`}
                        >
                          <div className="flex items-center gap-2 truncate pr-3">
                            <span
                              className={cn(
                                "h-2.5 w-2.5 flex-none rounded-full",
                                getCategoryDotColor(category.category)
                              )}
                            />
                            <span className="font-medium text-foreground">
                              {category.category}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "font-semibold",
                              category.total >= 0 ? "text-primary" : "text-destructive"
                            )}
                          >
                            {formatCurrency(category.total, summary.currencySymbol)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No categories in range.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3" data-testid="section-range-largest">
                <SectionLabel label="Largest Transaction" />
                {summary.largestTransaction ? (
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {summary.largestTransaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary.largestTransaction.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                          summary.largestTransaction.amount >= 0
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        <Star className="h-3.5 w-3.5" />
                        {formatCurrency(
                          summary.largestTransaction.amount,
                          summary.currencySymbol
                        )}
                      </span>
                    </div>
                    {largestTransactionSource && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {largestTransactionSource}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions in range.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              {range ? "No transactions in this range." : "Select a date range to see insights."}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
