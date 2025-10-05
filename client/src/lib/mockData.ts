import type { ParsedTransaction } from "@shared/schema";

//todo: remove mock functionality
export const generateDemoData = (): ParsedTransaction[] => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const transactions: ParsedTransaction[] = [
    {
      id: "1",
      date: new Date(currentYear, currentMonth, 1),
      description: "Monthly Salary",
      amount: 5000,
      category: "Income",
      broker: "Employer",
      isRecurring: true,
    },
    {
      id: "2",
      date: new Date(currentYear, currentMonth, 3),
      description: "Grocery Shopping",
      amount: -120.5,
      category: "Expense",
      broker: "Whole Foods",
      isRecurring: false,
    },
    {
      id: "3",
      date: new Date(currentYear, currentMonth, 5),
      description: "Netflix Subscription",
      amount: -15.99,
      category: "Expense",
      broker: "Netflix",
      isRecurring: true,
    },
    {
      id: "4",
      date: new Date(currentYear, currentMonth, 7),
      description: "Spotify Premium",
      amount: -9.99,
      category: "Expense",
      broker: "Spotify",
      isRecurring: true,
    },
    {
      id: "5",
      date: new Date(currentYear, currentMonth, 10),
      description: "Freelance Project",
      amount: 1200,
      category: "Income",
      broker: "Client A",
      isRecurring: false,
    },
    {
      id: "6",
      date: new Date(currentYear, currentMonth, 12),
      description: "Electric Bill",
      amount: -85.3,
      category: "Expense",
      broker: "Utility Co",
      isRecurring: true,
    },
    {
      id: "7",
      date: new Date(currentYear, currentMonth, 15),
      description: "Transfer to Savings",
      amount: -500,
      category: "Transfer",
      broker: "Bank Transfer",
      isRecurring: true,
    },
    {
      id: "8",
      date: new Date(currentYear, currentMonth, 18),
      description: "Restaurant Dinner",
      amount: -75.25,
      category: "Expense",
      broker: "Local Restaurant",
      isRecurring: false,
    },
    {
      id: "9",
      date: new Date(currentYear, currentMonth, 20),
      description: "Gas Station",
      amount: -55,
      category: "Expense",
      broker: "Shell",
      isRecurring: false,
    },
    {
      id: "10",
      date: new Date(currentYear, currentMonth, 22),
      description: "Investment Dividend",
      amount: 250,
      category: "Income",
      broker: "Vanguard",
      isRecurring: false,
    },
    {
      id: "11",
      date: new Date(currentYear, currentMonth, 25),
      description: "Gym Membership",
      amount: -49.99,
      category: "Expense",
      broker: "FitLife Gym",
      isRecurring: true,
    },
    {
      id: "12",
      date: new Date(currentYear, currentMonth, 28),
      description: "Online Shopping",
      amount: -145.8,
      category: "Expense",
      broker: "Amazon",
      isRecurring: false,
    },
  ];

  return transactions;
};
