import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatCard } from "@/components/layout/StatCard";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import { Boxes, AlertTriangle, XCircle, PackageCheck } from "lucide-react";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  status: string;
  low_stock_threshold: number;
};

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory · Stock Management" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/`);
      setProducts(await res.json());
    } catch {
      toast.error("Could not load inventory. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const lowStock = products.filter((p) => p.status === "Low Stock").length;
  const outOfStock = products.filter((p) => p.status === "Out of Stock").length;
  const inStock = products.filter((p) => p.status === "In Stock").length;

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
        description="Real-time view of stock levels across all products."
        breadcrumbs={[{ label: "Home" }, { label: "Inventory" }]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Stock" value={totalStock} icon={Boxes} tone="primary" />
        <StatCard label="In Stock Products" value={inStock} icon={PackageCheck} tone="success" />
        <StatCard label="Low Stock" value={lowStock} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock" value={outOfStock} icon={XCircle} tone="destructive" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-right font-semibold">Current Stock</th>
              <th className="px-4 py-3 text-right font-semibold">Reorder Level</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading inventory…</td></tr>
            )}
            {!loading && products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">{p.quantity}</td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">{p.low_stock_threshold}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={p.status === "In Stock" ? "success" : p.status === "Low Stock" ? "warning" : "destructive"}>{p.status}</StatusBadge>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-16 text-center text-sm text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}