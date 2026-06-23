import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Upload, Store, Bell, Palette } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Stock Management" }] }),
  component: SettingsPage,
});

const NOTIF_KEYS = [
  ["low_stock_alerts", "Low stock alerts"],
  ["new_sales", "New sales"],
  ["new_purchases", "New purchases received"],
  ["daily_summary_email", "Daily summary email"],
  ["weekly_report_email", "Weekly report email"],
];

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [form, setForm] = useState<Record<string, string>>({
    store_name: "", gst_number: "", contact_phone: "", contact_email: "", address: "", currency: "INR",
    low_stock_alerts: "true", new_sales: "true", new_purchases: "true",
    daily_summary_email: "false", weekly_report_email: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/`);
      const data = await res.json();
      setForm((f) => ({ ...f, ...data }));
    } catch {
      toast.error("Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Settings" description="Configure your store and system preferences." breadcrumbs={[{ label: "Home" }, { label: "Settings" }]} />
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading settings…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Configure your store and system preferences."
        breadcrumbs={[{ label: "Home" }, { label: "Settings" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section icon={Store} title="Store Settings" desc="Public information about your business">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store Name" value={form.store_name} onChange={(v) => update("store_name", v)} />
              <Field label="GST Number" value={form.gst_number} onChange={(v) => update("gst_number", v)} />
              <Field label="Contact Phone" value={form.contact_phone} onChange={(v) => update("contact_phone", v)} />
              <Field label="Contact Email" value={form.contact_email} onChange={(v) => update("contact_email", v)} />
              <Field label="Address" value={form.address} onChange={(v) => update("address", v)} className="sm:col-span-2" />
            </div>
            <div className="mt-4">
              <span className="mb-2 block text-xs font-medium">Logo</span>
              <button type="button" onClick={() => toast.info("Logo upload coming soon")} className="inline-flex h-10 items-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/40 px-4 text-sm font-medium text-muted-foreground hover:bg-muted">
                <Upload className="h-4 w-4" /> Upload logo
              </button>
            </div>
          </Section>

          <Section icon={Palette} title="System Settings" desc="App-wide preferences">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Currency</span>
                <select value={form.currency} onChange={(e) => update("currency", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Theme</span>
                <button type="button" onClick={toggle} className="h-9 w-full rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent">
                  {theme === "dark" ? "Dark" : "Light"} (click to toggle)
                </button>
              </label>
            </div>
          </Section>

          <Section icon={Bell} title="Notifications" desc="What you'd like to be alerted about">
            {NOTIF_KEYS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  checked={form[key] === "true"}
                  onChange={(e) => update(key, e.target.checked ? "true" : "false")}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </Section>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={fetchSettings} className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Plan</h3>
            <div className="mt-3 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 p-4">
              <div className="text-xs uppercase tracking-wider text-primary">Business</div>
              <div className="mt-1 text-2xl font-bold">₹999 <span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <div className="mt-2 text-xs text-muted-foreground">Unlimited products · 5 users · Reports</div>
              <button onClick={() => toast.info("Upgrade flow coming soon")} className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Upgrade</button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Danger zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">Permanently delete data. This cannot be undone.</p>
            <button onClick={() => toast.error("This action requires confirmation - not yet enabled")} className="mt-3 inline-flex h-8 items-center rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20">
              Delete store data
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
    </label>
  );
}