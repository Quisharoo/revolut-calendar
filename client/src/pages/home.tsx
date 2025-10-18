import { useState } from "react";
import type { ParsedTransaction } from "@shared/schema";
import UploadSection from "@/components/UploadSection";
import ExportModal from "@/components/ExportModal";
import CalendarPage from "./calendar";
import { generateDemoData } from "@/lib/mockData";
import { loadRevolutCsv } from "@/lib/revolutParser";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/use-export";

export default function Home() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [hasData, setHasData] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const { toast } = useToast();
  const { isGenerating, exportTransactions } = useExport();

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

  const handleExport = async (selectedIds: string[], monthDate: Date) => {
    const result = await exportTransactions(transactions, selectedIds, monthDate);
    if (result.success) {
      toast({ title: 'Calendar exported', description: result.fileName });
    } else {
      toast({ variant: 'destructive', title: 'Export failed', description: result.error ?? 'Unknown error' });
    }
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

  return (
    <>
      {/* Export Recurring Transactions button removed as duplicate flow */}
      <CalendarPage transactions={transactions} />
      <ExportModal
        transactions={transactions}
        isOpen={isExportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        isGenerating={isGenerating}
      />
    </>
  );
}
