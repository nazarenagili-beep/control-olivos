// Datos de ejemplo (fase 1: diseño). Se reemplazarán por Lovable Cloud.
export type Rol = "admin" | "campo";
export type TipoTarea =
  | "poda"
  | "abonado"
  | "tratamiento"
  | "riego"
  | "cosecha"
  | "mantenimiento"
  | "control"
  | "otro";
export type EstadoTarea = "pendiente" | "en_curso" | "hecha";
export type Zona = "A" | "B" | "ambas";
export type UnidadDosis = "ml_por_100L" | "g_por_100L" | "ml_por_L" | "g_por_L";
export type Categoria = "fungicida" | "insecticida" | "fertilizante" | "herbicida" | "otro";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}
export interface Cuadro {
  id: string;
  nombre: string;
  tipo: "productivo" | "joven";
  hectareas: number;
  notas: string;
}
export interface Fila {
  id: string;
  cuadro_id: string;
  numero: number;
  cantidad_olivos: number | null;
  notas: string;
}
export interface Tarea {
  id: string;
  titulo: string;
  tipo: TipoTarea;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  cuadro_id: string | null;
  fila_ids: string[];
  zona: Zona;
  estado: EstadoTarea;
  responsable_id: string | null;
  recurrencia: "ninguna" | "mensual" | "anual";
  origen: "plan_anual" | "manual";
  completada_en?: string;
  completada_por?: string;
  nota_cierre?: string;
  foto_nombre?: string;
  plazo_confirmado_por?: string;
  plazo_confirmado_en?: string;
}
export interface Producto {
  id: string;
  nombre_comercial: string;
  principio_activo: string;
  categoria: Categoria;
  uso: string;
  dosis_recomendada: number;
  unidad_dosis: UnidadDosis;
  unidad_stock: "L" | "kg";
  stock_actual: number;
  stock_minimo: number;
  precio_por_unidad: number;
  plazo_seguridad_dias: number;
  ficha_tecnica_nombre?: string;
  activo: boolean;
  notas: string;
}
export interface Aplicacion {
  id: string;
  fecha: string;
  producto_id: string;
  cuadro_id: string;
  fila_ids: string[];
  zona: Zona;
  litros_caldo: number;
  dosis_usada: number;
  unidad_dosis: UnidadDosis;
  cantidad_producto: number;
  aplicado_por: string;
  tarea_id: string | null;
  temperatura_c: number | null;
  viento: "calmo" | "moderado" | "fuerte";
  lluvia_prevista_24h: boolean;
  fecha_libre_cosecha: string;
  notas: string;
}
export interface Movimiento {
  id: string;
  producto_id: string;
  tipo: "compra" | "aplicacion" | "ajuste";
  cantidad: number;
  aplicacion_id?: string;
  fecha: string;
  precio_total?: number;
  nota: string;
}
export interface ConfigAvisos {
  emails_destino: string[];
  dias_antelacion_tareas: number;
  resumen_semanal_activo: boolean;
  dia_resumen: string;
  hora_envio: string;
}

export const TIPO_LABEL: Record<TipoTarea, string> = {
  poda: "Poda",
  abonado: "Abonado",
  tratamiento: "Tratamiento",
  riego: "Riego",
  cosecha: "Cosecha",
  mantenimiento: "Mantenimiento",
  control: "Control",
  otro: "Otro",
};
export const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  hecha: "Hecha",
};
export const UNIDAD_DOSIS_LABEL: Record<UnidadDosis, string> = {
  ml_por_100L: "ml/100 L",
  g_por_100L: "g/100 L",
  ml_por_L: "ml/L",
  g_por_L: "g/L",
};
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  fungicida: "Fungicida",
  insecticida: "Insecticida",
  fertilizante: "Fertilizante",
  herbicida: "Herbicida",
  otro: "Otro",
};

export const OLIVOS_POR_FILA = 34;
export const FILAS_POR_HA = 7;

export const cuadrosIniciales: Cuadro[] = [
  { id: "c-prod", nombre: "Cuadro productivo", tipo: "productivo", hectareas: 3, notas: "Olivos plantados desde 2010." },
  { id: "c-joven", nombre: "Cuadro joven", tipo: "joven", hectareas: 2, notas: "Plantado hace 3 años." },
];

export function crearFilas(cuadroId: string, desde: number, hasta: number): Fila[] {
  const out: Fila[] = [];
  for (let n = desde; n <= hasta; n++)
    out.push({ id: `${cuadroId}-f${n}`, cuadro_id: cuadroId, numero: n, cantidad_olivos: OLIVOS_POR_FILA, notas: "" });
  return out;
}

