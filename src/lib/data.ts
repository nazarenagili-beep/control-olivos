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
  secciones: string[];
  secciones_hechas: string[];
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
  /** Aviso del trabajador: se está acabando o falta. */
  falta?: { fecha: string; por: string; nota: string } | null;
  activo: boolean;
  notas: string;
}
export interface Aplicacion {
  id: string;
  fecha: string;
  producto_id: string;
  cuadro_id: string;
  fila_ids: string[];
  secciones: string[];
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
  ...crearFilas("c-joven", 3 * FILAS_POR_HA + 1, 5 * FILAS_POR_HA),
];

export const usuariosIniciales: Usuario[] = [
  { id: "u-admin", nombre: "Administradora", email: "olivaresvillairenses@gmail.com", rol: "admin", activo: true },
  { id: "u-juan", nombre: "Juan (ejemplo)", email: "campo@ejemplo.com", rol: "campo", activo: true },
];

// Dosis y plazos orientativos: confirmar con la etiqueta de cada producto.
const prod = (p: Omit<Producto, "activo" | "notas"> & { notas?: string }): Producto => ({ activo: true, notas: "", ...p });
export const productosIniciales: Producto[] = [
  prod({ id: "p-cobre", nombre_comercial: "Oxicloruro de cobre", principio_activo: "Oxicloruro de cobre", categoria: "fungicida", uso: "Cura preventiva, solo plantines chicos. Disolver bien antes de ponerlo en la mochila. No pulverizar con calor.", dosis_recomendada: 250, unidad_dosis: "g_por_100L", unidad_stock: "kg", stock_actual: 6.5, stock_minimo: 5, precio_por_unidad: 14500, plazo_seguridad_dias: 15 }),
  prod({ id: "p-azufre", nombre_comercial: "Azufre en polvo", principio_activo: "Azufre", categoria: "fungicida", uso: "Cura preventiva, solo plantines chicos. Pulverizar por la mañana o por la tarde, nunca con calor (efecto lupa).", dosis_recomendada: 300, unidad_dosis: "g_por_100L", unidad_stock: "kg", stock_actual: 10, stock_minimo: 3, precio_por_unidad: 4500, plazo_seguridad_dias: 5 }),
  prod({ id: "p-chlorafit", nombre_comercial: "Clorofib", principio_activo: "Fertilizante foliar", categoria: "fertilizante", uso: "Fertilizante foliar. Cada 2 semanas de octubre a finales de diciembre.", dosis_recomendada: 3, unidad_dosis: "ml_por_L", unidad_stock: "L", stock_actual: 5, stock_minimo: 2, precio_por_unidad: 12000, plazo_seguridad_dias: 0 , notas: "Dosis pendiente de confirmar (se usa la del fertilizante foliar: 3 cc por litro)."}),
  prod({ id: "p-npk", nombre_comercial: "NPK fertirriego", principio_activo: "Nitrógeno, fósforo, potasio", categoria: "fertilizante", uso: "Fertirriego del cuadro joven: 2,5 kg por hectárea diluido al 10 % (25 L de solución por ha).", dosis_recomendada: 100, unidad_dosis: "g_por_L", unidad_stock: "kg", stock_actual: 25, stock_minimo: 10, precio_por_unidad: 3800, plazo_seguridad_dias: 0 }),
  prod({ id: "p-glifo", nombre_comercial: "Glifosato", principio_activo: "Glifosato", categoria: "herbicida", uso: "Matar yuyos. Puede dañar las hojas del olivo: pulverizar sin viento, temprano o al atardecer.", dosis_recomendada: 30, unidad_dosis: "ml_por_L", unidad_stock: "L", stock_actual: 8, stock_minimo: 2, precio_por_unidad: 9800, plazo_seguridad_dias: 14 }),
  prod({ id: "p-sorgo", nombre_comercial: "A35T", principio_activo: "Herbicida", categoria: "herbicida", uso: "Matar yuyos y sorgo de Alepo. 5 cc por cada 10 L de agua.", dosis_recomendada: 50, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 2, stock_minimo: 1, precio_por_unidad: 0, plazo_seguridad_dias: 30, notas: "Confirmar que es el producto para el sorgo de Alepo." }),
  prod({ id: "p-jabon", nombre_comercial: "Jabón potásico", principio_activo: "Sales potásicas de ácidos grasos", categoria: "insecticida", uso: "Cochinilla. 150 cc por cada 15 L, cada 15 días de septiembre a noviembre.", dosis_recomendada: 1000, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 10, stock_minimo: 4, precio_por_unidad: 5500, plazo_seguridad_dias: 0 }),
  prod({ id: "p-ciper", nombre_comercial: "Cipermetrina", principio_activo: "Cipermetrina", categoria: "insecticida", uso: "Cochinilla, con coadyuvante. Cada 15 días de septiembre a noviembre; si hay mucha, cada 7 días.", dosis_recomendada: 100, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 0.4, stock_minimo: 0.5, precio_por_unidad: 32000, plazo_seguridad_dias: 14 }),
  prod({ id: "p-coady", nombre_comercial: "Coadyuvante", principio_activo: "Tensioactivo", categoria: "otro", uso: "Se mezcla con la cipermetrina para la cochinilla.", dosis_recomendada: 500, unidad_dosis: "ml_por_100L", unidad_stock: "L", stock_actual: 3, stock_minimo: 1, precio_por_unidad: 8000, plazo_seguridad_dias: 0 }),
  prod({ id: "p-horm-gran", nombre_comercial: "Hormiguicida granulado", principio_activo: "Por confirmar", categoria: "insecticida", uso: "Hormigas. Se aplica sin diluir junto al hormiguero.", dosis_recomendada: 10, unidad_dosis: "g_por_L", unidad_stock: "kg", stock_actual: 2, stock_minimo: 0.5, precio_por_unidad: 0, plazo_seguridad_dias: 0, notas: "Sin diluir: en 'litros de caldo' poner el número de hormigueros (10 g por hormiguero)." }),
  prod({ id: "p-horm-polvo", nombre_comercial: "Hormiguicida en polvo", principio_activo: "Por confirmar", categoria: "insecticida", uso: "Hormigas. Se espolvorea en la boca del hormiguero.", dosis_recomendada: 10, unidad_dosis: "g_por_L", unidad_stock: "kg", stock_actual: 1, stock_minimo: 0.5, precio_por_unidad: 0, plazo_seguridad_dias: 0, notas: "Sin diluir: en 'litros de caldo' poner el número de hormigueros (10 g por hormiguero)." }),
];

