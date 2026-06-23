import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/layout/StatCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import { Plus, ShoppingCart, Clock, CheckCircle2, IndianRupee } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Purchase = {
  id: number;
  purchase_code: string;
  supplier_id: number | null;
  supplier_name: string | null;
  product_id: number | null;
  product_name: string | null;
  quantity: number;
  amount: number;
  status: string;
  purchase_date: string;
};

type Supplier = { id: number; name: string };
type Product = { id: number; name: string };

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export const Route = createFileRoute("/purchases")({
  head: () => ({ meta: [{ title: "Purchases · Stock Management" }] }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [pRes, sRes, prRes] = await Promise.all([
        fetch(`${API_URL}/purchases/`),
        fetch(`${API_URL}/suppliers/`),
        fetch(`${API_URL}/products/`),
      ]);
      setPurchases(await pRes.json());
      setSuppliers(await sRes.json());
      setProducts(await prRes.json());
    } catch {
      toast.error("Could not load data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/purchases/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked as ${status}`);
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalAmount = purchases.reduce((s, p) => s + p.amount, 0);
  const received = purchases.filter((p) => p.status === "Received").length;
  const pending = purchases.filter((p) => p.status === "Pending").length;

  return (
    <AppShell>
      <PageHeader
        title="Purchases"
        description="Track every purchase order placed with suppliers."
        breadcrumbs={[{ label: "Home" }, { label: "Purchases" }]}
        actions={<NewPurchaseDialog suppliers={suppliers} products={products} onSaved={fetchAll} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={purchases.length} icon={ShoppingCart} tone="primary" />
        <StatCard label="Received" value={received} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="warning" />
        <StatCard label="Total Value" value={formatINR(totalAmount)} icon={IndianRupee} tone="info" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Purchase ID</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-right font-semibold">Quantity</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading purchases…</td></tr>
            )}
            {!loading && purchases.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{p.purchase_code}</td>
                <td className="px-4 py-3 font-medium">{p.supplier_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.purchase_date}</td>
                <td className="px-4 py-3 text-right font-mono">{p.quantity}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatINR(p.amount)}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {!loading && purchases.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">No purchases yet. Click "New Purchase" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function NewPurchaseDialog({ suppliers, products, onSaved }: {
  suppliers: Supplier[]; products: Product[]; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", product_id: "", quantity: "", amount: "", status: "Pending" });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/purchases/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
          product_id: form.product_id ? Number(form.product_id) : null,
          quantity: Number(form.quantity) || 0,
          amount: Number(form.amount) || 0,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to create purchase");
        return;
      }
      toast.success(`Purchase ${data.purchase_code} created`);
      setForm({ supplier_id: "", product_id: "", quantity: "", amount: "", status: "Pending" });
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
          <Plus className="h-4 w-4" /> New Purchase
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Purchase</DialogTitle>
          <DialogDescription>Create a purchase order with a supplier. Marking it "Received" will add stock automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Supplier</span>
            <select value={form.supplier_id} onChange={(e) => update("supplier_id", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Product</span>
            <select value={form.product_id} onChange={(e) => update("product_id", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Quantity</span>
              <input type="number" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">Amount (₹)</span>
              <input type="number" value={form.amount} onChange={(e) => update("amount", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Creating..." : "Create Purchase"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}