import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "outline" | "success";
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em]",
        "data-[variant=default]:border-primary/20 data-[variant=default]:bg-primary/10 data-[variant=default]:text-primary",
        "data-[variant=outline]:border-border data-[variant=outline]:bg-background data-[variant=outline]:text-muted-foreground",
        "data-[variant=success]:border-emerald-500/30 data-[variant=success]:bg-emerald-500/10 data-[variant=success]:text-emerald-600",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
