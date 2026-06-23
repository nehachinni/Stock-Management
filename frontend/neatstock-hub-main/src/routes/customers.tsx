import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { Plus, Phone, MapPin } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Customer = {
  id: number;
  name: string;
  mobile: string | null;
  address: string | null;
  total_purchases: number;
  last_purchase: string | null;
};

const COLORS = ["bg-blue-500", "bg-pink-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-cyan-500"];

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · Stock Management" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers/`);
      setCustomers(await res.json());
    } catch {
      toast.error("Could not load customers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Customers"
        description="Your buyer relationships and purchase history."
        breadcrumbs={[{ label: "Home" }, { label: "Customers" }]}
        actions={<AddCustomerDialog onSaved={fetchCustomers} />}
      />

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Mobile</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
              <th className="px-4 py-3 text-right font-semibold">Total Purchases</th>
              <th className="px-4 py-3 text-left font-semibold">Last Purchase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading customers…</td></tr>
            )}
            {!loading && customers.map((c, i) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${COLORS[i % COLORS.length]}`}>
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="font-medium">{c.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{c.mobile || "—"}</span></td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{c.address || "—"}</span></td>
                <td className="px-4 py-3 text-right font-mono">{c.total_purchases}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.last_purchase || "—"}</td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-muted-foreground">No customers yet. Click "Add Customer" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function AddCustomerDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", address: "" });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/customers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to add customer");
        return;
      }
      toast.success("Customer added");
      setForm({ name: "", mobile: "", address: "" });
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Cannot reach the server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>Add a buyer to track their purchase history.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Name</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Mobile</span>
            <input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Address</span>
            <input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : "Add Customer"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}