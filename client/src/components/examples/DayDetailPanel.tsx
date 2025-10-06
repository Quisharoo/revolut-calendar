import DayDetailPanel from "../DayDetailPanel";

export default function DayDetailPanelExample() {
  const mockTransactions = [
    {
      id: "1",
      date: new Date(),
      description: "Monthly Salary",
      amount: 5000,
      category: "Income" as const,
      broker: "Employer",
      isRecurring: true,
    },
    {
      id: "2",
      date: new Date(),
      description: "Netflix Subscription",
      amount: -15.99,
      category: "Expense" as const,
      broker: "Netflix",
      isRecurring: true,
    },
    {
      id: "3",
      date: new Date(),
      description: "Grocery Shopping",
      amount: -120.5,
      category: "Expense" as const,
      broker: "Whole Foods",
      isRecurring: false,
    },
  ];

  return (
    <div className="h-screen bg-background">
      <DayDetailPanel
        date={new Date()}
        transactions={mockTransactions}
        onClose={() => console.log("Close panel")}
      />
    </div>
  );
}
