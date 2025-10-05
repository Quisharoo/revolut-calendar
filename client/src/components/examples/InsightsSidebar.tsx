import InsightsSidebar from "../InsightsSidebar";
import { generateDemoData } from "@/lib/mockData";

export default function InsightsSidebarExample() {
  const transactions = generateDemoData();
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="p-4 bg-background">
      <div className="max-w-sm">
        <InsightsSidebar transactions={transactions} currentMonth={currentMonth} />
      </div>
    </div>
  );
}
