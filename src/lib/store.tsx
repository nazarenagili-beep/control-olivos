import { createContext, useContext, useState, type ReactNode } from "react";
import {
  aplicacionesIniciales,
  configInicial,
  cuadrosIniciales,
  filasIniciales,
  generarPlanAnual,
  movimientosIniciales,
  productosIniciales,
  tareasIniciales,
  usuariosIniciales,
  type Aplicacion,
  type ConfigAvisos,
  type Cuadro,
  type Fila,
  type Movimiento,
  type Producto,
  type Tarea,
  type Usuario,
} from "./data";
import { addDays, addMonths, hoyAR } from "./logic";

export interface Registro {
  id: string;
  fecha: string; // ISO con hora
  tarea_id: string;
  titulo: string;
  tipo: Tarea["tipo"];
  secciones: string[];
  accion: "hecho" | "desmarcado";
  usuario_id: string;
}

function registrosIniciales(ts: Tarea[]): Registro[] {
  const hace = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  return ts
    .filter((t) => t.secciones_hechas.length)
    .map((t, i) => ({ id: `r-ini-${i}`, fecha: hace(2 + i * 5), tarea_id: t.id, titulo: t.titulo, tipo: t.tipo, secciones: t.secciones_hechas, accion: "hecho" as const, usuario_id: t.responsable_id ?? "u-admin" }));
}

let seq = 1000;
const nid = (p: string) => `${p}-${++seq}`;

