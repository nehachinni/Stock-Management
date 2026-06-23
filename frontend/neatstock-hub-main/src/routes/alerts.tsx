import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import { AlertTriangle, XCircle, RefreshCcw } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Product = {
  id: number;
  name: string;
  sku: string;
  category_name: string | null;
  quantity: number;
  status: string;
};

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Low Stock Alerts · Stock Management" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/`);
      setProducts(await res.json());
    } catch {
      toast.error("Could not load alerts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const low = products.filter((p) => p.status === "Low Stock");
  const out = products.filter((p) => p.status === "Out of Stock");

  return (
    <AppShell>
      <PageHeader
        title="Low Stock Alerts"
        description="Products that need urgent attention and restocking."
        breadcrumbs={[{ label: "Home" }, { label: "Alerts" }]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-warning/30 text-warning-foreground">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{low.length}</div>
            <div className="text-sm text-muted-foreground">Low stock items</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/20 text-destructive">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{out.length}</div>
            <div className="text-sm text-muted-foreground">Out of stock items</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading alerts…</div>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Critical · Out of Stock</h2>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {out.map((p) => <AlertCard key={p.id} product={p} priority="High" onRestocked={fetchProducts} />)}
            {out.length === 0 && <div className="col-span-full text-sm text-muted-foreground">No out-of-stock items. 🎉</div>}
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Warning · Low Stock</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {low.map((p) => <AlertCard key={p.id} product={p} priority="Medium" onRestocked={fetchProducts} />)}
            {low.length === 0 && <div className="col-span-full text-sm text-muted-foreground">No low-stock items.</div>}
          </div>
        </>
      )}
    </AppShell>
  );
}

function AlertCard({ product, priority, onRestocked }: {
  product: Product; priority: "High" | "Medium"; onRestocked: () => void;
}) {
  const isHigh = priority === "High";
  const [amount, setAmount] = useState("10");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRestock = async () => {
    const qty = Number(amount);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/products/${product.id}/restock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail || "Failed to restock");
        return;
      }
      toast.success(`Added ${qty} units to ${product.name}`);
      setOpen(false);
      onRestocked();
    } catch {
      toast.error("Cannot reach the server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-border bg-muted text-xs font-bold text-muted-foreground">
          {product.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold">{product.name}</div>
              <div className="truncate text-xs text-muted-foreground">{product.sku} · {product.category_name || "—"}</div>
            </div>
            <StatusBadge variant={isHigh ? "destructive" : "warning"}>{priority}</StatusBadge>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="text-xs">
              <span className="text-muted-foreground">Stock left:</span>{" "}
              <span className={`font-bold ${isHigh ? "text-destructive" : "text-warning-foreground"}`}>{product.quantity}</span>
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  <RefreshCcw className="h-3 w-3" /> Restock
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                  <div className="text-xs font-medium">Add stock for {product.name}</div>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    placeholder="Quantity to add"
                  />
                  <button
                    onClick={handleRestock}
                    disabled={saving}
                    className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {saving ? "Adding..." : "Confirm Restock"}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}