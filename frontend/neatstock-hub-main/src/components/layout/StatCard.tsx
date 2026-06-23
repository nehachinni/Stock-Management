import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
  hint?: string;
};

const tones: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "primary", hint }: Props) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof trend === "number" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
            up ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
