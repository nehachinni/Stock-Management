import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "destructive" | "info" | "muted" | "primary";

const variants: Record<Variant, string> = {
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/25 text-warning-foreground border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({ children, variant = "muted", className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
