import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { CSV_ALLOWED_MIME_TYPES, MAX_CSV_FILE_BYTES } from "@shared/constants";
import { Spinner } from "@/components/ui/spinner";

const ACCEPTED_EXTENSIONS = [".csv"];
const ALLOWED_MIME_TYPES = new Set(
  CSV_ALLOWED_MIME_TYPES.map((mime) => mime.toLowerCase())
);

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const isAllowedMimeType = (type: string | undefined) =>
  type ? ALLOWED_MIME_TYPES.has(type.toLowerCase()) : false;

const hasAllowedExtension = (fileName: string) =>
  ACCEPTED_EXTENSIONS.some((extension) => fileName.toLowerCase().endsWith(extension));

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  isProcessing?: boolean;
  processingMessage?: string;
}

export default function UploadSection({
  onFileUpload,
  onLoadDemo,
  isProcessing = false,
  processingMessage,
}: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxFileSizeLabel = formatBytes(MAX_CSV_FILE_BYTES);
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      setFakeProgress(8);
      const intervalId = window.setInterval(() => {
        setFakeProgress((current) => {
          if (current >= 95) {
            return current;
          }

          const increment = Math.random() * 12;
          return Math.min(current + increment, 95);
        });
      }, 350);

      return () => {
        window.clearInterval(intervalId);
      };
    }

    if (fakeProgress === 0) {
      return;
    }

    setFakeProgress(100);
    const timeoutId = window.setTimeout(() => {
      setFakeProgress(0);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // fakeProgress is intentionally omitted to avoid re-running while animating down
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  const validateAndUpload = useCallback(
    (file: File) => {
      const mimeOk = isAllowedMimeType(file.type);
      const extensionOk = hasAllowedExtension(file.name);
      if (!mimeOk && !extensionOk) {
        setError("Please upload a CSV file");
        return;
      }

      if (file.size > MAX_CSV_FILE_BYTES) {
        setError(`CSV file is too large (max ${maxFileSizeLabel}).`);
        return;
      }

      setError("");
      onFileUpload(file);
    },
    [maxFileSizeLabel, onFileUpload]
  );

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
        validateAndUpload(file);
      }
    },
    [isProcessing, validateAndUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing) {
        return;
      }
      setError("");
      const file = e.target.files?.[0];
      if (file) {
        validateAndUpload(file);
      }
    },
    [isProcessing, validateAndUpload]
  );

  const processingIndicator = (
    <div
      className="flex w-full flex-col items-center gap-6"
      data-testid="processing-indicator"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="h-6 w-6" />
        <span className="text-center text-sm font-medium text-foreground">
          {processingMessage ?? "Preparing your calendar…"}
        </span>
        <span className="max-w-xs text-center text-xs">
          Sit tight while we parse transactions and detect recurring series.
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${fakeProgress}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );

  const uploadInstructions = (
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
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        data-testid="button-browse"
      >
        <FileText className="w-4 h-4 mr-2" />
        Browse Files
      </Button>
    </div>
  );

  const fileInput = (
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

        {fileInput}

        <div
          className={`border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30"
          } ${isProcessing ? "pointer-events-none" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone"
        >
          <div aria-busy={isProcessing ? "true" : "false"} aria-live="polite">
            {isProcessing ? processingIndicator : uploadInstructions}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2" data-testid="alert-error">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!isProcessing && (
          <>
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
                optionally broker. Categories should be: Income or Expense. Maximum
                file size {maxFileSizeLabel}.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
