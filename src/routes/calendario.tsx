import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { pageHead } from "@/lib/head";
import { nombreCuadro, useStore } from "@/lib/store";
import { conflictosCosecha, esAtrasada, fmt } from "@/lib/logic";
import { ESTADO_LABEL, TIPO_LABEL, type EstadoTarea, type Tarea, type TipoTarea } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstadoBadge, SimpleSelect, TIPO_BG, TIPO_ICON, TipoChip, PageHeader, seccionesTexto } from "@/components/ov";
import { TaskDialog, nuevaTarea } from "@/components/TaskDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  head: () => pageHead("Calendario", "Calendario anual de tareas por cuadro y fila del olivar."),
  component: Calendario,
});

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const pad = (n: number) => String(n).padStart(2, "0");

function Calendario() {
  const s = useStore();
  const [y, m] = s.hoy.split("-").map(Number);
  const [anio, setAnio] = useState(y);
  const [mes, setMes] = useState(m);
  const [vista, setVista] = useState<"mes" | "lista">("mes");
  const [sel, setSel] = useState<Tarea | null>(null);
  const [fCuadro, setFCuadro] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fEstado, setFEstado] = useState("todos");
  const [fResp, setFResp] = useState("todos");
  useEffect(() => {
    if (window.innerWidth < 768) setVista("lista");
  }, []);

  const filtradas = useMemo(
    () =>
      s.tareas.filter(
        (t) =>
          (fCuadro === "todos" || (fCuadro === "campo" ? !t.cuadro_id : t.cuadro_id === fCuadro)) &&
          (fTipo === "todos" || t.tipo === fTipo) &&
          (fEstado === "todos" || t.estado === fEstado) &&
          (fResp === "todos" || (fResp === "none" ? !t.responsable_id : t.responsable_id === fResp)),
      ),
    [s.tareas, fCuadro, fTipo, fEstado, fResp],
  );
  const ini = `${anio}-${pad(mes)}-01`;
  const diasMes = new Date(anio, mes, 0).getDate();
  const fin = `${anio}-${pad(mes)}-${pad(diasMes)}`;
  const delMes = filtradas.filter((t) => t.fecha_inicio <= fin && t.fecha_fin >= ini).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  const offset = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;
  const conflicto = (t: Tarea) => conflictosCosecha(t, s.filas, s.aplicaciones, s.productos).length > 0 && t.estado !== "hecha";

  const mover = (d: number) => {
    let nm = mes + d, ny = anio;
    if (nm < 1) { nm = 12; ny--; }
    if (nm > 12) { nm = 1; ny++; }
    setMes(nm); setAnio(ny);
  };

  const Evento = ({ t, compact }: { t: Tarea; compact?: boolean }) => {
    const Icon = TIPO_ICON[t.tipo];
    const atr = esAtrasada(t, s.hoy);
    return (
      <button
        onClick={() => setSel(t)}
        className={cn(
          "flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] text-ov-white-broken",
          TIPO_BG[t.tipo],
          t.tipo === "tratamiento" && "text-ov-olive-dark",
          atr && "ring-2 ring-danger",
          t.estado === "hecha" && "opacity-50 line-through",
        )}
        title={`${TIPO_LABEL[t.tipo]} · ${t.titulo} · ${ESTADO_LABEL[t.estado]}`}
      >
        {conflicto(t) ? <AlertTriangle className="size-3 shrink-0" /> : <Icon className="size-3 shrink-0" />}
        {!compact && <span className="truncate">{t.titulo}</span>}
      </button>
    );
  };

  return (
    <>
      <PageHeader
        title="Calendario"
        subtitle="Tareas por cuadro, fila y zona"
        actions={
          s.isAdmin && (
            <Button onClick={() => setSel(nuevaTarea(s.hoy))}>
              <Plus /> Nueva tarea
            </Button>
          )
        }
      />
      <div className="ov-card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => mover(-1)} aria-label="Mes anterior"><ChevronLeft /></Button>
          <h2 className="w-48 text-center text-2xl">{MESES[mes - 1]} {anio}</h2>
          <Button variant="ghost" size="icon" onClick={() => mover(1)} aria-label="Mes siguiente"><ChevronRight /></Button>
        </div>
        <Tabs value={vista} onValueChange={(v) => setVista(v as "mes" | "lista")}>
          <TabsList><TabsTrigger value="mes">Mes</TabsTrigger><TabsTrigger value="lista">Lista</TabsTrigger></TabsList>
        </Tabs>
        <div className="ml-auto grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-4">
          <SimpleSelect value={fCuadro} onChange={setFCuadro} options={[{ value: "todos", label: "Todos los cuadros" }, { value: "campo", label: "Todo el campo" }, ...s.cuadros.map((c) => ({ value: c.id, label: c.nombre }))]} className="md:w-44" />
          <SimpleSelect value={fTipo} onChange={setFTipo} options={[{ value: "todos", label: "Todos los tipos" }, ...(Object.keys(TIPO_LABEL) as TipoTarea[]).map((k) => ({ value: k, label: TIPO_LABEL[k] }))]} className="md:w-40" />
          <SimpleSelect value={fEstado} onChange={setFEstado} options={[{ value: "todos", label: "Todos los estados" }, ...(Object.keys(ESTADO_LABEL) as EstadoTarea[]).map((k) => ({ value: k, label: ESTADO_LABEL[k] }))]} className="md:w-40" />
          <SimpleSelect value={fResp} onChange={setFResp} options={[{ value: "todos", label: "Cualquier responsable" }, { value: "none", label: "Sin responsable" }, ...s.usuarios.map((u) => ({ value: u.id, label: u.nombre }))]} className="md:w-44" />
        </div>
      </div>

      {vista === "mes" ? (
        <div className="ov-card overflow-hidden">
          <div className="grid grid-cols-7 bg-ov-beige-light text-center text-xs uppercase tracking-wider">
            {DIAS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="min-h-28 border-b border-r border-border bg-ov-white-broken/40" />)}
            {Array.from({ length: diasMes }).map((_, i) => {
              const d = `${anio}-${pad(mes)}-${pad(i + 1)}`;
              const evs = delMes.filter((t) => t.fecha_inicio === d || (i === 0 && t.fecha_inicio < ini) || (t.fecha_inicio < d && t.fecha_fin >= d && (offset + i) % 7 === 0));
              return (
                <div key={d} className={cn("min-h-28 space-y-1 border-b border-r border-border p-1.5", d === s.hoy && "bg-ov-gold/10")}>
                  <div className={cn("text-xs", d === s.hoy ? "font-bold text-foreground" : "text-muted-foreground")}>{i + 1}</div>
                  {evs.slice(0, 4).map((t) => <Evento key={t.id} t={t} />)}
                  {evs.length > 4 && <div className="text-[11px] text-muted-foreground">+{evs.length - 4} más</div>}
                </div>
              );
            })}
          </div>
          {delMes.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Sin tareas este mes.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {delMes.length === 0 && <p className="ov-card p-6 text-center text-sm text-muted-foreground">Sin tareas este mes.</p>}
          {delMes.map((t) => (
            <button key={t.id} onClick={() => setSel(t)} className={cn("ov-card flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-ov-beige-light/40", esAtrasada(t, s.hoy) && "border-danger-border")}>
              <TipoChip tipo={t.tipo} className="w-32" />
              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2 text-foreground">
                  {conflicto(t) && <AlertTriangle className="size-4 text-danger" />}
                  {t.titulo}
                </div>
                <div className="text-xs text-muted-foreground">
                  {nombreCuadro(s.cuadros, t.cuadro_id)} · {filasTexto(s.filas, t.fila_ids)} · {zonaLabel(t.zona)}
                </div>
              </div>
              <span className="text-sm">{fmt(t.fecha_inicio)} – {fmt(t.fecha_fin)}</span>
              <EstadoBadge estado={t.estado} atrasada={esAtrasada(t, s.hoy)} />
            </button>
          ))}
        </div>
      )}
      {sel && <TaskDialog tarea={sel} onClose={() => setSel(null)} />}
    </>
  );
}
