import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Calculator,
  CalendarDays,
  FlaskConical,
  Home, Info,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import logo from "@/assets/logo-olivares.png.asset.json";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/informacion", label: "Información relevante", icon: Info },
  { to: "/calendario", label: "Registro de tareas", icon: CalendarDays },
  { to: "/tratamientos", label: "Tratamientos", icon: FlaskConical },
  { to: "/calculadora", label: "Calculadora", icon: Calculator },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/plazos", label: "Plazos de seguridad", icon: ShieldCheck },
  { to: "/stock", label: "Stock", icon: Warehouse, admin: true },
  { to: "/configuracion", label: "Configuración", icon: Settings, admin: true },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col items-center gap-2 border-b border-sidebar-border px-6 py-6">
        <img src={logo.url} alt="Olivares Villairenses" className="size-20" />
        <div className="text-center font-display text-xl font-light leading-tight">
          Olivares Villairenses
          <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-ov-gold">Cuaderno de campo</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.filter((n) => !("admin" in n) || isAdmin).map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md border-l-2 px-3 text-sm transition-colors",
                active ? "border-ov-gold bg-sidebar-accent text-ov-gold" : "border-transparent hover:bg-sidebar-border",
              )}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => supabase.auth.signOut()} className="m-3 flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-sidebar-border">
        <LogOut className="size-4" /> Salir
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useStore();
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Nav />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ov-gold/40 bg-background/95 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu />
          </Button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{user.nombre} · {user.rol === "admin" ? "Administradora" : "Campo"}</span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
