import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Circle, Filter, X } from "lucide-react";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { addDays, fmt } from "@/lib/logic";
import { TIPO_LABEL, type Tarea, type TipoTarea } from "@/lib/data";
import { PageHeader, TipoChip, haDeFila } from "@/components/ov";
import { CampoMapa } from "@/components/CampoMapa";
import { TaskDialog } from "@/components/TaskDialog";
import { InicioTrabajador } from "@/components/InicioTrabajador";

export const Route = createFileRoute("/")({
  head: () => pageHead("Inicio", "Resumen del campo: qué se hizo y qué falta, por fecha, tarea, hectárea, fila y lado."),
  component: Inicio,
});

const PERIODOS = [1, 3, 7, 15, 30, 90];

type Item = { tarea: Tarea; fila: number; ha: number; lado: "A" | "B"; hecho: boolean; fecha: string | null; quien: string | null };

function Chips<T extends string | number>({ label, value, onChange, opts }: { label: string; value: T; onChange: (v: T) => void; opts: { v: T; l: string }[] }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button
            key={String(o.v)}
            onClick={() => onChange(o.v)}
            className={`rounded-full border px-3 py-1 text-sm ${value === o.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Inicio() {
  const s = useStore();
  return s.isAdmin ? <InicioAdmin /> : <InicioTrabajador />;
}

function InicioAdmin() {
  const s = useStore();
  const [dias, setDias] = useState(7);
  const [tipo, setTipo] = useState<TipoTarea | "todos">("todos");
  const [estado, setEstado] = useState<"todas" | "hecho" | "pendiente">("hecho");
  const [ha, setHa] = useState<number>(0);
  const [fila, setFila] = useState<number>(0);
  const [lado, setLado] = useState<"ambos" | "A" | "B">("ambos");
  const [sel, setSel] = useState<Tarea | null>(null);
  const [verFiltros, setVerFiltros] = useState(false);
  const nombre = (id?: string | null) => (id ? s.usuarios.find((u) => u.id === id)?.nombre ?? null : null);

  const desde = addDays(s.hoy, -dias);
  const desdeMs = Date.now() - dias * 86400000;
  const filasOrden = [...s.filas].sort((a, b) => a.numero - b.numero);

  const items = useMemo(() => {
    const out: Item[] = [];
    for (const t of s.tareas) {
      // La tarea cuenta si su ventana se cruza con el período elegido.
      if (t.fecha_inicio > s.hoy || t.fecha_fin < desde) continue;
      const secs = t.secciones.length ? t.secciones : s.filas.filter((f) => !t.cuadro_id || f.cuadro_id === t.cuadro_id).flatMap((f) => [`${f.id}:A`, `${f.id}:B`]);
      for (const k of secs) {
        const [fid, z] = k.split(":") as [string, "A" | "B"];
        const f = s.filas.find((x) => x.id === fid);
        if (!f) continue;
        const reg = s.registros.find((r) => r.tarea_id === t.id && r.secciones.includes(k));
        const hecho = t.estado === "hecha" || t.secciones_hechas.includes(k);
        const fecha = hecho ? (reg && reg.accion === "hecho" ? reg.fecha : t.completada_en ?? null) : null;
        if (hecho && fecha && new Date(fecha).getTime() < desdeMs) continue; // hecho antes del período
        out.push({ tarea: t, fila: f.numero, ha: haDeFila(f.numero), lado: z, hecho, fecha, quien: hecho ? nombre(reg?.usuario_id ?? t.completada_por) : null });
      }
    }
    return out;
  }, [s.tareas, s.registros, s.filas, dias]);

  const filtrados = items.filter(
    (i) =>
      (tipo === "todos" || i.tarea.tipo === tipo) &&
      (estado === "todas" || (estado === "hecho" ? i.hecho : !i.hecho)) &&
      (!ha || i.ha === ha) &&
      (!fila || i.fila === fila) &&
      (lado === "ambos" || i.lado === lado),
  );
  const activos = [dias !== 7, estado !== "hecho", tipo !== "todos", ha !== 0, fila !== 0, lado !== "ambos"].filter(Boolean).length;
  const hechos = filtrados.filter((i) => i.hecho).length;
  const pendientes = filtrados.length - hechos;

  const porTarea = [...filtrados.reduce((m, i) => m.set(i.tarea.id, [...(m.get(i.tarea.id) ?? []), i]), new Map<string, Item[]>()).values()]
    .map((its) => ({ t: its[0].tarea, its, hechos: its.filter((i) => i.hecho).length }))
    .sort((a, b) => b.hechos / b.its.length - a.hechos / a.its.length);

  const tiposPresentes = [...new Set(items.map((i) => i.tarea.tipo))];
  const filasDisponibles = filasOrden.filter((f) => !ha || haDeFila(f.numero) === ha);

  const textoFilas = (its: Item[]) => {
    const m = new Map<number, string[]>();
    its.forEach((i) => m.set(i.fila, [...(m.get(i.fila) ?? []), i.lado]));
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([n, zs]) => `F${n} ${zs.length === 2 ? "A+B" : zs[0]}`).join(" · ");
  };

  const Box = ({ t, v, children, tone }: { t: string; v: number | string; children?: ReactNode; tone?: string }) => (
    <div className="ov-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{t}</div>
      <div className={`font-display text-4xl ${tone ?? ""}`}>{v}</div>
      {children && <div className="text-xs text-muted-foreground">{children}</div>}
    </div>
  );

  return (
    <>
      <PageHeader title={`Buen día, ${s.user.nombre.split(" ")[0]}`} subtitle={`Hoy es ${fmt(s.hoy)} · Villa Iris`} />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button onClick={() => setVerFiltros((v) => !v)} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted" aria-label="Filtros">
          {verFiltros ? <X className="size-4" /> : <Filter className="size-4" />} Filtros
          {activos > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{activos}</span>}
        </button>
        <span className="text-sm text-muted-foreground">
          {estado === "hecho" ? "Lo realizado" : estado === "pendiente" ? "Lo pendiente" : "Todo"} en {dias === 1 ? "el último día" : `los últimos ${dias} días`}
          {tipo !== "todos" ? ` · ${TIPO_LABEL[tipo]}` : ""}{ha ? ` · Ha ${ha}` : ""}{fila ? ` · Fila ${fila}` : ""}{lado !== "ambos" ? ` · Zona ${lado}` : ""}
        </span>
        {activos > 0 && (
          <button onClick={() => { setDias(7); setEstado("hecho"); setTipo("todos"); setHa(0); setFila(0); setLado("ambos"); }} className="text-sm underline">
            Restablecer
          </button>
        )}
      </div>
      {verFiltros && <section className="ov-card mb-6 grid gap-4 p-5 md:grid-cols-2">
        <Chips label="Período" value={dias} onChange={setDias} opts={PERIODOS.map((d) => ({ v: d, l: d === 1 ? "1 día" : `${d} días` }))} />
        <Chips label="Estado" value={estado} onChange={setEstado} opts={[{ v: "todas", l: "Todas" }, { v: "hecho", l: "Realizadas" }, { v: "pendiente", l: "Pendientes" }]} />
        <Chips label="Tipo de tarea" value={tipo} onChange={setTipo} opts={[{ v: "todos" as const, l: "Todos" }, ...tiposPresentes.map((x) => ({ v: x, l: TIPO_LABEL[x] }))]} />
        <Chips label="Lado" value={lado} onChange={setLado} opts={[{ v: "ambos", l: "A y B" }, { v: "A", l: "Zona A (izq.)" }, { v: "B", l: "Zona B (der.)" }]} />
        <Chips label="Hectárea" value={ha} onChange={(v) => { setHa(v); setFila(0); }} opts={[{ v: 0, l: "Todas" }, ...[1, 2, 3, 4, 5].map((h) => ({ v: h, l: `Ha ${h}` }))]} />
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Fila</p>
          <select value={fila} onChange={(e) => setFila(Number(e.target.value))} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
            <option value={0}>Todas las filas</option>
            {filasDisponibles.map((f) => (
              <option key={f.id} value={f.numero}>Fila {f.numero} (Ha {haDeFila(f.numero)})</option>
            ))}
          </select>
        </div>
      </section>}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Box t="Realizado" v={hechos} tone="text-ov-olive-light">medias filas</Box>
        <Box t="Pendiente" v={pendientes} tone={pendientes ? "text-danger" : ""}>medias filas</Box>
        <Box t="Avance" v={filtrados.length ? `${Math.round((hechos / filtrados.length) * 100)}%` : "—"}>{porTarea.length} tareas</Box>
      </div>

      <section className="ov-card mb-6 p-5">
        <h3 className="mb-1 text-xl">Qué se hizo y qué falta</h3>
        <p className="mb-4 text-sm text-muted-foreground">Últimos {dias === 1 ? "1 día" : `${dias} días`} (desde el {fmt(desde)}). Toca una tarea para ver el detalle.</p>
        {porTarea.length === 0 && <p className="text-sm text-muted-foreground">No hay nada con estos filtros.</p>}
        <div className="space-y-3">
          {porTarea.map(({ t, its, hechos: h }) => {
            const pct = Math.round((h / its.length) * 100);
            const hechosIts = its.filter((i) => i.hecho);
            const pend = its.filter((i) => !i.hecho);
            const ultima = hechosIts.map((i) => i.fecha).filter(Boolean).sort().pop();
            const quien = hechosIts.find((i) => i.fecha === ultima)?.quien;
            return (
              <button key={t.id} onClick={() => setSel(t)} className="block w-full rounded-lg border border-border p-4 text-left hover:bg-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TipoChip tipo={t.tipo} />
                    <span className="text-base font-medium">{t.titulo}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{h} de {its.length} medias filas · {pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ov-beige-light">
                  <div className="h-full bg-ov-olive-light" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <div className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ov-olive-light" />
                    <span>
                      <b>Hecho:</b> {hechosIts.length ? textoFilas(hechosIts) : "nada todavía"}
                      {ultima && <span className="block text-xs text-muted-foreground">Último: {fmt(ultima.slice(0, 10))}{quien ? ` · ${quien}` : ""}</span>}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Circle className="mt-0.5 size-4 shrink-0 text-danger" />
                    <span>
                      <b>Falta:</b> {pend.length ? textoFilas(pend) : "completo"}
                      <span className="block text-xs text-muted-foreground">Plazo hasta {fmt(t.fecha_fin)}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <CampoMapa />
      {sel && <TaskDialog tarea={sel} onClose={() => setSel(null)} />}
    </>
  );
}
