import type {
  ParsedTransaction,
  TransactionSource,
  TransactionSourceType,
} from "@shared/schema";
import { CONTRACT_VERSION } from "@shared/version";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/transactionUtils";

type TransactionTemplate = Omit<
  ParsedTransaction,
  "date" | "currencySymbol" | "contractVersion" | "source"
> & {
    day: number;
    contractVersion?: ParsedTransaction["contractVersion"];
    currencySymbol?: ParsedTransaction["currencySymbol"];
    source?: TransactionSource;
    sourceName?: string;
    sourceType?: TransactionSourceType;
  };

const inferSourceType = (transaction: {
  category: ParsedTransaction["category"];
  description: string;
  sourceName?: string;
  sourceType?: TransactionSourceType;
}): TransactionSourceType => {
  if (transaction.sourceType) {
    return transaction.sourceType;
  }
  if (transaction.category === "Income") {
    return "broker";
  }
  const label = `${transaction.sourceName ?? ""} ${transaction.description}`.toLowerCase();
  if (
    label.includes("transfer") ||
    label.includes("savings") ||
    label.includes("account") ||
    label.includes("deposit")
  ) {
    return "account";
  }
  if (label.includes("insurance") || label.includes("investment") || label.includes("retirement")) {
    return "broker";
  }
  return "merchant";
};

