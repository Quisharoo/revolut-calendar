import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type IconProps = React.ComponentPropsWithoutRef<typeof Loader2>;

const Spinner = forwardRef<SVGSVGElement, IconProps>(function Spinner(
  { className, ...props },
  ref
) {
  return (
    <Loader2
      ref={ref}
      className={cn("h-4 w-4 animate-spin text-primary", className)}
      aria-hidden="true"
      {...props}
    />
  );
});

export { Spinner };
