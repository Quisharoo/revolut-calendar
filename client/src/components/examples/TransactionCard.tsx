import TransactionCard from "../TransactionCard";

export default function TransactionCardExample() {
  const mockTransaction = {
    id: "1",
    date: new Date(),
    description: "Netflix Subscription",
    amount: -15.99,
    category: "Expense" as const,
    broker: "Netflix",
    isRecurring: true,
  };

  return (
    <div className="p-4 bg-background">
      <div className="max-w-xs">
        <TransactionCard transaction={mockTransaction} />
      </div>
    </div>
  );
}