const transactionTemplates: TransactionTemplate[] = [
  // Day 1 - Salary day with multiple income sources
  {
    id: "1",
    day: 1,
    description: "Monthly Salary",
    amount: 5000,
    category: "Income",
    sourceName: "Employer",
    isRecurring: true,
  },
  {
    id: "2",
    day: 1,
    description: "Bonus Payment",
    amount: 1500,
    category: "Income",
    sourceName: "Employer",
    isRecurring: false,
  },
  {
    id: "3",
    day: 1,
    description: "Rent Payment",
    amount: -1800,
    category: "Expense",
    sourceName: "Landlord",
    isRecurring: true,
  },

  // Day 3 - Shopping day
  {
    id: "4",
    day: 3,
    description: "Grocery Shopping",
    amount: -120.5,
    category: "Expense",
    sourceName: "Whole Foods",
    isRecurring: false,
  },
  {
    id: "5",
    day: 3,
    description: "Coffee Shop",
    amount: -8.5,
    category: "Expense",
    sourceName: "Starbucks",
    isRecurring: false,
  },
  {
    id: "6",
    day: 3,
    description: "Lunch",
    amount: -15.75,
    category: "Expense",
    sourceName: "Local Cafe",
    isRecurring: false,
  },

  // Day 5 - Subscriptions
  {
    id: "7",
    day: 5,
    description: "Netflix Subscription",
    amount: -15.99,
    category: "Expense",
    sourceName: "Netflix",
    isRecurring: true,
  },
  {
    id: "8",
    day: 5,
    description: "Spotify Premium",
    amount: -9.99,
    category: "Expense",
    sourceName: "Spotify",
    isRecurring: true,
  },
  {
    id: "9",
    day: 5,
    description: "Adobe Creative Cloud",
    amount: -52.99,
    category: "Expense",
    sourceName: "Adobe",
    isRecurring: true,
  },

  // Day 7 - Utilities day
  {
    id: "10",
    day: 7,
    description: "Electric Bill",
    amount: -85.3,
    category: "Expense",
    sourceName: "Utility Co",
    isRecurring: true,
  },
  {
    id: "11",
    day: 7,
    description: "Internet Bill",
    amount: -65,
    category: "Expense",
    sourceName: "ISP Provider",
    isRecurring: true,
  },
  {
    id: "12",
    day: 7,
    description: "Water Bill",
    amount: -42.5,
    category: "Expense",
    sourceName: "Water Department",
    isRecurring: true,
  },

  // Day 10 - Freelance income
  {
    id: "13",
    day: 10,
    description: "Freelance Project",
    amount: 1200,
    category: "Income",
    sourceName: "Client A",
    isRecurring: false,
  },
  {
    id: "14",
    day: 10,
    description: "Consulting Fee",
    amount: 800,
    category: "Income",
    sourceName: "Client B",
    isRecurring: false,
  },
  {
    id: "15",
    day: 10,
    description: "Gas Station",
    amount: -55,
    category: "Expense",
    sourceName: "Shell",
    isRecurring: false,
  },

  // Day 12 - Mixed day
  {
    id: "16",
    day: 12,
    description: "Investment Dividend",
    amount: 250,
    category: "Income",
    sourceName: "Vanguard",
    isRecurring: false,
  },
  {
    id: "17",
    day: 12,
    description: "Pharmacy",
    amount: -32.4,
    category: "Expense",
    sourceName: "CVS",
    isRecurring: false,
  },
  {
    id: "18",
    day: 12,
    description: "Grocery Shopping",
    amount: -95.6,
    category: "Expense",
    sourceName: "Trader Joe's",
    isRecurring: false,
  },

  // Day 15 - Savings and transfers
  {
    id: "19",
    day: 15,
    description: "Transfer to Savings",
    amount: -500,
    category: "Expense",
    sourceName: "Bank Transfer",
    isRecurring: true,
  },
  {
    id: "20",
    day: 15,
    description: "Investment Contribution",
    amount: -1000,
    category: "Expense",
    sourceName: "Retirement Account",
    isRecurring: true,
  },
  {
    id: "21",
    day: 15,
    description: "Gym Membership",
    amount: -49.99,
    category: "Expense",
    sourceName: "FitLife Gym",
    isRecurring: true,
  },

  // Day 18 - Weekend activities
  {
    id: "22",
    day: 18,
    description: "Restaurant Dinner",
    amount: -75.25,
    category: "Expense",
    sourceName: "Local Restaurant",
    isRecurring: false,
  },
  {
    id: "23",
    day: 18,
    description: "Movie Tickets",
    amount: -28,
    category: "Expense",
    sourceName: "Cinema",
    isRecurring: false,
  },
  {
    id: "24",
    day: 18,
    description: "Parking",
    amount: -12,
    category: "Expense",
    sourceName: "Parking Garage",
    isRecurring: false,
  },

  // Day 20 - Shopping day
  {
    id: "25",
    day: 20,
    description: "Online Shopping",
    amount: -145.8,
    category: "Expense",
    sourceName: "Amazon",
    isRecurring: false,
  },
  {
    id: "26",
    day: 20,
    description: "Clothing Store",
    amount: -89.99,
    category: "Expense",
    sourceName: "H&M",
    isRecurring: false,
  },
  {
    id: "27",
    day: 20,
    description: "Side Gig Payment",
    amount: 300,
    category: "Income",
    sourceName: "Gig Platform",
    isRecurring: false,
  },

  // Day 22 - Insurance and bills
  {
    id: "28",
    day: 22,
    description: "Car Insurance",
    amount: -125,
    category: "Expense",
    sourceName: "Insurance Co",
    isRecurring: true,
  },
  {
    id: "29",
    day: 22,
    description: "Phone Bill",
    amount: -75,
    category: "Expense",
    sourceName: "Mobile Provider",
    isRecurring: true,
  },
  {
    id: "30",
    day: 22,
    description: "Grocery Shopping",
    amount: -110.3,
    category: "Expense",
    sourceName: "Whole Foods",
    isRecurring: false,
  },

  // Day 25 - Mixed transactions
  {
    id: "31",
    day: 25,
    description: "Cashback Reward",
    amount: 45.5,
    category: "Income",
    sourceName: "Credit Card",
    isRecurring: false,
  },
  {
    id: "32",
    day: 25,
    description: "Gas Station",
    amount: -60,
    category: "Expense",
    sourceName: "Chevron",
    isRecurring: false,
  },
  {
    id: "33",
    day: 25,
    description: "Coffee Shop",
    amount: -6.5,
    category: "Expense",
    sourceName: "Local Cafe",
    isRecurring: false,
  },
  {
    id: "34",
    day: 25,
    description: "Lunch",
    amount: -18.75,
    category: "Expense",
    sourceName: "Restaurant",
    isRecurring: false,
  },

  // Day 28 - End of month
  {
    id: "35",
    day: 28,
    description: "Freelance Invoice",
    amount: 950,
    category: "Income",
    sourceName: "Client C",
    isRecurring: false,
  },
  {
    id: "36",
    day: 28,
    description: "Credit Card Payment",
    amount: -850,
    category: "Expense",
    sourceName: "Bank",
    isRecurring: true,
  },
  {
    id: "37",
    day: 28,
    description: "Grocery Shopping",
    amount: -88.45,
    category: "Expense",
    sourceName: "Safeway",
    isRecurring: false,
  },

  // Additional scattered transactions for variety
  {
    id: "38",
    day: 2,
    description: "Coffee",
    amount: -5.25,
    category: "Expense",
    sourceName: "Starbucks",
    isRecurring: false,
  },
  {
    id: "39",
    day: 4,
    description: "Uber Ride",
    amount: -22.5,
    category: "Expense",
    sourceName: "Uber",
    isRecurring: false,
  },
  {
    id: "40",
    day: 8,
    description: "Lunch",
    amount: -14.5,
    category: "Expense",
    sourceName: "Food Truck",
    isRecurring: false,
  },
  {
    id: "41",
    day: 11,
    description: "Book Purchase",
    amount: -24.99,
    category: "Expense",
    sourceName: "Bookstore",
    isRecurring: false,
  },
  {
    id: "42",
    day: 14,
    description: "Pet Supplies",
    amount: -67.8,
    category: "Expense",
    sourceName: "Pet Store",
    isRecurring: false,
  },
  {
    id: "43",
    day: 16,
    description: "Interest Income",
    amount: 12.5,
    category: "Income",
    sourceName: "Savings Account",
    isRecurring: true,
  },
  {
    id: "44",
    day: 19,
    description: "Hair Salon",
    amount: -55,
    category: "Expense",
    sourceName: "Beauty Salon",
    isRecurring: false,
  },
  {
    id: "45",
    day: 23,
    description: "Online Course",
    amount: -99,
    category: "Expense",
    sourceName: "Udemy",
    isRecurring: false,
  },
  {
    id: "46",
    day: 26,
    description: "Refund",
    amount: 35.99,
    category: "Income",
    sourceName: "Amazon",
    isRecurring: false,
  },
  {
    id: "47",
    day: 27,
    description: "Doctor Visit",
    amount: -45,
    category: "Expense",
    sourceName: "Medical Center",
    isRecurring: false,
  },

  // Day 18 - High-volume weekend snapshot (10+ transactions)
  {
    id: "48",
    day: 18,
    description: "Morning Pilates Class",
    amount: -22,
    category: "Expense",
    sourceName: "Studio Flex",
    isRecurring: false,
  },
  {
    id: "49",
    day: 18,
    description: "Farmer's Market Produce",
    amount: -34.75,
    category: "Expense",
    sourceName: "Farm Fresh Collective",
    isRecurring: false,
  },
  {
    id: "50",
    day: 18,
    description: "Brunch with Friends",
    amount: -48.5,
    category: "Expense",
    sourceName: "Sunny Side Bistro",
    isRecurring: false,
  },
  {
    id: "51",
    day: 18,
    description: "Bookstore Finds",
    amount: -27.6,
    category: "Expense",
    sourceName: "Page Turner Books",
    isRecurring: false,
  },
  {
    id: "52",
    day: 18,
    description: "Coffee Refuel",
    amount: -7.8,
    category: "Expense",
    sourceName: "Corner Roasters",
    isRecurring: false,
  },
  {
    id: "53",
    day: 18,
    description: "Arcade Tokens",
    amount: -18,
    category: "Expense",
    sourceName: "Retro Arcade",
    isRecurring: false,
  },
  {
    id: "54",
    day: 18,
    description: "Rideshare Home",
    amount: -19.5,
    category: "Expense",
    sourceName: "Lyft",
    isRecurring: false,
  },
  {
    id: "55",
    day: 18,
    description: "Late-night Pizza",
    amount: -14.25,
    category: "Expense",
    sourceName: "Downtown Slice",
    isRecurring: false,
  },

  // Day 25 - Statement cycle surge (10+ transactions)
  {
    id: "56",
    day: 25,
    description: "Micro-investment Auto-Deposit",
    amount: -25,
    category: "Expense",
    sourceName: "Acorns",
    isRecurring: true,
  },
  {
    id: "57",
    day: 25,
    description: "Ride Share",
    amount: -16.4,
    category: "Expense",
    sourceName: "Uber",
    isRecurring: false,
  },
  {
    id: "58",
    day: 25,
    description: "Coworking Day Pass",
    amount: -35,
    category: "Expense",
    sourceName: "WorkHub",
    isRecurring: false,
  },
  {
    id: "59",
    day: 25,
    description: "Client Reimbursement",
    amount: 85,
    category: "Income",
    sourceName: "Consulting Client",
    isRecurring: false,
  },
  {
    id: "60",
    day: 25,
    description: "Office Supplies",
    amount: -27.9,
    category: "Expense",
    sourceName: "Staples",
    isRecurring: false,
  },
  {
    id: "61",
    day: 25,
    description: "Team Coffee Run",
    amount: -14.1,
    category: "Expense",
    sourceName: "Blue Bottle",
    isRecurring: false,
  },
  {
    id: "62",
    day: 25,
    description: "Takeout Dinner",
    amount: -24.75,
    category: "Expense",
    sourceName: "Thai Express",
    isRecurring: false,
  },
  {
    id: "63",
    day: 25,
    description: "Late-night Snack",
    amount: -8.2,
    category: "Expense",
    sourceName: "Bodega",
    isRecurring: false,
  },
];

