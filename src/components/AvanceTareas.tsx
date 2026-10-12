import { useStore } from "@/lib/store";
import { fmt } from "@/lib/logic";
import { TipoChip } from "./ov";

/** Tarjetas por tarea vigente: % hecho, filas hechas / faltan, última fecha. */
export function AvanceTareas() {
  const s = useStore();
  const activas = s.tareas.filter((t) => t.fecha_inicio <= s.hoy && t.fecha_fin >= s.hoy);

  const datos = activas
    .map((t) => {
      const secs = t.secciones.length
        ? t.secciones
        : s.filas.filter((f) => !t.cuadro_id || f.cuadro_id === t.cuadro_id).flatMap((f) => [`${f.id}:A`, `${f.id}:B`]);
      const hechas = t.estado === "hecha" ? secs : secs.filter((k) => t.secciones_hechas.includes(k));
      const filasDe = (ks: string[]) => new Set(ks.map((k) => k.split(":")[0]));
      const totalFilas = filasDe(secs).size;
      const filasHechas = [...filasDe(secs)].filter((f) => secs.filter((k) => k.startsWith(f + ":")).every((k) => hechas.includes(k))).length;
      const ultima = s.registros.filter((r) => r.tarea_id === t.id && r.accion === "hecho").map((r) => r.fecha).sort().pop() ?? t.completada_en ?? null;
      const pct = secs.length ? Math.round((hechas.length / secs.length) * 100) : 0;
      return { t, pct, totalFilas, filasHechas, ultima };
    })
    .sort((a, b) => a.pct - b.pct);

  return (
    <section>
      <h3 className="mb-1 text-xl">Avance de las tareas de ahora</h3>
      <p className="mb-4 text-sm text-muted-foreground">Tareas previstas para hoy en el plan y cuánto se ha hecho de cada una.</p>
      {datos.length === 0 && <p className="text-sm text-muted-foreground">No hay tareas previstas para estas fechas.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {datos.map(({ t, pct, totalFilas, filasHechas, ultima }) => (
          <div key={t.id} className="ov-card p-4">
            <TipoChip tipo={t.tipo} />
            <div className="mt-2 font-medium text-foreground">{t.titulo}</div>
            <div className="mt-2 flex items-end justify-between">
              <span className={`font-display text-4xl ${pct === 100 ? "text-ov-olive-light" : ""}`}>{pct}%</span>
              <span className="text-xs text-muted-foreground">hasta {fmt(t.fecha_fin)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ov-beige-light">
              <div className="h-full bg-ov-olive-light" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><b>{filasHechas}</b> filas hechas</div>
              <div><b className={totalFilas - filasHechas ? "text-danger" : ""}>{totalFilas - filasHechas}</b> faltan</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Último trabajo: {ultima ? fmt(ultima.slice(0, 10)) : "todavía nada"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