const pf = (n: number) => `c-prod-f${n}`;
export const aplicacionesIniciales: Aplicacion[] = [
  { id: "a-1", fecha: "2026-10-05", producto_id: "p-cobre", cuadro_id: "c-prod", fila_ids: [1, 2, 3, 4, 5, 6, 7].map(pf), secciones: [1, 2, 3, 4, 5, 6, 7].flatMap((n) => [`${pf(n)}:A`, `${pf(n)}:B`]), litros_caldo: 200, dosis_usada: 250, unidad_dosis: "g_por_100L", cantidad_producto: 0.5, aplicado_por: "u-juan", tarea_id: null, temperatura_c: 17, viento: "calmo", lluvia_prevista_24h: false, fecha_libre_cosecha: "2026-10-20", notas: "Post poda, primera tanda." },
  { id: "a-2", fecha: "2026-10-08", producto_id: "p-ciper", cuadro_id: "c-prod", fila_ids: [8, 9, 10].map(pf), secciones: [8, 9, 10].map((n) => `${pf(n)}:A`), litros_caldo: 32, dosis_usada: 100, unidad_dosis: "ml_por_100L", cantidad_producto: 0.032, aplicado_por: "u-juan", tarea_id: null, temperatura_c: 20, viento: "moderado", lluvia_prevista_24h: false, fecha_libre_cosecha: "2026-10-22", notas: "Cochinillas, con coadyuvante." },
];

