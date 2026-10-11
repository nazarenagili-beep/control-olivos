import type { Aplicacion, Fila, Producto, Tarea, UnidadDosis } from "./data";

export function hoyAR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}
export function fmt(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
export function diffDays(a: string, b: string): number {
  return Math.round((new Date(a + "T12:00:00Z").getTime() - new Date(b + "T12:00:00Z").getTime()) / 86400000);
}
export const num = (n: number, dec = 2) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: dec });
export const ars = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** Cantidad en ml o g para los litros de caldo dados. */
export function cantidadBase(dosis: number, unidad: UnidadDosis, litros: number): number {
  return unidad.endsWith("100L") ? (dosis * litros) / 100 : dosis * litros;
}
export const unidadBase = (u: UnidadDosis) => (u.startsWith("ml") ? "ml" : "g");
export const unidadGrande = (u: UnidadDosis) => (u.startsWith("ml") ? "L" : "kg");

export function esAtrasada(t: Tarea, hoy: string) {
  return t.estado !== "hecha" && t.fecha_fin < hoy;
}

export interface PlazoFila {
  fila: Fila;
  aplicacion?: Aplicacion;
  producto?: Producto;
  libre: string | null;
}
/** Equivalente a la vista v_plazos_activos: fecha libre más lejana por fila. */
export function plazosPorFila(filas: Fila[], apps: Aplicacion[], productos: Producto[]): PlazoFila[] {
  return filas.map((fila) => {
    let best: Aplicacion | undefined;
    for (const a of apps) {
      if (a.cuadro_id !== fila.cuadro_id) continue;
      if (a.fila_ids.length && !a.fila_ids.includes(fila.id)) continue;
      if (!best || a.fecha_libre_cosecha > best.fecha_libre_cosecha) best = a;
    }
    return {
      fila,
      aplicacion: best,
      producto: best && productos.find((p) => p.id === best!.producto_id),
      libre: best?.fecha_libre_cosecha ?? null,
    };
  });
}

export function conflictosCosecha(
  t: Pick<Tarea, "tipo" | "cuadro_id" | "fila_ids" | "fecha_inicio">,
  filas: Fila[],
  apps: Aplicacion[],
  productos: Producto[],
): PlazoFila[] {
  if (t.tipo !== "cosecha") return [];
  const objetivo = filas.filter(
    (f) => (!t.cuadro_id || f.cuadro_id === t.cuadro_id) && (!t.fila_ids.length || t.fila_ids.includes(f.id)),
  );
  return plazosPorFila(objetivo, apps, productos).filter((p) => p.libre && p.libre > t.fecha_inicio);
}
