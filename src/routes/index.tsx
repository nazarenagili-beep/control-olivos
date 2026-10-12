import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { addDays, esAtrasada, fmt, plazosPorFila } from "@/lib/logic";
import type { Tarea } from "@/lib/data";
import { PageHeader, TipoChip, seccionesTexto } from "@/components/ov";
import { CampoMapa } from "@/components/CampoMapa";
import { TaskDialog } from "@/components/TaskDialog";

export const Route = createFileRoute("/")({
  head: () => pageHead("Inicio", "Resumen del campo: trabajos realizados, avance de cada labor y pendientes."),
  component: Inicio,
});

const FILTROS = [
  { k: 1, l: "Ayer" },
  { k: 3, l: "3 días" },
  { k: 7, l: "7 días" },
  { k: 15, l: "15 días" },
  { k: 30, l: "30 días" },
  { k: 90, l: "90 días" },
  { k: 0, l: "Todo" },
];

const hora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Inicio() {
  const s = useStore();
  const [dias, setDias] = useState(7);
  const [sel, setSel] = useState<Tarea | null>(null);
  const nombre = (id: string) => s.usuarios.find((u) => u.id === id)?.nombre ?? "—";

  const historial = useMemo(() => {
    const desde = dias ? Date.now() - dias * 86400000 : 0;
    const regs = s.registros.map((r) => ({ id: r.id, fecha: r.fecha, titulo: r.titulo, tipo: r.tipo, tarea_id: r.tarea_id, detalle: seccionesTexto(s.filas, r.secciones), accion: r.accion, quien: nombre(r.usuario_id) }));
    const apps = s.aplicaciones.map((a) => {
      const p = s.productos.find((x) => x.id === a.producto_id);
      return { id: a.id, fecha: `${a.fecha}T12:00:00-03:00`, titulo: `Aplicación: ${p?.nombre_comercial ?? "producto"}`, tipo: "tratamiento" as const, tarea_id: a.tarea_id ?? null, detalle: `${a.litros_caldo} L de caldo`, accion: "hecho" as const, quien: nombre((a as { aplicador_id?: string }).aplicador_id ?? "") };
    });
    return [...regs, ...apps].filter((x) => new Date(x.fecha).getTime() >= desde).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [s.registros, s.aplicaciones, dias, s.filas]);

  const totalSecs = s.filas.length * 2;
  const enCurso = s.tareas
    .filter((t) => t.estado !== "hecha" && (t.estado === "en_curso" || (t.fecha_inicio <= s.hoy && t.fecha_fin >= s.hoy)))
    .map((t) => {
      const objetivo = t.secciones.length ? t.secciones : s.filas.filter((f) => !t.cuadro_id || f.cuadro_id === t.cuadro_id).flatMap((f) => [`${f.id}:A`, `${f.id}:B`]);
      const hechas = new Set(t.secciones_hechas);
      const faltan = objetivo.filter((k) => !hechas.has(k));
      const has = [...new Set(faltan.map((k) => s.filas.find((f) => f.id === k.split(":")[0])?.numero).filter(Boolean).map((n) => Math.ceil(n! / 7)))].sort((a, b) => a - b);
      const pct = objetivo.length ? Math.round(((objetivo.length - faltan.length) / objetivo.length) * 100) : 0;
      return { t, pct, has, atrasada: esAtrasada(t, s.hoy) };
    })
    .sort((a, b) => b.pct - a.pct);

  const ultimo = s.registros[0];
  const plazos = plazosPorFila(s.filas, s.aplicaciones, s.productos).filter((p) => p.libre && p.libre > s.hoy).length;
  const stockBajo = s.productos.filter((p) => p.activo && p.stock_actual < p.stock_minimo).length;
  const atrasadas = s.tareas.filter((t) => t.estado !== "hecha" && esAtrasada(t, s.hoy)).length;
  const semana = s.registros.filter((r) => r.accion === "hecho" && Date.now() - new Date(r.fecha).getTime() < 7 * 86400000).reduce((n, r) => n + r.secciones.length, 0);
  void addDays; void totalSecs;

  const Kpi = ({ t, v, sub, danger }: { t: string; v: string | number; sub: string; danger?: boolean }) => (
    <div className="ov-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{t}</div>
      <div className={`font-display text-3xl ${danger ? "text-danger" : ""}`}>{v}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );

  return (
    <>
      <PageHeader title={`Buen día, ${s.user.nombre.split(" ")[0]}`} subtitle={`Hoy es ${fmt(s.hoy)} · Villa Iris`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi t="Último trabajo" v={ultimo ? fmt(ultimo.fecha.slice(0, 10)) : "—"} sub={ultimo ? `${ultimo.titulo} · ${nombre(ultimo.usuario_id)}` : "Sin registros"} />
        <Kpi t="Medias filas hechas" v={semana} sub="en los últimos 7 días" />
        <Kpi t="Tareas atrasadas" v={atrasadas} sub="fuera de su fecha" danger={atrasadas > 0} />
        <Kpi t="Alertas" v={plazos + stockBajo} sub={`${plazos} filas en espera · ${stockBajo} stock bajo`} danger={plazos + stockBajo > 0} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="ov-card p-5">
          <h3 className="mb-3 text-xl">Trabajos realizados</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button key={f.k} onClick={() => setDias(f.k)} className={`rounded-full border px-3 py-1 text-sm ${dias === f.k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto">
            {historial.length === 0 && <p className="text-sm text-muted-foreground">No hay trabajos registrados en este período.</p>}
            {historial.map((h) => (
              <button key={h.id} onClick={() => setSel(s.tareas.find((t) => t.id === h.tarea_id) ?? null)} className="block w-full rounded-md border border-border p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{hora(h.fecha)}</span>
                  <span>{h.quien}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <TipoChip tipo={h.tipo} />
                  <span className={`font-medium ${h.accion === "desmarcado" ? "line-through opacity-60" : ""}`}>{h.titulo}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {h.accion === "desmarcado" ? "Desmarcado: " : ""}
                  {h.detalle}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ov-card p-5">
          <h3 className="mb-3 text-xl">Labores en curso y pendientes</h3>
          <div className="max-h-[530px] space-y-3 overflow-y-auto">
            {enCurso.length === 0 && <p className="text-sm text-muted-foreground">No hay labores en curso ahora.</p>}
            {enCurso.map(({ t, pct, has, atrasada }) => (
              <button key={t.id} onClick={() => setSel(t)} className="block w-full rounded-md border border-border p-3 text-left hover:bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t.titulo}</span>
                  <span className={`text-sm ${atrasada ? "text-danger" : "text-muted-foreground"}`}>{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {pct === 100 ? "Completado" : `Falta: ${has.map((h) => `Ha ${h}`).join(", ")}`} · hasta {fmt(t.fecha_fin)}
                </div>
              </button>
            ))}
          </div>
          <Link to="/calendario" className="mt-3 inline-block text-sm underline">Ver calendario completo</Link>
        </section>
      </div>

      <CampoMapa />
      {sel && <TaskDialog open tarea={sel} onClose={() => setSel(null)} />}
    </>
  );
}
