import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { AlertTriangle, ShoppingCart, Receipt, Info, Check } from "lucide-react";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<string, { icon: typeof Info; tone: string }> = {
  warning: { icon: AlertTriangle, tone: "bg-warning/20 text-warning-foreground" },
  success: { icon: Receipt, tone: "bg-success/15 text-success" },
  info: { icon: Info, tone: "bg-info/15 text-info" },
  danger: { icon: ShoppingCart, tone: "bg-destructive/10 text-destructive" },
};

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Stock Management" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/`);
      setNotes(await res.json());
    } catch {
      toast.error("Could not load notifications. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/mark-all-read`, { method: "PUT" });
      if (!res.ok) throw new Error();
      toast.success("All marked as read");
      fetchNotes();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: "PUT" });
      fetchNotes();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="All system alerts, activity and messages."
        breadcrumbs={[{ label: "Home" }, { label: "Notifications" }]}
        actions={
          <button onClick={handleMarkAllRead} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading notifications…</div>
        ) : (
          <ul className="divide-y divide-border">
            {notes.map((n) => {
              const config = ICONS[n.type] || ICONS.info;
              const Icon = config.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={`flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-muted/30 ${!n.is_read ? "bg-primary/[0.03]" : ""}`}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${config.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold">{n.title}</div>
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <div className="text-sm text-muted-foreground">{n.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{n.created_at}</div>
                  </div>
                </li>
              );
            })}
            {notes.length === 0 && (
              <li className="p-10 text-center text-sm text-muted-foreground">No notifications yet. They'll appear here as you record sales, purchases, and stock changes.</li>
            )}
          </ul>
        )}
      </div>
    </AppShell>
  );
}