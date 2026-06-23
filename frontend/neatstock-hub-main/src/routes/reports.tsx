import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { FileText, FileSpreadsheet, Calendar, BarChart3, Truck, Boxes, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

type Sale = { total: number; sale_date: string };
type Purchase = { supplier_name: string | null; amount: number; purchase_date: string };
type Product = { name: string; sku: string; quantity: number; status: string };

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Stock Management" }] }),
  component: ReportsPage,
});

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes, prRes] = await Promise.all([
          fetch(`${API_URL}/sales/`),
          fetch(`${API_URL}/purchases/`),
          fetch(`${API_URL}/products/`),
        ]);
        setSales(await sRes.json());
        setPurchases(await pRes.json());
        setProducts(await prRes.json());
      } catch {
        toast.error("Could not load report data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const exportSales = (rangeLabel: string, filterFn: (s: Sale) => boolean) => {
    const filtered = sales.filter(filterFn);
    if (filtered.length === 0) {
      toast.error(`No sales found for ${rangeLabel}`);
      return;
    }
    downloadCSV(`${rangeLabel.toLowerCase().replace(/\s+/g, "-")}-sales-${today}.csv`,
      ["Date", "Total"], filtered.map((s) => [s.sale_date, s.total]));
    toast.success(`${rangeLabel} exported`);
  };

  const exportInventory = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }
    downloadCSV(`inventory-report-${today}.csv`,
      ["Name", "SKU", "Quantity", "Status"],
      products.map((p) => [p.name, p.sku, p.quantity, p.status]));
    toast.success("Inventory Report exported");
  };

  const exportSuppliers = () => {
    if (purchases.length === 0) {
      toast.error("No purchases to export");
      return;
    }
    downloadCSV(`supplier-report-${today}.csv`,
      ["Supplier", "Amount", "Date"],
      purchases.map((p) => [p.supplier_name || "—", p.amount, p.purchase_date]));
    toast.success("Supplier Report exported");
  };

  const reports = [
    { id: "daily", title: "Daily Sales Report", desc: "Sales summary for today", icon: Receipt, tone: "bg-primary/10 text-primary", action: () => exportSales("Daily", (s) => s.sale_date === today) },
    { id: "weekly", title: "Weekly Sales Report", desc: "Last 7 days breakdown", icon: BarChart3, tone: "bg-info/15 text-info", action: () => exportSales("Weekly", (s) => {
      const d = new Date(s.sale_date); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      return d >= cutoff;
    }) },
    { id: "monthly", title: "Monthly Sales Report", desc: "Full month performance", icon: Calendar, tone: "bg-success/15 text-success", action: () => exportSales("Monthly", (s) => {
      const d = new Date(s.sale_date); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) },
    { id: "inventory", title: "Inventory Report", desc: "Full stock snapshot", icon: Boxes, tone: "bg-warning/20 text-warning-foreground", action: exportInventory },
    { id: "supplier", title: "Supplier Report", desc: "Purchases by vendor", icon: Truck, tone: "bg-destructive/10 text-destructive", action: exportSuppliers },
  ];

  const monthlyData = sales.reduce((acc: Record<string, number>, s) => {
    const month = new Date(s.sale_date).toLocaleString("en-US", { month: "short" });
    acc[month] = (acc[month] || 0) + s.total;
    return acc;
  }, {});
  const chartData = Object.entries(monthlyData).map(([month, total]) => ({ month, sales: total }));
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Generate, export and download business reports."
        breadcrumbs={[{ label: "Home" }, { label: "Reports" }]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
            <div className={`grid h-11 w-11 place-items-center rounded-lg ${r.tone}`}>
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={r.action} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Revenue Trend</h3>
        <p className="mb-4 text-xs text-muted-foreground">{loading ? "Loading…" : `Total revenue: ${formatINR(totalRevenue)}`}</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="sales" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AppShell>
  );
}