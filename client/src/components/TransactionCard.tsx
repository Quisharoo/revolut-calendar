import type { ParsedTransaction } from "@shared/schema";
import { getCategoryColor, getCategoryBgColor, formatCurrency } from "@/lib/transactionUtils";
import { RepeatIcon } from "lucide-react";

interface TransactionCardProps {
  transaction: ParsedTransaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
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
          {transaction.broker && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5" data-testid="text-broker">
              {transaction.broker}
            </p>
          )}
        </div>
        <div
          className={`text-xs font-semibold whitespace-nowrap ${getCategoryColor(transaction.category)}`}
          data-testid="text-amount"
        >
          {formatCurrency(transaction.amount)}
        </div>
      </div>
      <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1.5 ${getCategoryBgColor(transaction.category)} ${getCategoryColor(transaction.category)}`}
           data-testid="badge-category">
        {transaction.category}
      </div>
    </div>
  );
}
