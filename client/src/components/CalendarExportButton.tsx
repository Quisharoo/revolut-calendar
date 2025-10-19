import type { ReactNode } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarExportButtonProps {
  onClick: () => void;
  tooltip: ReactNode;
  testId?: string;
}

export const CalendarExportButton = ({
  onClick,
  tooltip,
  testId = "button-export-ics",
}: CalendarExportButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex">
        <Button variant="outline" size="sm" onClick={onClick} data-testid={testId}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent side="bottom" align="end">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

