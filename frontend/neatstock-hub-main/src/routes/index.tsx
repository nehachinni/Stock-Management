import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/layout/StatCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import {
  Package, Tags, Truck, Receipt, AlertTriangle, XCircle, IndianRupee, ShoppingBag,
  Plus, Download, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";
const COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#BA7517"];

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

type DashboardData = {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  total_sales: number;
  low_stock: number;
  out_of_stock: number;
  monthly_revenue: number;
  todays_orders: number;
  category_distribution: { name: string; value: number }[];
  monthly_sales: { month: string; sales: number; purchases: number }[];
  top_products: { name: string; sold: number }[];
};

type Notification = { id: number; title: string; message: string; type: string; created_at: string };
type Purchase = { purchase_code: string; supplier_name: string | null; amount: number; status: string; purchase_date: string };
type Product = { id: number; name: string; sku: string; quantity: number; status: string };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Stock Management" },
      { name: "description", content: "Overview of inventory, sales, purchases and stock alerts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Notification[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const username = (localStorage.getItem("username") || "Guest").split(" ")[0];

  useEffect(() => {
    (async () => {
      try {
        const [dRes, nRes, pRes, prRes] = await Promise.all([
          fetch(`${API_URL}/reports/dashboard`),
          fetch(`${API_URL}/notifications/`),
          fetch(`${API_URL}/purchases/`),
          fetch(`${API_URL}/products/`),
        ]);
        setData(await dRes.json());
        setActivities((await nRes.json()).slice(0, 5));
        setPurchases((await pRes.json()).slice(0, 5));
        const products: Product[] = await prRes.json();
        setLowStockProducts(products.filter((p) => p.status !== "In Stock").slice(0, 5));
      } catch {
        toast.error("Could not load dashboard. Is the backend running?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <AppShell>
        <PageHeader title="Dashboard" description="Loading your store overview…" breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]} />
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading dashboard…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${username}. Here's what's happening at your store today.`}
        breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}
        actions={
          <Link to="/sales" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Sale
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={data.total_products} icon={Package} tone="primary" />
        <StatCard label="Categories" value={data.total_categories} icon={Tags} tone="info" />
        <StatCard label="Suppliers" value={data.total_suppliers} icon={Truck} tone="success" />
        <StatCard label="Total Sales" value={data.total_sales} icon={Receipt} tone="primary" />
        <StatCard label="Low Stock" value={data.low_stock} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock" value={data.out_of_stock} icon={XCircle} tone="destructive" />
        <StatCard label="Monthly Revenue" value={formatINR(data.monthly_revenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Today's Orders" value={data.todays_orders} icon={ShoppingBag} tone="info" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly Sales Overview" subtitle="Sales vs Purchases" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthly_sales}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="var(--color-chart-1)" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="purchases" stroke="var(--color-chart-2)" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Distribution" subtitle="Products per category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.category_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {data.category_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Top Selling Products" subtitle="By units sold">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.top_products} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sold" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Panel title="Recent Activities" linkTo="/notifications">
          <ul className="divide-y divide-border">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : a.type === "danger" ? "bg-destructive" : "bg-primary"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.message}</div>
                </div>
                <div className="shrink-0 text-[11px] text-muted-foreground">{a.created_at}</div>
              </li>
            ))}
            {activities.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No recent activity yet.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Latest Purchases" linkTo="/purchases">
          <ul className="divide-y divide-border">
            {purchases.map((p) => (
              <li key={p.purchase_code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.purchase_code}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.supplier_name || "—"} · {p.purchase_date}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold">{formatINR(p.amount)}</div>
                  <StatusBadge variant={p.status === "Received" ? "success" : p.status === "Pending" ? "warning" : "destructive"}>{p.status}</StatusBadge>
                </div>
              </li>
            ))}
            {purchases.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No purchases yet.</li>}
          </ul>
        </Panel>

        <Panel title="Low Stock Alerts" linkTo="/alerts">
          <ul className="divide-y divide-border">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.sku}</div>
                </div>
                <StatusBadge variant={p.quantity === 0 ? "destructive" : "warning"}>{p.quantity} left</StatusBadge>
              </li>
            ))}
            {lowStockProducts.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">All products well stocked.</li>}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Panel({ title, linkTo, children }: { title: string; linkTo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link to={linkTo} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}