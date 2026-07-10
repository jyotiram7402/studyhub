import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  className?: string;
}

export function BarChart({ data, formatValue, className }: BarChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const format = formatValue ?? ((value: number) => String(value));

  return (
    <div className={cn("flex h-48 items-end gap-1.5", className)}>
      {data.map((point, index) => {
        const height = Math.max((point.value / max) * 100, point.value > 0 ? 3 : 1);
        return (
          <div
            key={`${point.label}-${index}`}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-end self-stretch"
          >
            <div className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap rounded-md border bg-card px-2 py-1 text-xs shadow-md group-hover:block">
              <span className="font-medium">{format(point.value)}</span>
              <span className="text-muted-foreground"> · {point.label}</span>
            </div>
            <div
              className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function DistributionBars({
  data,
  className,
}: {
  data: { label: string; value: number }[];
  className?: string;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((point) => (
        <li key={point.label} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-muted-foreground">{point.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-medium">{point.value}</span>
        </li>
      ))}
    </ul>
  );
}
