"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function ChartStyle({ config }: { config: ChartConfig }) {
  const styles = Object.entries(config)
    .map(([key, value]) => `--color-${key}: ${value.color};`)
    .join("\n");

  return <style>{`[data-slot="chart"] { ${styles} }`}</style>;
}

function ChartContainer({
  className,
  config,
  children,
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
}) {
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none",
          className,
        )}
      >
        <ChartStyle config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

type ChartTooltipEntry = {
  color?: string;
  dataKey?: string | number;
  value?: number | string | null;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
  className?: string;
}) {
  const config = React.useContext(ChartContext);

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn("bg-popover border px-3 py-2 shadow-lg", className)}>
      {label ? <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((entry: ChartTooltipEntry) => {
          const key = String(entry.dataKey ?? "");
          const item = config?.[key];

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 border"
                  style={{ backgroundColor: item?.color ?? entry.color ?? "currentColor" }}
                />
                <span className="text-muted-foreground">{item?.label ?? key}</span>
              </div>
              <span className="font-medium tabular-nums">{Number(entry.value ?? 0).toLocaleString("pt-BR")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltipContent };
