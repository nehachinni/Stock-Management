import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/layout/StatCard";
import { useEffect, useState } from "react";
import { Plus, Receipt, IndianRupee, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Sale = {
  id: number;
  invoice_code: string;
  customer_id: number | null;
  customer_name: string | null;
  product_id: number;
  product_name: string | null;
  quantity: number;
  total: number;
  sale_date: string;
};

type Customer = { id: number; name: string };
type Product = { id: number; name: string; selling_price: number; quantity: number };

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales · Stock Management" }] }),
  component: SalesPage,
});

function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [sRes, cRes, pRes] = await Promise.all([
        fetch(`${API_URL}/sales/`),
        fetch(`${API_URL}/customers/`),
        fetch(`${API_URL}/products/`),
      ]);
      setSales(await sRes.json());
      setCustomers(await cRes.json());
      setProducts(await pRes.json());
    } catch {
      toast.error("Could not load data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const total = sales.reduce((s, x) => s + x.total, 0);
  const uniqueCustomers = new Set(sales.map((s) => s.customer_name).filter(Boolean)).size;

  const monthlyData = sales.reduce((acc: Record<string, number>, s) => {
    const month = s.sale_date ? new Date(s.sale_date).toLocaleString("en-US", { month: "short" }) : "—";
    acc[month] = (acc[month] || 0) + s.total;
    return acc;
  }, {});
  const chartData = Object.entries(monthlyData).map(([month, sales]) => ({ month, sales }));

  return (
    <AppShell>
      <PageHeader
        title="Sales"
        description="Invoices, revenue and customer activity."
        breadcrumbs={[{ label: "Home" }, { label: "Sales" }]}
        actions={<CreateSaleDialog customers={customers} products={products} onSaved={fetchAll} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Invoices" value={sales.length} icon={Receipt} tone="primary" />
        <StatCard label="Revenue" value={formatINR(total)} icon={IndianRupee} tone="success" />
        <StatCard label="Avg Order Value" value={formatINR(sales.length ? Math.round(total / sales.length) : 0)} icon={TrendingUp} tone="info" />
        <StatCard label="Unique Customers" value={uniqueCustomers} icon={Users} tone="warning" />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Sales Analytics</h3>
        <p className="mb-4 text-xs text-muted-foreground">Revenue by month (from your sales)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="sales" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Sales History</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-right font-semibold">Qty</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading sales…</td></tr>
            )}
            {!loading && sales.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{s.invoice_code}</td>
                <td className="px-4 py-3 font-medium">{s.customer_name || "Walk-in"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.product_name}</td>
                <td className="px-4 py-3 text-right font-mono">{s.quantity}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatINR(s.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.sale_date}</td>
              </tr>
            ))}
            {!loading && sales.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">No sales yet. Click "Create Sale" to record one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function CreateSaleDialog({ customers, products, onSaved }: {
  customers: Customer[]; products: Product[]; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", product_id: "", quantity: "1" });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = products.find((p) => p.id === Number(form.product_id));
  const estimatedTotal = selectedProduct ? selectedProduct.selling_price * Number(form.quantity || 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id ? Number(form.customer_id) : null,
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to create sale");
        return;
      }
      toast.success(`Sale ${data.invoice_code} created`);
      setForm({ customer_id: "", product_id: "", quantity: "1" });
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
          <Plus className="h-4 w-4" /> Create Sale
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sale</DialogTitle>
          <DialogDescription>This will deduct stock from the selected product automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Customer (optional)</span>
            <select value={form.customer_id} onChange={(e) => update("customer_id", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Product</span>
            <select value={form.product_id} onChange={(e) => update("product_id", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Quantity</span>
            <input type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          {selectedProduct && (
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
              Estimated total: <span className="font-semibold">{formatINR(estimatedTotal)}</span>
            </div>
          )}
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Creating..." : "Create Sale"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}