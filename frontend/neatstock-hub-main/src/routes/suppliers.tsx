import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import { Plus, Mail, Phone, MapPin, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  product_count: number;
};

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers · Stock Management" }] }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers/`);
      const data = await res.json();
      setSuppliers(data);
    } catch {
      toast.error("Could not load suppliers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.detail || "Failed to delete supplier");
        return;
      }
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch {
      toast.error("Cannot reach the server");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Suppliers"
        description="Vendors and distributors who replenish your stock."
        breadcrumbs={[{ label: "Home" }, { label: "Suppliers" }]}
        actions={<AddSupplierDialog onSaved={fetchSuppliers} />}
      />

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
              <th className="px-4 py-3 text-right font-semibold">Products</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading suppliers…</td></tr>
            )}
            {!loading && suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="font-medium">{s.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{s.phone || "—"}</span></td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{s.email || "—"}</span></td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{s.address || "—"}</span></td>
                <td className="px-4 py-3 text-right font-mono">{s.product_count}</td>
                <td className="px-4 py-3"><StatusBadge variant={s.status === "Active" ? "success" : "muted"}>{s.status}</StatusBadge></td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded p-1 hover:bg-accent"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                      <EditSupplierDialog supplier={s} onSaved={fetchSuppliers} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{s.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the supplier. Linked products will keep their data but lose the supplier reference.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {!loading && suppliers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">No suppliers yet. Click "Add Supplier" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function AddSupplierDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", status: "Active" });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/suppliers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to add supplier");
        return;
      }
      toast.success("Supplier added");
      setForm({ name: "", email: "", phone: "", address: "", status: "Active" });
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
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
          <DialogDescription>Add a vendor or distributor who supplies your products.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <Field label="Supplier Name" value={form.name} onChange={(v) => update("name", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Address" value={form.address} onChange={(v) => update("address", v)} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : "Add Supplier"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSupplierDialog({ supplier, onSaved }: { supplier: Supplier; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: supplier.name, email: supplier.email || "", phone: supplier.phone || "",
    address: supplier.address || "", status: supplier.status,
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to update supplier");
        return;
      }
      toast.success("Supplier updated");
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 h-4 w-4" />Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
          <DialogDescription>Update supplier details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <Field label="Supplier Name" value={form.name} onChange={(v) => update("name", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Address" value={form.address} onChange={(v) => update("address", v)} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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

function Field({ label, value, onChange, type = "text", required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}