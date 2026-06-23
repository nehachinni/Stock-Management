import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useEffect, useState } from "react";
import { Plus, Mail, Phone, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

type Employee = {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  status: string;
};

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees · Stock Management" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees/`);
      setEmployees(await res.json());
    } catch {
      toast.error("Could not load employees. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Employee removed");
      fetchEmployees();
    } catch {
      toast.error("Failed to remove employee");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Employees"
        description="Team members with access to the system."
        breadcrumbs={[{ label: "Home" }, { label: "Employees" }]}
        actions={<EmployeeDialog mode="add" onSaved={fetchEmployees} />}
      />

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">Loading employees…</td></tr>
            )}
            {!loading && employees.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.name)}`} className="h-9 w-9 rounded-full" alt="" />
                    <div className="font-medium">{e.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge variant={e.role === "Admin" ? "primary" : e.role === "Manager" ? "info" : "muted"}>{e.role}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{e.phone || "—"}</span></td>
                <td className="px-4 py-3 text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{e.email || "—"}</span></td>
                <td className="px-4 py-3"><StatusBadge variant={e.status === "Active" ? "success" : "muted"}>{e.status}</StatusBadge></td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded p-1 hover:bg-accent"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EmployeeDialog mode="edit" employee={e} onSaved={fetchEmployees} />
                      <DropdownMenuItem onClick={() => handleDelete(e.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {!loading && employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">No employees yet. Click "Add Employee" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function EmployeeDialog({ mode, employee, onSaved }: {
  mode: "add" | "edit"; employee?: Employee; onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: employee?.name || "", role: employee?.role || "Staff",
    phone: employee?.phone || "", email: employee?.email || "", status: employee?.status || "Active",
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = mode === "add" ? `${API_URL}/employees/` : `${API_URL}/employees/${employee!.id}`;
      const res = await fetch(url, {
        method: mode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Failed to save employee");
        return;
      }
      toast.success(mode === "add" ? "Employee added" : "Employee updated");
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
        {mode === "add" ? (
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        ) : (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Employee" : "Edit Employee"}</DialogTitle>
          <DialogDescription>Team members with access to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Name</span>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Role</span>
            <select value={form.role} onChange={(e) => update("role", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Phone</span>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Email</span>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Status</span>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <DialogFooter>
            <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Saving..." : mode === "add" ? "Add Employee" : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}