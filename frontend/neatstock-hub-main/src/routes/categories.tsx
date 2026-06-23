import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

const COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#BA7517"];

type Category = {
  id: number;
  name: string;
  description: string | null;
  product_count: number;
};

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Categories · Stock Management" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/`);
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Could not load categories. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail || "Failed to delete category");
        return;
      }
      toast.success("Category deleted");
      fetchCategories();
    } catch {
      toast.error("Cannot reach the server");
    }
  };

  const total = categories.reduce((s, c) => s + c.product_count, 0);

  return (
    <AppShell>
      <PageHeader
        title="Categories"
        description="Group products to keep your catalog tidy and reports meaningful."
        breadcrumbs={[{ label: "Home" }, { label: "Categories" }]}
        actions={<AddCategoryDialog onSaved={fetchCategories} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total Categories" value={categories.length} />
        <Stat label="Total Products" value={total} />
        <Stat label="Avg per Category" value={categories.length ? Math.round(total / categories.length) : 0} />
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading categories…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={c.id} className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-lg" style={{ backgroundColor: `${color}22`, color }}>
                    <Tags className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <EditCategoryDialog category={c} onSaved={fetchCategories} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will remove the category. Products will be uncategorised.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.description || "No description"}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Products</span>
                  <span className="text-sm font-bold">{c.product_count}</span>
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No categories yet. Click "Add Category" to create one.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function AddCategoryDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to create category");
        return;
      }
      toast.success("Category created");
      setName("");
      setDescription("");
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
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Categories help group products for reporting and filtering.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="e.g. Electronics" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Short description" />
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Creating..." : "Create"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to update category");
        return;
      }
      toast.success("Category updated");
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
        <button className="rounded p-1.5 text-muted-foreground hover:bg-accent">
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Update the name or description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" />
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}