export const movimientosIniciales: Movimiento[] = [
  { id: "m-1", producto_id: "p-cobre", tipo: "compra", cantidad: 10, fecha: "2026-08-12", precio_total: 145000, nota: "Agroquímica Villa Iris" },
  { id: "m-2", producto_id: "p-cobre", tipo: "aplicacion", cantidad: -0.5, aplicacion_id: "a-1", fecha: "2026-10-05", nota: "" },
  { id: "m-3", producto_id: "p-ciper", tipo: "aplicacion", cantidad: -0.032, aplicacion_id: "a-2", fecha: "2026-10-08", nota: "" },
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
  // Verano (dic, ene, feb)
  { key: "v-foliar", titulo: "Fertilizante foliar (nutrientes)", tipo: "abonado", desc: "Fertilizante foliar.", ini: [12, 1], fin: [2, 28], cuadro: null, sigAnio: true },
  { key: "v-polillas", titulo: "Fumigación de polillas", tipo: "tratamiento", desc: "Fumigación contra polillas.", ini: [12, 1], fin: [2, 28], cuadro: null, sigAnio: true },
  { key: "v-brotes", titulo: "Quitar brotes (fortalecer planta)", tipo: "poda", desc: "Quitar brotes para fortalecer la planta.", ini: [12, 1], fin: [2, 28], cuadro: null, sigAnio: true },
  { key: "v-malezas", titulo: "Control de malezas (desmalezadora)", tipo: "mantenimiento", desc: "Pasar la desmalezadora entre filas. Mezcla: 1 rayita de aceite 2T por cada litro de nafta.", ini: [12, 1], fin: [2, 28], cuadro: null, sigAnio: true },
  // Otoño (mar, abr, may)
  { key: "v-curas", titulo: "Curas preventivas plantines (cobre y azufre)", tipo: "tratamiento", desc: "Oxicloruro de cobre 25 g y azufre 30 g por 10 L. Cada 2 semanas, de fin de febrero a mediados de marzo. Disolver bien el cobre; no con calor.", ini: [2, 20], fin: [3, 15], cuadro: "c-joven" },
  { key: "o-brotes", titulo: "Quitar brotes", tipo: "poda", desc: "Quitar brotes.", ini: [3, 1], fin: [5, 31], cuadro: null },
  { key: "o-prep", titulo: "Preparación de cosecha", tipo: "control", desc: "Seguimiento de maduración y preparación de la cosecha.", ini: [3, 1], fin: [3, 31], cuadro: "c-prod" },
  { key: "o-abono", titulo: "Fertilizar con abono", tipo: "abonado", desc: "Fertilizar con abono.", ini: [3, 1], fin: [5, 31], cuadro: null },
  { key: "o-helada", titulo: "Antihelada", tipo: "tratamiento", desc: "Protección antihelada.", ini: [5, 1], fin: [5, 31], cuadro: null },
  { key: "o-malezas", titulo: "Control de malezas (desmalezadora)", tipo: "mantenimiento", desc: "Pasar la desmalezadora entre filas. Mezcla: 1 rayita de aceite 2T por cada litro de nafta.", ini: [3, 1], fin: [5, 31], cuadro: null },
  // Invierno (jun, jul, ago)
  { key: "i-poda-olivos", titulo: "Poda de olivos", tipo: "poda", desc: "Poda de los olivos productivos (hectáreas 1, 2 y 3).", ini: [7, 1], fin: [8, 31], cuadro: "c-prod" },
  { key: "i-poda", titulo: "Poda de formación (ramas muertas y débiles)", tipo: "poda", desc: "Quitar ramas muertas y débiles.", ini: [6, 1], fin: [8, 31], cuadro: null },
  { key: "i-trat", titulo: "Tratamiento previsión de enfermedades", tipo: "tratamiento", desc: "Tratamiento preventivo (cobre tras cosecha y poda).", ini: [6, 1], fin: [8, 31], cuadro: null },
  { key: "i-aceite", titulo: "Producción aceite", tipo: "otro", desc: "Producción de aceite.", ini: [6, 1], fin: [8, 31], cuadro: "c-prod" },
  // Primavera (sep, oct, nov)
  { key: "p-chupones", titulo: "Limpieza de chupones", tipo: "poda", desc: "Quitar chupones del tronco y la base (hectáreas 1, 2 y 3).", ini: [10, 1], fin: [2, 28], cuadro: "c-prod", sigAnio: true },
  { key: "p-foliar", titulo: "Fertilizante foliar (nutrientes)", tipo: "abonado", desc: "Clorofib 3 cc por litro (45 cc por mochila de 15 L). Cada 2 semanas de octubre a finales de diciembre.", ini: [10, 1], fin: [12, 31], cuadro: null },
  { key: "p-yuyos", titulo: "Fumigación (mata yuyos)", tipo: "tratamiento", desc: "Glifosato 300 cc por 10 L y A35T 5 cc por 10 L. Sin viento, temprano o al atardecer.", ini: [9, 1], fin: [11, 30], cuadro: null },
  { key: "p-malezas", titulo: "Control de malezas (desmalezadora)", tipo: "mantenimiento", desc: "Pasar la desmalezadora entre filas. Mezcla: 1 rayita de aceite 2T por cada litro de nafta.", ini: [9, 1], fin: [11, 30], cuadro: null },
  { key: "p-cochinilla", titulo: "Tratamiento cochinilla", tipo: "tratamiento", desc: "Cipermetrina 15 cc + coadyuvante 75 cc + jabón potásico 150 cc por mochila de 15 L. Cada 15 días (cada 7 si hay mucha).", ini: [9, 1], fin: [11, 30], cuadro: null },
  { key: "p-poda", titulo: "Poda de producción", tipo: "poda", desc: "Poda de producción.", ini: [9, 1], fin: [9, 30], cuadro: "c-prod" },
  { key: "p-aceite", titulo: "Producción aceite", tipo: "otro", desc: "Producción de aceite.", ini: [9, 1], fin: [9, 30], cuadro: "c-prod" },
  { key: "p-plantar", titulo: "Plantar plantas que están muertas", tipo: "mantenimiento", desc: "Reponer olivos muertos.", ini: [10, 1], fin: [11, 30], cuadro: null },
];

