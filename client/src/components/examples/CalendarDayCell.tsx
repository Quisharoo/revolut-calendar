import CalendarDayCell from "../CalendarDayCell";

export default function CalendarDayCellExample() {
  const mockTransactions = [
    {
      id: "1",
      date: new Date(),
      description: "Netflix",
      amount: -15.99,
      category: "Expense" as const,
      broker: "Netflix",
      isRecurring: true,
    },
    {
      id: "2",
      date: new Date(),
      description: "Salary",
      amount: 5000,
      category: "Income" as const,
      broker: "Employer",
      isRecurring: true,
    },
  ];

  return (
    <div className="p-4 bg-background">
      <div className="max-w-xs">
        <CalendarDayCell
          date={new Date()}
          transactions={mockTransactions}
          isCurrentMonth={true}
        />
      </div>
    </div>
  );
}
