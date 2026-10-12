import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AlertTriangle, CalendarClock, CalendarRange, Package, ShieldAlert } from "lucide-react";
import { pageHead } from "@/lib/head";
import { nombreCuadro, useStore } from "@/lib/store";
import { addDays, diffDays, esAtrasada, fmt, num, plazosPorFila } from "@/lib/logic";
import type { Tarea } from "@/lib/data";
import { PageHeader, TipoChip } from "@/components/ov";
import { TaskDialog } from "@/components/TaskDialog";

export const Route = createFileRoute("/informacion")({
  head: () => pageHead("Información relevante", "Tareas atrasadas, de la semana, próximas, stock bajo y plazos de seguridad."),
  component: Informacion,
});

function Card({ title, icon, count, children, to, danger }: { title: string; icon: ReactNode; count: number; children: ReactNode; to: string; danger?: boolean }) {
  return (
    <section className="ov-card overflow-hidden">
      <div className={danger ? "h-1 bg-danger" : "ov-gradient h-1"} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <h3 className="flex items-center gap-2 text-xl">
            {icon} {title}
          </h3>
          <Link to={to} className={`font-display text-4xl font-light ${danger && count ? "text-danger" : "text-foreground"}`}>
            {count}
          </Link>
        </div>
        <div className="mt-3 space-y-1">{children}</div>
      </div>
    </section>
  );
}

function Informacion() {
  const s = useStore();
  const [sel, setSel] = useState<Tarea | null>(null);
  const semana = addDays(s.hoy, 7);
  const mes = addDays(s.hoy, 30);
  const ordenar = (ts: Tarea[]) =>
    [...ts].sort((a, b) => {
      const mineA = a.responsable_id === s.user.id ? 0 : 1;
      const mineB = b.responsable_id === s.user.id ? 0 : 1;
      return s.isAdmin ? a.fecha_inicio.localeCompare(b.fecha_inicio) : mineA - mineB || a.fecha_inicio.localeCompare(b.fecha_inicio);
    });
  const abiertas = s.tareas.filter((t) => t.estado !== "hecha");
  const atrasadas = ordenar(abiertas.filter((t) => esAtrasada(t, s.hoy)));
  const estaSemana = ordenar(abiertas.filter((t) => !esAtrasada(t, s.hoy) && t.fecha_inicio <= semana));
  const proximos = ordenar(abiertas.filter((t) => t.fecha_inicio > semana && t.fecha_inicio <= mes));
  const stockBajo = s.productos.filter((p) => p.activo && p.stock_actual < p.stock_minimo);
  const plazos = plazosPorFila(s.filas, s.aplicaciones, s.productos).filter((p) => p.libre && p.libre > s.hoy);
  const porCuadro = s.cuadros
    .map((c) => {
      const ps = plazos.filter((p) => p.fila.cuadro_id === c.id);
      const max = ps.reduce<string | null>((m, p) => (!m || p.libre! > m ? p.libre : m), null);
      return { c, ps, max };
    })
    .filter((x) => x.ps.length);

  const Row = ({ t }: { t: Tarea }) => (
    <button onClick={() => setSel(t)} className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-ov-beige-light ${t.responsable_id === s.user.id ? "font-medium" : ""}`}>
      <TipoChip tipo={t.tipo} className="w-32 shrink-0" />
      <span className="flex-1 truncate text-foreground">{t.titulo}</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{nombreCuadro(s.cuadros, t.cuadro_id)}</span>
      <span className="text-xs text-muted-foreground">{fmt(t.fecha_fin)}</span>
    </button>
  );
  const Empty = ({ children }: { children: ReactNode }) => <p className="py-2 text-sm text-muted-foreground">{children}</p>;

  return (
    <>
      <PageHeader title="Información relevante" subtitle={`Hoy es ${fmt(s.hoy)} · Villa Iris`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Atrasadas" icon={<AlertTriangle className="size-5 text-danger" />} count={atrasadas.length} to="/calendario" danger>
          {atrasadas.length ? atrasadas.slice(0, 6).map((t) => <Row key={t.id} t={t} />) : <Empty>No hay tareas atrasadas.</Empty>}
        </Card>
        <Card title="Esta semana" icon={<CalendarClock className="size-5 text-ov-olive-light" />} count={estaSemana.length} to="/calendario">
          {estaSemana.length ? estaSemana.slice(0, 6).map((t) => <Row key={t.id} t={t} />) : <Empty>No hay tareas para esta semana.</Empty>}
        </Card>
        <Card title="Próximos 30 días" icon={<CalendarRange className="size-5 text-ov-olive-light" />} count={proximos.length} to="/calendario">
          {proximos.length ? proximos.slice(0, 6).map((t) => <Row key={t.id} t={t} />) : <Empty>Nada previsto.</Empty>}
        </Card>
        <Card title="Plazos de seguridad activos" icon={<ShieldAlert className="size-5 text-danger" />} count={plazos.length} to="/tratamientos">
          {porCuadro.length ? (
            porCuadro.map(({ c, ps, max }) => (
              <Link key={c.id} to="/tratamientos" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-ov-beige-light">
                <span className="text-foreground">
                  {c.nombre} · {ps.length} filas
                </span>
                <span className="status-danger rounded-full px-2 py-0.5 text-xs">
                  Libre {fmt(max)} · faltan {diffDays(max!, s.hoy)} días
                </span>
              </Link>
            ))
          ) : (
            <Empty>Todas las filas se pueden cosechar.</Empty>
          )}
        </Card>
        {s.isAdmin && (
          <Card title="Stock bajo" icon={<Package className="size-5 text-danger" />} count={stockBajo.length} to="/stock" danger>
            {stockBajo.length ? (
              stockBajo.map((p) => (
                <Link key={p.id} to="/productos/$id" params={{ id: p.id }} className="flex justify-between rounded-md px-2 py-2 text-sm hover:bg-ov-beige-light">
                  <span className="text-foreground">{p.nombre_comercial}</span>
                  <span className="text-danger">
                    {num(p.stock_actual, 3)} / mín. {num(p.stock_minimo)} {p.unidad_stock}
                  </span>
                </Link>
              ))
            ) : (
              <Empty>Todo el stock está por encima del mínimo.</Empty>
            )}
          </Card>
        )}
      </div>
      {sel && <TaskDialog tarea={sel} onClose={() => setSel(null)} />}
    </>
  );
}