const DIARIAS: { key: string; titulo: string; tipo: TipoTarea; desc: string; cuadro: string | null }[] = [
  { key: "atar", titulo: "Atar plantas", tipo: "control", desc: "Atar plantas.", cuadro: "c-joven" },
  { key: "tutores", titulo: "Enderezar plantas y tutores", tipo: "control", desc: "Enderezar plantas y tutores.", cuadro: "c-joven" },
  { key: "riego", titulo: "Controlar el riego (programas y mangueras)", tipo: "riego", desc: "Cambiar programas y revisar mangueras.", cuadro: null },
  { key: "limpio", titulo: "Mantener el terreno limpio (alrededor de las plantas)", tipo: "mantenimiento", desc: "Limpiar alrededor de las plantas.", cuadro: null },
  { key: "sanas", titulo: "Controlar que las plantas estén bien o enfermas", tipo: "control", desc: "Revisar el estado sanitario.", cuadro: null },
];
const PUNTUALES: { key: string; titulo: string; tipo: TipoTarea }[] = [];


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
      secciones: [],
      secciones_hechas: [],
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
    secciones: [],
    secciones_hechas: [],
    estado: "pendiente",
    responsable_id: "u-juan",
    recurrencia: "mensual",
    origen: "plan_anual",
  };
}

export function tareasDiarias(anio: number, mes: number): Tarea[] {
  const fin = iso(anio, mes, new Date(Date.UTC(anio, mes, 0)).getUTCDate());
  return DIARIAS.map((d) => ({
    id: `plan-${anio}-${mes}-${d.key}`, titulo: d.titulo, tipo: d.tipo, descripcion: d.desc, fecha_inicio: iso(anio, mes, 1), fecha_fin: fin,
    cuadro_id: d.cuadro, fila_ids: [], secciones: [], secciones_hechas: [], estado: "pendiente", responsable_id: "u-juan", recurrencia: "mensual", origen: "plan_anual",
  }));
}

export function tareasIniciales(hoy: string): Tarea[] {
  const t = [
    ...generarPlanAnual(2026, hoy),
    ...generarPlanAnual(2027, hoy),
    tareaElectrico(2026, 10),
    ...tareasDiarias(2026, 10),
    ...PUNTUALES.map<Tarea>((p) => ({
      id: `punt-${p.key}`, titulo: p.titulo, tipo: p.tipo, descripcion: "Tarea puntual.", fecha_inicio: "2026-01-01", fecha_fin: "2026-12-31",
      cuadro_id: null, fila_ids: [], secciones: [], secciones_hechas: [], estado: "pendiente", responsable_id: null, recurrencia: "ninguna", origen: "manual",
    })),
  ];
  const foliar = t.find((x) => x.id === "plan-2026-p-foliar");
  if (foliar) { foliar.estado = "en_curso"; foliar.responsable_id = "u-juan"; foliar.secciones_hechas = ["c-prod-f1:A", "c-prod-f1:B", "c-prod-f2:A", "c-prod-f2:B", "c-prod-f3:A"]; }
  const yuyos = t.find((x) => x.id === "plan-2026-p-yuyos");
  if (yuyos) yuyos.responsable_id = "u-juan";
  return t;
}