export const filasIniciales: Fila[] = [
  ...crearFilas("c-prod", 1, 3 * FILAS_POR_HA),
  ...crearFilas("c-joven", 1, 2 * FILAS_POR_HA),
];

export const usuariosIniciales: Usuario[] = [
  { id: "u-admin", nombre: "Administradora", email: "olivaresvillairenses@gmail.com", rol: "admin", activo: true },
  { id: "u-juan", nombre: "Juan (ejemplo)", email: "campo@ejemplo.com", rol: "campo", activo: true },
];

export const productosIniciales: Producto[] = [
  { id: "p-cobre", nombre_comercial: "Oxicloruro de cobre 84%", principio_activo: "Oxicloruro de cobre", categoria: "fungicida", uso: "Repilo y cierre de heridas de poda y cosecha.", dosis_recomendada: 300, unidad_dosis: "g_por_100L", unidad_stock: "kg", stock_actual: 6.5, stock_minimo: 5, precio_por_unidad: 14500, plazo_seguridad_dias: 15, ficha_tecnica_nombre: "oxicloruro.pdf", activo: true, notas: "" },
  { id: "p-spinosad", nombre_comercial: "Spinosad 48", principio_activo: "Spinosad", categoria: "insecticida", uso: "Mosca del olivo y polilla.", dosis_recomendada: 25, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 0.4, stock_minimo: 0.5, precio_por_unidad: 98000, plazo_seguridad_dias: 7, activo: true, notas: "" },
  { id: "p-foliar", nombre_comercial: "Foliar NPK 20-20-20", principio_activo: "Nitrógeno, fósforo, potasio", categoria: "fertilizante", uso: "Abonado foliar de primavera.", dosis_recomendada: 300, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 12, stock_minimo: 4, precio_por_unidad: 7200, plazo_seguridad_dias: 0, activo: true, notas: "" },
  { id: "p-glifo", nombre_comercial: "Glifosato 66%", principio_activo: "Glifosato", categoria: "herbicida", uso: "Control de malezas bajo copa (no en calles con terneros).", dosis_recomendada: 2, unidad_dosis: "ml_por_L", unidad_stock: "L", stock_actual: 8, stock_minimo: 2, precio_por_unidad: 9800, plazo_seguridad_dias: 14, activo: true, notas: "" },
];

const pf = (n: number) => `c-prod-f${n}`;
export const aplicacionesIniciales: Aplicacion[] = [
  { id: "a-1", fecha: "2026-10-05", producto_id: "p-cobre", cuadro_id: "c-prod", fila_ids: [1, 2, 3, 4, 5, 6, 7].map(pf), zona: "ambas", litros_caldo: 200, dosis_usada: 300, unidad_dosis: "g_por_100L", cantidad_producto: 0.6, aplicado_por: "u-juan", tarea_id: null, temperatura_c: 17, viento: "calmo", lluvia_prevista_24h: false, fecha_libre_cosecha: "2026-10-20", notas: "Post poda, primera tanda." },
  { id: "a-2", fecha: "2026-10-08", producto_id: "p-spinosad", cuadro_id: "c-prod", fila_ids: [8, 9, 10].map(pf), zona: "A", litros_caldo: 32, dosis_usada: 25, unidad_dosis: "ml_por_100L", cantidad_producto: 0.008, aplicado_por: "u-juan", tarea_id: null, temperatura_c: 20, viento: "moderado", lluvia_prevista_24h: false, fecha_libre_cosecha: "2026-10-15", notas: "" },
];

export const movimientosIniciales: Movimiento[] = [
  { id: "m-1", producto_id: "p-cobre", tipo: "compra", cantidad: 10, fecha: "2026-08-12", precio_total: 145000, nota: "Agroquímica Villa Iris" },
  { id: "m-2", producto_id: "p-cobre", tipo: "aplicacion", cantidad: -0.6, aplicacion_id: "a-1", fecha: "2026-10-05", nota: "" },
  { id: "m-3", producto_id: "p-spinosad", tipo: "aplicacion", cantidad: -0.008, aplicacion_id: "a-2", fecha: "2026-10-08", nota: "" },
];

export const configInicial: ConfigAvisos = {
  emails_destino: [],
  dias_antelacion_tareas: 3,
  resumen_semanal_activo: true,
  dia_resumen: "lunes",
  hora_envio: "08:00",
};

