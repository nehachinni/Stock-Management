import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Tags, Truck, ShoppingCart, Receipt,
  Boxes, AlertTriangle, Users, UserCog, FileBarChart, Bell, Settings, Store, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/alerts", label: "Low Stock Alerts", icon: AlertTriangle },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/employees", label: "Employees", icon: UserCog },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

type Props = { collapsed: boolean; mobileOpen: boolean; onClose: () => void };

export function Sidebar({ collapsed, mobileOpen, onClose }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "lg:w-[72px]" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-bold tracking-tight">Stock Management</div>
                <div className="truncate text-[11px] text-muted-foreground">Inventory Control</div>
              </div>
            )}
          </Link>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "lg:justify-center lg:px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-4">
            <div className="text-xs font-semibold text-foreground">Need help?</div>
            <p className="mt-1 text-[11px] text-muted-foreground">Check our docs or contact support.</p>
            <button className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              View docs
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
