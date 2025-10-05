import CalendarGrid from "../CalendarGrid";
import { generateDemoData } from "@/lib/mockData";

export default function CalendarGridExample() {
  const transactions = generateDemoData();

  return (
    <div className="p-4 bg-background">
      <CalendarGrid currentDate={new Date()} transactions={transactions} />
    </div>
  );
}