// ---------- Plan anual (hemisferio sur, Villa Iris) ----------
interface PlanBase {
  key: string;
  titulo: string;
  tipo: TipoTarea;
  desc: string;
  ini: [number, number];
  fin: [number, number];
  cuadro: string | null;
  sigAnio?: boolean;
}
const PLAN: PlanBase[] = [
  { key: "madur", titulo: "Seguimiento de maduración", tipo: "control", desc: "Seguimiento de maduración de la aceituna para fijar fecha de cosecha.", ini: [3, 1], fin: [3, 31], cuadro: null },
  { key: "cosecha", titulo: "Cosecha manual", tipo: "cosecha", desc: "Moler en menos de 24 h desde la recolección.", ini: [4, 1], fin: [6, 15], cuadro: "c-prod" },
  { key: "cobre-cos", titulo: "Cobre post cosecha", tipo: "tratamiento", desc: "Cobre después de cosechar, para cerrar las heridas de la recolección.", ini: [5, 15], fin: [6, 30], cuadro: "c-prod" },
  { key: "suelo", titulo: "Análisis de suelo", tipo: "control", desc: "Análisis de suelo.", ini: [7, 1], fin: [7, 31], cuadro: null },
  { key: "herram", titulo: "Mantenimiento de equipos", tipo: "mantenimiento", desc: "Herramientas, prensa, capachos y equipo de pulverización.", ini: [7, 1], fin: [7, 31], cuadro: null },
  { key: "poda-p", titulo: "Poda", tipo: "poda", desc: "Poda después de las heladas fuertes.", ini: [8, 20], fin: [9, 30], cuadro: "c-prod" },
  { key: "poda-j", titulo: "Poda de formación", tipo: "poda", desc: "Solo poda de formación.", ini: [8, 20], fin: [9, 30], cuadro: "c-joven" },
  { key: "abonado", titulo: "Abonado de primavera", tipo: "abonado", desc: "Abonado de primavera.", ini: [9, 15], fin: [10, 31], cuadro: null },
  { key: "cobre-poda", titulo: "Cobre post poda", tipo: "tratamiento", desc: "Cobre después de la poda.", ini: [10, 1], fin: [10, 15], cuadro: null },
  { key: "reponer", titulo: "Reponer olivos muertos", tipo: "mantenimiento", desc: "Reponer olivos muertos.", ini: [10, 1], fin: [10, 31], cuadro: "c-joven" },
  { key: "flor", titulo: "Control de floración y plagas", tipo: "control", desc: "Floración y plagas.", ini: [10, 15], fin: [11, 30], cuadro: null },
  { key: "riego", titulo: "Riego de verano", tipo: "riego", desc: "Riego según lluvias. Prioridad cuadro joven.", ini: [11, 1], fin: [2, 28], cuadro: null, sigAnio: true },
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function generarPlanAnual(anio: number, hoy: string): Tarea[] {
  const tareas: Tarea[] = PLAN.map((p) => {
    const fin = iso(p.sigAnio ? anio + 1 : anio, p.fin[0], p.fin[1]);
    return {
      id: `plan-${anio}-${p.key}`,
      titulo: p.titulo,
      tipo: p.tipo,
      descripcion: p.desc,
      fecha_inicio: iso(anio, p.ini[0], p.ini[1]),
      fecha_fin: fin,
      cuadro_id: p.cuadro,
      fila_ids: [],
      zona: "ambas",
      estado: fin < "2026-09-01" && fin < hoy ? "hecha" : "pendiente",
      responsable_id: null,
      recurrencia: "anual",
      origen: "plan_anual",
    };
  });
  return tareas;
}

export function tareaElectrico(anio: number, mes: number): Tarea {
  const d = iso(anio, mes, 1);
  return {
    id: `plan-${anio}-${mes}-electrico`,
    titulo: "Revisar eléctrico y pasto",
    tipo: "mantenimiento",
    descripcion: "Revisar el eléctrico de las filas y el estado del pasto en las calles de los terneros.",
    fecha_inicio: d,
    fecha_fin: iso(anio, mes, 5),
    cuadro_id: null,
    fila_ids: [],
    zona: "ambas",
    estado: "pendiente",
    responsable_id: "u-juan",
    recurrencia: "mensual",
    origen: "plan_anual",
  };
}

export function tareasIniciales(hoy: string): Tarea[] {
  const t = [...generarPlanAnual(2026, hoy), ...generarPlanAnual(2027, hoy), tareaElectrico(2026, 10)];
  const abon = t.find((x) => x.id === "plan-2026-abonado");
  if (abon) {
    abon.estado = "en_curso";
    abon.responsable_id = "u-juan";
  }
  const cobre = t.find((x) => x.id === "plan-2026-cobre-poda");
  if (cobre) cobre.responsable_id = "u-juan";
  return t;
}
