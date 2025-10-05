import type { ParsedTransaction } from "@shared/schema";

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "text-primary";
    case "Expense":
      return "text-destructive";
    case "Transfer":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
};

export const getCategoryBgColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "bg-primary/10";
    case "Expense":
      return "bg-destructive/10";
    case "Transfer":
      return "bg-muted/50";
    default:
      return "bg-accent";
  }
};

export const getCategoryDotColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "bg-primary";
    case "Expense":
      return "bg-destructive";
    case "Transfer":
      return "bg-muted-foreground";
    default:
      return "bg-foreground";
  }
};

export const formatCurrency = (amount: number): string => {
  const abs = Math.abs(amount);
  return amount >= 0 ? `+$${abs.toFixed(2)}` : `-$${abs.toFixed(2)}`;
};

export const groupTransactionsByDate = (
  transactions: ParsedTransaction[]
): Map<string, ParsedTransaction[]> => {
  const grouped = new Map<string, ParsedTransaction[]>();

  transactions.forEach((transaction) => {
    const dateKey = transaction.date.toISOString().split("T")[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(transaction);
  });

  return grouped;
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month, -startDay + i + 1);
    days.push(prevDate);
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
};
