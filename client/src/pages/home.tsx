import { useState } from "react";
import type { ParsedTransaction } from "@shared/schema";
import UploadSection from "@/components/UploadSection";
import CalendarPage from "./calendar";
import { generateDemoData } from "@/lib/mockData";

export default function Home() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name);
    //todo: remove mock functionality - Parse CSV file here
    const demoData = generateDemoData();
    setTransactions(demoData);
    setHasData(true);
  };

  const handleLoadDemo = () => {
    console.log("Loading demo data");
    const demoData = generateDemoData();
    setTransactions(demoData);
    setHasData(true);
  };

  if (!hasData) {
    return (
      <UploadSection
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
      />
    );
  }

  return <CalendarPage transactions={transactions} />;
}
