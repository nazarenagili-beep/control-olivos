import { CheckCircle2, Clock, Loader } from "lucide-react";
import { useStore } from "@/lib/store";
import { addDays, fmt } from "@/lib/logic";
import { TipoChip } from "./ov";

/** Tabla por tarea vigente: estado, % hecho, filas hechas / faltan, plazo y última fecha. */
export function AvanceTareas() {
  const s = useStore();
  const activas = s.tareas.filter((t) => t.fecha_inicio <= addDays(s.hoy, 60) && t.fecha_fin >= addDays(s.hoy, -90));

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
    .sort((a, b) => Number(a.t.fecha_inicio > s.hoy) - Number(b.t.fecha_inicio > s.hoy) || a.pct - b.pct);

  const Estado = ({ pct, futura }: { pct: number; futura: boolean }) => {
    if (pct === 100)
      return <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs"><CheckCircle2 className="size-3.5 text-ov-olive-light" /> Hecha</span>;
    if (futura)
      return <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"><Clock className="size-3.5" /> Próxima</span>;
    if (pct > 0)
      return <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs"><Loader className="size-3.5 text-muted-foreground" /> En curso</span>;
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-danger"><Clock className="size-3.5" /> Sin empezar</span>;
  };

  return (
    <section>
      <h3 className="mb-1 text-xl">Avance de las tareas</h3>
      <p className="mb-4 text-sm text-muted-foreground">Tareas en curso, las de los últimos 3 meses y las que empiezan pronto.</p>
      {datos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay tareas previstas para estas fechas.</p>
      ) : (
        <div className="ov-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tarea</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Avance</th>
                <th className="px-3 py-3 text-right font-medium">Hechas</th>
                <th className="px-3 py-3 text-right font-medium">Faltan</th>
                <th className="px-3 py-3 font-medium">Plazo</th>
                <th className="px-4 py-3 font-medium">Último trabajo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {datos.map(({ t, pct, totalFilas, filasHechas, ultima }) => {
                const futura = t.fecha_inicio > s.hoy;
                const faltan = totalFilas - filasHechas;
                return (
                  <tr key={t.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{t.titulo}</td>
                    <td className="px-3 py-3"><TipoChip tipo={t.tipo} /></td>
                    <td className="px-3 py-3"><Estado pct={pct} futura={futura} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-ov-beige-light">
                          <div className="h-full bg-ov-olive-light" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-9 text-right tabular-nums">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{filasHechas}</td>
                    <td className={`px-3 py-3 text-right tabular-nums ${faltan ? "font-semibold text-danger" : ""}`}>{faltan}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {futura ? `empieza ${fmt(t.fecha_inicio)}` : t.fecha_fin < s.hoy ? `terminó ${fmt(t.fecha_fin)}` : `hasta ${fmt(t.fecha_fin)}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ultima ? fmt(ultima.slice(0, 10)) : "todavía nada"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
