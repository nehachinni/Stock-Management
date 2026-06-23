import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Store, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, BarChart3, Boxes } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Stock Management" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("arjun@store.in");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.detail || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Save token + user info for use across the app
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);

      toast.success(`Welcome back, ${data.username}!`);
      setTimeout(() => navigate({ to: "/" }), 400);

    } catch (err) {
      toast.error("Cannot reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-[oklch(0.4_0.2_280)] p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 35%)" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold">Stock Management</div>
              <div className="text-xs text-white/70">Inventory Control Suite</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">Run your store like an enterprise.</h1>
          <p className="max-w-md text-white/80">Track inventory, manage suppliers, log sales, and get real-time alerts — all from one beautiful dashboard.</p>
          <div className="grid gap-3 pt-2">
            {[
              { icon: Boxes, t: "Real-time inventory tracking" },
              { icon: BarChart3, t: "Sales analytics & reports" },
              { icon: ShieldCheck, t: "Role-based access control" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15"><f.icon className="h-4 w-4" /></div>
                {f.t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 Stock Management. All rights reserved.</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div className="text-lg font-bold">Stock Management</div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the dashboard.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Field
              icon={Mail}
              label="Email"
              type="email"
              placeholder="you@store.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              icon={Lock}
              label="Password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suffix={
                <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input accent-primary" />
                Remember me
              </label>
              <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Don't have an account? <Link to="/" className="font-medium text-primary hover:underline">Contact admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, type, placeholder, value, onChange, suffix }: {
  icon: React.ElementType; label: string; type: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; suffix?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      <span className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-ring"
        />
        {suffix && <span className="absolute right-3">{suffix}</span>}
      </span>
    </label>
  );
}