function useStoreState() {
  const [hoy] = useState(() => hoyAR());
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [currentUserId, setCurrentUserId] = useState("u-admin");
  const [cuadros, setCuadros] = useState<Cuadro[]>(cuadrosIniciales);
  const [filas, setFilas] = useState<Fila[]>(filasIniciales);
  const [tareas, setTareas] = useState<Tarea[]>(() => tareasIniciales(hoyAR()));
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>(aplicacionesIniciales);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(movimientosIniciales);
  const [registros, setRegistros] = useState<Registro[]>(() => registrosIniciales(tareas));
  const [config, setConfig] = useState<ConfigAvisos>(configInicial);

  const user = usuarios.find((u) => u.id === currentUserId)!;
  const isAdmin = user.rol === "admin";

  const saveTarea = (t: Tarea) =>
    setTareas((ts) => (ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [...ts, { ...t, id: nid("t") }]));
  const deleteTarea = (id: string) => setTareas((ts) => ts.filter((t) => t.id !== id));

  const setEstadoTarea = (id: string, estado: Tarea["estado"], nota?: string, foto?: string) =>
    setTareas((ts) => {
      const t = ts.find((x) => x.id === id);
      if (!t) return ts;
      const upd: Tarea = {
        ...t,
        estado,
        nota_cierre: nota ?? t.nota_cierre,
        foto_nombre: foto ?? t.foto_nombre,
        ...(estado === "hecha" ? { completada_en: new Date().toISOString(), completada_por: currentUserId } : {}),
      };
      let next = ts.map((x) => (x.id === id ? upd : x));
      if (estado === "hecha" && t.estado !== "hecha" && t.recurrencia !== "ninguna") {
        const n = t.recurrencia === "mensual" ? 1 : 12;
        const ini = addMonths(t.fecha_inicio, n);
        if (!next.some((x) => x.titulo === t.titulo && x.cuadro_id === t.cuadro_id && x.fecha_inicio === ini)) {
          next = [
            ...next,
            {
              ...t,
              id: nid("t"),
              fecha_inicio: ini,
              fecha_fin: addMonths(t.fecha_fin, n),
              estado: "pendiente",
              completada_en: undefined,
              completada_por: undefined,
              nota_cierre: undefined,
              foto_nombre: undefined,
              secciones_hechas: [],
            },
          ];
        }
      }
      return next;
    });

  const setSeccionesHechas = (id: string, secs: string[]) => {
    const prev = tareas.find((t) => t.id === id);
    if (prev) {
      const antes = new Set(prev.secciones_hechas);
      const ahora = new Set(secs);
      const hechas = secs.filter((x) => !antes.has(x));
      const quitadas = prev.secciones_hechas.filter((x) => !ahora.has(x));
      const nuevos: Registro[] = [];
      const fecha = new Date().toISOString();
      if (hechas.length) nuevos.push({ id: nid("r"), fecha, tarea_id: id, titulo: prev.titulo, tipo: prev.tipo, secciones: hechas, accion: "hecho", usuario_id: currentUserId });
      if (quitadas.length) nuevos.push({ id: nid("r"), fecha, tarea_id: id, titulo: prev.titulo, tipo: prev.tipo, secciones: quitadas, accion: "desmarcado", usuario_id: currentUserId });
      if (nuevos.length) setRegistros((r) => [...nuevos, ...r]);
    }
    setTareas((ts) => ts.map((t) => (t.id === id ? { ...t, secciones_hechas: secs, estado: t.estado === "pendiente" && secs.length ? "en_curso" : t.estado } : t)));
  };

  const addAplicacion = (a: Omit<Aplicacion, "id" | "fecha_libre_cosecha">) => {
    const prod = productos.find((p) => p.id === a.producto_id)!;
    const id = nid("a");
    const full: Aplicacion = { ...a, id, fecha_libre_cosecha: addDays(a.fecha, prod.plazo_seguridad_dias) };
    setAplicaciones((x) => [full, ...x]);
    setProductos((ps) => ps.map((p) => (p.id === prod.id ? { ...p, stock_actual: p.stock_actual - a.cantidad_producto } : p)));
    setMovimientos((m) => [{ id: nid("m"), producto_id: prod.id, tipo: "aplicacion", cantidad: -a.cantidad_producto, aplicacion_id: id, fecha: a.fecha, nota: "" }, ...m]);
    if (a.tarea_id) setEstadoTarea(a.tarea_id, "hecha");
    return full;
  };
  const deleteAplicacion = (id: string) => {
    const a = aplicaciones.find((x) => x.id === id);
    if (!a) return;
    setAplicaciones((x) => x.filter((y) => y.id !== id));
    setProductos((ps) => ps.map((p) => (p.id === a.producto_id ? { ...p, stock_actual: p.stock_actual + a.cantidad_producto } : p)));
    setMovimientos((m) => m.filter((y) => y.aplicacion_id !== id));
  };

  const saveProducto = (p: Producto) =>
    setProductos((ps) => (ps.some((x) => x.id === p.id) ? ps.map((x) => (x.id === p.id ? p : x)) : [...ps, { ...p, id: nid("p") }]));

  const addCompra = (producto_id: string, cantidad: number, precio_total: number, fecha: string, nota: string) => {
    setMovimientos((m) => [{ id: nid("m"), producto_id, tipo: "compra", cantidad, precio_total, fecha, nota }, ...m]);
    setProductos((ps) =>
      ps.map((p) => (p.id === producto_id ? { ...p, stock_actual: p.stock_actual + cantidad, precio_por_unidad: precio_total / cantidad } : p)),
    );
  };
  const addAjuste = (producto_id: string, cantidad: number, fecha: string, nota: string) => {
    setMovimientos((m) => [{ id: nid("m"), producto_id, tipo: "ajuste", cantidad, fecha, nota }, ...m]);
    setProductos((ps) => ps.map((p) => (p.id === producto_id ? { ...p, stock_actual: p.stock_actual + cantidad } : p)));
  };

  const crearFilasMasivo = (cuadro_id: string, desde: number, hasta: number, olivos: number) =>
    setFilas((fs) => {
      const existentes = new Set(fs.filter((f) => f.cuadro_id === cuadro_id).map((f) => f.numero));
      const nuevas: Fila[] = [];
      for (let n = desde; n <= hasta; n++)
        if (!existentes.has(n)) nuevas.push({ id: nid("f"), cuadro_id, numero: n, cantidad_olivos: olivos, notas: "" });
      return [...fs, ...nuevas];
    });

  const regenerarPlan = (anio: number) => {
    let creadas = 0;
    setTareas((ts) => {
      const nuevas = generarPlanAnual(anio, hoy).filter(
        (p) => !ts.some((t) => t.titulo === p.titulo && t.cuadro_id === p.cuadro_id && t.fecha_inicio === p.fecha_inicio),
      );
      creadas = nuevas.length;
      return [...ts, ...nuevas.map((n) => ({ ...n, id: nid("t") }))];
    });
    return creadas;
  };

  const saveUsuario = (u: Usuario) =>
    setUsuarios((us) => (us.some((x) => x.id === u.id) ? us.map((x) => (x.id === u.id ? u : x)) : [...us, { ...u, id: nid("u") }]));

  return {
    hoy, usuarios, user, isAdmin, setCurrentUserId, cuadros, setCuadros, filas, setFilas, tareas, productos, aplicaciones,
    movimientos, registros, config, setConfig, saveTarea, deleteTarea, setEstadoTarea, setSeccionesHechas, addAplicacion, deleteAplicacion, saveProducto,
    addCompra, addAjuste, crearFilasMasivo, regenerarPlan, saveUsuario,
  };
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStoreState();
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
export const nombreCuadro = (cuadros: Cuadro[], id: string | null) =>
  id ? cuadros.find((c) => c.id === id)?.nombre ?? "—" : "Todo el campo";
