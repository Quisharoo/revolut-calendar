import type { ParsedTransaction } from "@shared/schema";
import { getCategoryColor, getCategoryBgColor, formatCurrency } from "@/lib/transactionUtils";
import { RepeatIcon } from "lucide-react";

interface TransactionCardProps {
  transaction: ParsedTransaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  // Display transfers as Income or Expense in the UI based on amount sign
  // Transfer category still exists in schema but is hidden from users
  const displayCategory = transaction.category === "Transfer"
    ? (transaction.amount > 0 ? "Income" : "Expense")
    : transaction.category;
  
  const displayCategoryColor = transaction.category === "Transfer"
    ? (transaction.amount > 0 ? "text-primary" : "text-destructive")
    : getCategoryColor(transaction.category);
  
  const displayCategoryBgColor = transaction.category === "Transfer"
    ? (transaction.amount > 0 ? "bg-primary/10" : "bg-destructive/10")
    : getCategoryBgColor(transaction.category);

  return (
    <div
      className="group p-2 bg-card rounded-md border border-card-border hover-elevate transition-all cursor-pointer"
      data-testid={`card-transaction-${transaction.id}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {transaction.isRecurring && (
              <RepeatIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" data-testid="icon-recurring" />
            )}
            <p className="text-xs font-medium text-foreground truncate" data-testid="text-description">
              {transaction.description}
            </p>
          </div>
          {(transaction.source?.name || transaction.broker) && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5" data-testid="text-broker">
              {transaction.source?.name || transaction.broker}
            </p>
          )}
        </div>
        <div
          className={`text-xs font-semibold whitespace-nowrap ${displayCategoryColor}`}
          data-testid="text-amount"
        >
          {formatCurrency(transaction.amount)}
        </div>
      </div>
      <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1.5 ${displayCategoryBgColor} ${displayCategoryColor}`}
           data-testid="badge-category">
        {displayCategory}
      </div>
    </div>
  );
}
