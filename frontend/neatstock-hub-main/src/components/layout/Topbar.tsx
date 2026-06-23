import { Bell, Menu, Moon, Search, Sun, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut, User as UserIcon, Settings as SettingsIcon, Package } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_URL = "http://localhost:8000";

type Product = { id: number; name: string; sku: string; selling_price: number; status: string };

type Props = {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
};

export function Topbar({ onToggleSidebar, onToggleCollapse, collapsed }: Props) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Guest";
  const email = localStorage.getItem("email") || "";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/products/`)
      .then((res) => res.json())
      .then(setAllProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = query.trim()
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onToggleSidebar} className="rounded-md p-2 hover:bg-accent lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <button onClick={onToggleCollapse} className="hidden rounded-md p-2 hover:bg-accent lg:block">
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <div ref={wrapperRef} className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search products by name or SKU…"
          className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:bg-background"
        />

        {showResults && query.trim() && (
          <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/products"
                      onClick={() => { setShowResults(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.sku} · ₹{p.selling_price.toLocaleString("en-IN")}</div>
                      </div>
                      <span className={`text-xs ${p.status === "In Stock" ? "text-success" : p.status === "Low Stock" ? "text-warning-foreground" : "text-destructive"}`}>
                        {p.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">No products found for "{query}"</div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button onClick={toggle} className="rounded-md p-2 hover:bg-accent" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <Link to="/notifications" className="relative rounded-md p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </Link>

        <DropdownMenu>
         <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-lg p-1 pl-1 pr-2 hover:bg-accent">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`} className="h-8 w-8 rounded-full" alt="" />
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold leading-tight">{username}</div>
              <div className="text-[11px] leading-tight text-muted-foreground">{email}</div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><SettingsIcon className="mr-2 h-4 w-4" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}