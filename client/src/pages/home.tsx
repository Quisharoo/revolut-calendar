import { useState } from "react";
import type { ParsedTransaction } from "@shared/schema";
import UploadSection from "@/components/UploadSection";
import CalendarPage from "./calendar";
import { generateDemoData } from "@/lib/mockData";
import { loadRevolutCsv } from "@/lib/revolutParser";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [hasData, setHasData] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    try {
      const parsedTransactions = await loadRevolutCsv(file);
      if (parsedTransactions.length === 0) {
        throw new Error("No transactions were detected in the provided file.");
      }

      setTransactions(parsedTransactions);
      setHasData(true);
      toast({
        title: "Transactions imported",
        description: `${parsedTransactions.length} items loaded from ${file.name}.`,
      });
    } catch (error) {
      console.error("Failed to import CSV", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process the selected file.";
      toast({
        variant: "destructive",
        title: "Import failed",
        description: message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadDemo = () => {
    console.log("Loading demo data");
    const demoData = generateDemoData();
    setTransactions(demoData);
    setHasData(true);
    toast({
      title: "Demo data loaded",
      description: `${demoData.length} sample transactions ready to explore.`,
    });
  };

  if (!hasData) {
    return (
      <UploadSection
        onFileUpload={handleFileUpload}
        onLoadDemo={handleLoadDemo}
        isProcessing={isImporting}
      />
    );
  }

  return <CalendarPage transactions={transactions} />;
}
