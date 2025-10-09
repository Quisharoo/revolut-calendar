import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  isProcessing?: boolean;
}

export default function UploadSection({
  onFileUpload,
  onLoadDemo,
  isProcessing = false,
}: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) {
      return;
    }
    setIsDragging(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isProcessing) {
        return;
      }
      setIsDragging(false);
      setError("");

      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileUpload(file);
        } else {
          setError("Please upload a CSV file");
        }
      }
    },
    [onFileUpload, isProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) {
        return;
      }
      setError("");
      const file = e.target.files?.[0];
      if (file) {
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileUpload(file);
        } else {
          setError("Please upload a CSV file");
        }
      }
    },
    [onFileUpload, isProcessing]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-2xl w-full p-8" data-testid="card-upload">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="heading-title">
            Transaction Calendar
          </h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Visualize your financial transactions in a clean monthly calendar
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30"
          } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-1">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse from your computer
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              ref={inputRef}
              data-testid="input-file"
              title="Upload CSV file"
              placeholder="Select a CSV file"
            />
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
              data-testid="button-browse"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isProcessing ? "Processing..." : "Browse Files"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2" data-testid="alert-error">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadDemo}
            className="w-full sm:w-auto"
            disabled={isProcessing}
            data-testid="button-load-demo"
          >
            Load Demo Data
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Preview the calendar with sample transactions
          </p>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">CSV Format:</strong> Your file
            should include columns for date, description, amount, category, and
            optionally broker. Categories can be: Income, Expense, or Transfer.
          </p>
          {isProcessing && (
            <p className="text-xs text-muted-foreground mt-3">
              Parsing CSV and preparing transactions…
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
