import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { esAtrasada, fmt } from "@/lib/logic";
import type { Fila, Tarea } from "@/lib/data";
import { TIPO_BG, haDeFila } from "./ov";

const ESTACIONES = [
  { key: "verano", label: "Verano (dic, ene, feb)", meses: [12, 1, 2] },
  { key: "otono", label: "Otoño (mar, abr, may)", meses: [3, 4, 5] },
  { key: "invierno", label: "Invierno (jun, jul, ago)", meses: [6, 7, 8] },
  { key: "primavera", label: "Primavera (sep, oct, nov)", meses: [9, 10, 11] },
];

/** Vista tipo planilla: tareas por estación (filas) × filas del olivar agrupadas por hectárea (columnas). */
export function MatrizTareas({ tareas, anio, onOpen }: { tareas: Tarea[]; anio: number; onOpen: (t: Tarea) => void }) {
  const s = useStore();
  // Arrastre: seleccionar varias mitades de fila de una misma tarea y marcarlas/desmarcarlas de una vez.
  const [drag, setDrag] = useState<{ tareaId: string; marcar: boolean; secs: string[] } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-sec]");
      const d = dragRef.current;
      if (!el || !d || el.dataset.tarea !== d.tareaId) return;
      const sec = el.dataset.sec!;
      if (!d.secs.includes(sec)) setDrag({ ...d, secs: [...d.secs, sec] });
    };
    const up = () => {
      const d = dragRef.current;
      if (d) {
        const t = s.tareas.find((x) => x.id === d.tareaId);
        if (t) {
          const set = new Set(t.secciones_hechas);
          d.secs.forEach((f) => [`${f}:A`, `${f}:B`].forEach((k) => (d.marcar ? set.add(k) : set.delete(k))));
          s.setSeccionesHechas(t.id, [...set]);
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag !== null]); // eslint-disable-line react-hooks/exhaustive-deps
  const filas = [...s.filas].sort((a, b) => a.numero - b.numero);
  const has = [...new Set(filas.map((f) => haDeFila(f.numero)))];
  const delAnio = tareas.filter((t) => t.fecha_inicio.slice(0, 4) === String(anio));
  const mensuales = delAnio.filter((t) => t.recurrencia === "mensual");
  const unicos = (ts: Tarea[]) => {
    const vistos = new Set<string>();
    return ts.filter((t) => (vistos.has(t.titulo + t.cuadro_id) ? false : (vistos.add(t.titulo + t.cuadro_id), true)));
  };
  const largo = (t: Tarea) => t.recurrencia === "ninguna" && t.fecha_fin.slice(5) === "12-31" && t.fecha_inicio.slice(5) === "01-01";
  const grupos = [
    ...ESTACIONES.map((e) => ({
      label: e.label,
      tareas: delAnio
        .filter((t) => t.recurrencia !== "mensual" && !largo(t) && e.meses.includes(Number(t.fecha_inicio.slice(5, 7))))
        .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)),
      tono: "bg-ov-stone/25",
    })),
    { label: "Tareas diarias / control", tareas: unicos(mensuales.filter((t) => t.estado !== "hecha")).slice(0, 10), tono: "bg-ov-olive-light/25" },
    { label: "Tareas puntuales", tareas: delAnio.filter(largo), tono: "bg-t-cosecha/20" },
  ];

  const celda = (t: Tarea, f: Fila) => {
    const aplica = (!t.cuadro_id || t.cuadro_id === f.cuadro_id) && (!t.secciones.length || t.secciones.some((k) => k.startsWith(f.id + ":")));
    if (!aplica) return null;
    const a = t.estado === "hecha" || t.secciones_hechas.includes(`${f.id}:A`);
    const b = t.estado === "hecha" || t.secciones_hechas.includes(`${f.id}:B`);
    return { a, b };
  };

  return (
    <div className="ov-card overflow-x-auto">
      <table className="border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-64 border border-border bg-ov-gold/40 p-1.5 text-left text-xs uppercase text-foreground">Tareas {anio}</th>
            {has.map((h) => (
              <th key={h} colSpan={filas.filter((f) => haDeFila(f.numero) === h).length} className="border border-border bg-ov-gold/40 p-1 font-normal text-foreground">
                Hectárea {h}
              </th>
            ))}
          </tr>
          <tr>
            <th className="sticky left-0 z-10 border border-border bg-ov-gold/20 p-1 text-left font-normal text-muted-foreground">Filas</th>
            {filas.map((f) => (
              <th key={f.id} className="min-w-10 whitespace-nowrap border border-border bg-ov-gold/20 px-1 py-0.5 font-normal">Fila {f.numero}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <Fragment key={g.label}>
              <tr>
                <td className={cn("sticky left-0 z-10 border border-border p-1.5 text-xs font-bold text-foreground", g.tono)}>{g.label}</td>
                <td colSpan={filas.length} className={cn("border border-border", g.tono)} />
              </tr>
              {g.tareas.length === 0 && (
                <tr>
                  <td className="sticky left-0 z-10 border border-border bg-card p-1.5 italic text-muted-foreground">Sin tareas</td>
                  <td colSpan={filas.length} className="border border-border" />
                </tr>
              )}
              {g.tareas.map((t) => (
                <tr key={t.id} className="hover:bg-ov-beige-light/40">
                  <td className="sticky left-0 z-10 border border-border bg-card p-0">
                    <button onClick={() => onOpen(t)} className={cn("flex w-full items-center gap-1.5 p-1.5 text-left italic hover:underline", esAtrasada(t, s.hoy) && "text-danger")}>
                      <span className={cn("size-2 shrink-0 rounded-full", TIPO_BG[t.tipo])} />
                      <span className="truncate">{t.titulo}</span>
                      <span className="ml-auto shrink-0 not-italic text-muted-foreground">{fmt(t.fecha_inicio).slice(0, 5)}</span>
                    </button>
                  </td>
                  {filas.map((f) => {
                    const c = celda(t, f);
                    return (
                      <td key={f.id} className="border border-border p-0">
                        {c && (() => {
                            const hecha = c.a && c.b;
                            const enSel = drag?.tareaId === t.id && drag.secs.includes(f.id);
                            const ver = enSel ? drag!.marcar : hecha;
                            return (
                              <span
                                data-sec={f.id}
                                data-tarea={t.id}
                                title={`Fila ${f.numero}: ${hecha ? "hecha" : c.a || c.b ? "a medias" : "pendiente"}`}
                                style={{ touchAction: "none" }}
                                onPointerDown={(e) => {
                                  if (t.estado === "hecha") return onOpen(t);
                                  e.preventDefault();
                                  setDrag({ tareaId: t.id, marcar: !hecha, secs: [f.id] });
                                }}
                                className={cn("block h-6 w-full cursor-pointer select-none", ver ? "bg-ov-olive-light" : c.a || c.b ? "bg-ov-olive-light/40" : "bg-ov-beige-light", enSel && "ring-2 ring-inset ring-ov-olive-dark")}
                              />
                            );
                          })()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 border-t border-border p-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 bg-ov-olive-light" /> Hecho</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-5 bg-ov-beige-light" /> Pendiente</span>
        <span>Tocá o arrastrá sobre las casillas de una tarea para marcar varias filas como hechas (o desmarcarlas) de una vez. Tocá el nombre de la tarea para ver el detalle.</span>
        <span>Cada casilla es una fila completa. Casilla vacía = la tarea no aplica a esa fila.</span>
      </div>
    </div>
  );
}
