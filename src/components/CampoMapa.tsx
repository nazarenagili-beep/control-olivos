import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useStore } from "@/lib/store";
import { addDays, fmt, num } from "@/lib/logic";
import type { Aplicacion, Tarea } from "@/lib/data";
import { MapaFilas, TipoChip, haDeFila } from "./ov";

export function CampoMapa() {
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const desde = addDays(s.hoy, -90);
  const cuadroDe = (k: string) => s.filas.find((f) => f.id === k.split(":")[0])?.cuadro_id;
  const cubre = (cuadro: string | null, secs: string[], k: string) =>
    (!cuadro || cuadro === cuadroDe(k)) && (secs.length === 0 || secs.includes(k));
  const tareasEn = (k: string): Tarea[] =>
    s.tareas.filter((t) => (t.estado === "hecha" && (t.completada_en ?? t.fecha_fin).slice(0, 10) >= desde && cubre(t.cuadro_id, t.secciones, k)) || t.secciones_hechas.includes(k));
  const appsEn = (k: string): Aplicacion[] => s.aplicaciones.filter((a) => a.fecha >= desde && cubre(a.cuadro_id, a.secciones, k));
  const conHistoria = s.filas.flatMap((f) => [`${f.id}:A`, `${f.id}:B`]).filter((k) => tareasEn(k).length || appsEn(k).length);

  const fila = sel ? s.filas.find((f) => f.id === sel.split(":")[0]) : null;
  const cuadro = fila ? s.cuadros.find((c) => c.id === fila.cuadro_id) : null;
  const ts = sel ? tareasEn(sel).sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin)) : [];
  const as = sel ? appsEn(sel).sort((a, b) => b.fecha.localeCompare(a.fecha)) : [];

  return (
    <section className="ov-card overflow-hidden">
      <div className="ov-gradient h-1" />
      <div className="p-5">
        <h3 className="text-xl">Mapa del campo</h3>
        <p className="mb-4 text-sm text-muted-foreground">Toca una mitad de fila para ver qué se ha hecho allí. En verde, las zonas con trabajos de los últimos 90 días.</p>
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_320px]">
          {s.cuadros.map((c) => (
            <div key={c.id}>
              <p className="mb-2 text-sm text-foreground">{c.nombre} · {c.hectareas} ha</p>
              <MapaFilas
                modo="progreso"
                filas={s.filas.filter((f) => f.cuadro_id === c.id)}
                value={conHistoria.filter((k) => cuadroDe(k) === c.id)}
                onPick={setSel}
                seleccionada={sel ?? undefined}
              />
            </div>
          ))}
          <aside className="rounded-lg border border-border p-4 text-sm lg:col-span-2 2xl:col-span-1 2xl:sticky 2xl:top-20 2xl:self-start">
            {!sel || !fila ? (
              <p className="text-muted-foreground">Elige una zona en el mapa.</p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg">
                  {cuadro?.nombre} · Hectárea {haDeFila(fila.numero)} · Fila {fila.numero} · Zona {sel.split(":")[1]}
                </h3>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Tareas hechas</p>
                  {ts.length === 0 ? <p className="text-muted-foreground">Ninguna todavía.</p> : (
                    <ul className="space-y-2">
                      {ts.map((t) => (
                        <li key={t.id} className="flex flex-col gap-0.5">
                          <TipoChip tipo={t.tipo} />
                          <span className="text-foreground">{t.titulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.estado === "hecha" ? `Hecha el ${fmt(t.completada_en ?? t.fecha_fin)}` : "Hecha en esta zona (tarea en curso)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Tratamientos aplicados</p>
                  {as.length === 0 ? <p className="text-muted-foreground">Ninguno.</p> : (
                    <ul className="space-y-2">
                      {as.map((a) => {
                        const p = s.productos.find((x) => x.id === a.producto_id);
                        return (
                          <li key={a.id} className="flex gap-2">
                            <FlaskConical className="mt-0.5 size-4 shrink-0 text-ov-olive-light" />
                            <span>
                              <span className="text-foreground">{p?.nombre_comercial}</span> · {fmt(a.fecha)}
                              <br />
                              <span className="text-xs text-muted-foreground">{num(a.cantidad_producto, 3)} {p?.unidad_stock} · libre para cosechar {fmt(a.fecha_libre_cosecha)}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
