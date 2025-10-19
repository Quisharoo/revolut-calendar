import { useState } from "react";
import type { ParsedTransaction, RecurringSeries } from "@shared/schema";
import UploadSection from "@/components/UploadSection";
import ExportModal from "@/components/ExportModal";
import CalendarPage from "./calendar";
import { generateDemoData } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/use-export";
import { parseCsvInWorker, detectRecurringInWorker } from "@/lib/workers";
import { annotateTransactionsWithRecurrence } from "@/lib/recurrenceDetection";
import { ensureMinimumDuration } from "@/lib/utils";

const MIN_PROCESSING_DURATION_MS = 1100;

export default function Home() {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [series, setSeries] = useState<RecurringSeries[]>([]);
  const [hasData, setHasData] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState<Date | undefined>(undefined);
  const [processingMessage, setProcessingMessage] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { isGenerating, exportTransactions } = useExport();

  const hydrateRecurringState = async (
    parsed: ParsedTransaction[]
  ): Promise<{ transactions: ParsedTransaction[]; series: RecurringSeries[] }> => {
    const detection = await detectRecurringInWorker(parsed);
    const annotated = annotateTransactionsWithRecurrence(parsed, detection.series);
    return { transactions: annotated, series: detection.series };
  };

  const handleFileUpload = async (file: File) => {
    setProcessingMessage(`Parsing ${file.name} and preparing calendar…`);
    setIsImporting(true);
    try {
      const { transactions: annotated, series: detectedSeries } = await ensureMinimumDuration(
        (async () => {
          const parseResult = await parseCsvInWorker(file);
          if (!parseResult.ok) {
            const reason = parseResult.errors[0] ?? "Unable to parse the provided CSV file.";
            throw new Error(reason);
          }

          if (parseResult.transactions.length === 0) {
            throw new Error("No transactions were detected in the provided file.");
          }

          return hydrateRecurringState(parseResult.transactions);
        })(),
        MIN_PROCESSING_DURATION_MS
      );

      setTransactions(annotated);
      setSeries(detectedSeries);
      setHasData(true);
      toast({
        title: "Transactions imported",
        description: `${annotated.length} items loaded from ${file.name}.`,
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
      setProcessingMessage(undefined);
    }
  };

  const handleLoadDemo = async () => {
    setProcessingMessage("Loading sample transactions…");
    setIsImporting(true);
    try {
      const demoData = generateDemoData();
      const { transactions: annotated, series: detectedSeries } = await ensureMinimumDuration(
        hydrateRecurringState(demoData),
        MIN_PROCESSING_DURATION_MS
      );
      setTransactions(annotated);
      setSeries(detectedSeries);
      setHasData(true);
      toast({
        title: "Demo data loaded",
        description: `${annotated.length} sample transactions ready to explore.`,
      });
    } catch (error) {
      console.error("Failed to load demo data", error);
      toast({
        variant: "destructive",
        title: "Demo load failed",
        description: "Unable to prepare the demo transactions.",
      });
    } finally {
      setIsImporting(false);
      setProcessingMessage(undefined);
    }
  };

  const handleExport = async (selectedIds: string[], monthDate: Date) => {
    const result = await exportTransactions(series, selectedIds, monthDate);
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
        processingMessage={processingMessage}
      />
    );
  }

  return (
    <>
      <CalendarPage
        transactions={transactions}
        onRequestExport={(monthDate) => {
          setExportMonth(monthDate);
          setExportOpen(true);
        }}
      />
      <ExportModal
        series={series}
        isOpen={isExportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        isGenerating={isGenerating}
        monthDate={exportMonth}
      />
    </>
  );
}
