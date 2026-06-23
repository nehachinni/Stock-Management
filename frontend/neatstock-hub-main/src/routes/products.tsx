import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, Eye, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  category_id: number | null;
  category_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  low_stock_threshold: number;
  status: string;
};

type Category = { id: number; name: string; description?: string; product_count?: number };

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products · Stock Management" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"name" | "price" | "qty">("name");

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products/`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error("Could not load products. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error("Could not load categories.");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) =>
      (cat === "all" || p.category_name === cat) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") list = [...list].sort((a, b) => b.selling_price - a.selling_price);
    if (sort === "qty") list = [...list].sort((a, b) => a.quantity - b.quantity);
    return list;
  }, [products, q, cat, sort]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = ["Name", "SKU", "Category", "Purchase Price", "Selling Price", "Quantity", "Status", "Supplier"];
    const rows = filtered.map((p) => [
      p.name, p.sku, p.category_name || "", p.purchase_price, p.selling_price, p.quantity, p.status, p.supplier_name || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} products`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Products"
        description="Manage your full catalog, pricing, and stock levels."
        breadcrumbs={[{ label: "Home" }, { label: "Products" }]}
        actions={
          <>
            <button onClick={handleExport} className="hidden h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent sm:inline-flex">
              <Download className="h-4 w-4" /> Export
            </button>
            <AddProductDialog categories={categories} onSaved={fetchProducts} />
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as "name" | "price" | "qty")} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price (high → low)</option>
            <option value="qty">Sort: Stock (low → high)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">SKU</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Purchase</th>
                <th className="px-4 py-3 text-right font-semibold">Selling</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading products…</td></tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.supplier_name || "—"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3"><StatusBadge variant="info">{p.category_name || "—"}</StatusBadge></td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatINR(p.purchase_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(p.selling_price)}</td>
                  <td className="px-4 py-3 text-right font-mono">{p.quantity}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={p.status === "In Stock" ? "success" : p.status === "Low Stock" ? "warning" : "destructive"}>{p.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 hover:bg-accent">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
                      <Filter className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-3 text-sm font-medium">No products found</div>
                    <div className="text-xs text-muted-foreground">Try adjusting your search or filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div>Showing <b className="text-foreground">{filtered.length}</b> of {products.length} products</div>
        </div>
      </div>
    </AppShell>
  );
}

function AddProductDialog({ categories, onSaved }: { categories: Category[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", category_id: "", purchase_price: "", selling_price: "", quantity: "", low_stock_threshold: "10",
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category_id: form.category_id ? Number(form.category_id) : null,
          purchase_price: Number(form.purchase_price) || 0,
          selling_price: Number(form.selling_price) || 0,
          quantity: Number(form.quantity) || 0,
          low_stock_threshold: Number(form.low_stock_threshold) || 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to add product");
        return;
      }
      toast.success("Product added");
      setForm({ name: "", sku: "", category_id: "", purchase_price: "", selling_price: "", quantity: "", low_stock_threshold: "10" });
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
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Fill in the details to add a new product to your inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3 py-2 sm:grid-cols-2">
          <Input label="Product Name" placeholder="e.g. iPhone 15 Pro" className="sm:col-span-2" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          <Input label="SKU Code" placeholder="SKU-1234" value={form.sku} onChange={(e) => update("sku", e.target.value)} required />
          <Select label="Category" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Purchase Price" type="number" placeholder="0" value={form.purchase_price} onChange={(e) => update("purchase_price", e.target.value)} />
          <Input label="Selling Price" type="number" placeholder="0" value={form.selling_price} onChange={(e) => update("selling_price", e.target.value)} />
          <Input label="Quantity" type="number" placeholder="0" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
          <Input label="Reorder Level" type="number" placeholder="10" value={form.low_stock_threshold} onChange={(e) => update("low_stock_threshold", e.target.value)} />
          <DialogFooter className="sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : "Save product"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Input({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <input {...props} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring" />
    </label>
  );
}
function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <select {...props} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{children}</select>
    </label>
  );
}