// todo: remove mock functionality
export const generateDemoData = (): ParsedTransaction[] => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthsToGenerate = 4;

  const transactions = Array.from({ length: monthsToGenerate }, (_, offset) => {
    const monthDate = new Date(currentYear, currentMonth - offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthIdentifier = `${year}-${String(month + 1).padStart(2, "0")}`;

    return transactionTemplates.map(({ day, ...template }) => ({
      ...template,
      id: `${template.id}-${monthIdentifier}`,
      date: new Date(year, month, day),
    }));
  })
    .flat()
    .map((transaction) => {
      const { source, sourceName, sourceType, ...rest } = transaction;

      const base = {
        ...rest,
        currencySymbol: transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL,
        contractVersion: transaction.contractVersion ?? CONTRACT_VERSION,
      } as Omit<ParsedTransaction, "source">;

      if (source) {
        return { ...base, source };
      }

      const resolvedName = (sourceName ?? rest.description).trim();
      const inferredType =
        sourceType ??
        inferSourceType({
          category: rest.category,
          description: rest.description,
          sourceName: resolvedName,
          sourceType,
        });

      return {
        ...base,
        source: {
          name: resolvedName || rest.description,
          type: inferredType,
        },
      };
    });

  return transactions as ParsedTransaction[];
};
