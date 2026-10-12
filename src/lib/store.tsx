import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  configInicial,
  generarPlanAnual,
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

const nid = (p: string) => `${p}-${crypto.randomUUID()}`;

type Tabla = "cuadros" | "filas" | "tareas" | "productos" | "aplicaciones" | "movimientos" | "registros" | "config";
const db = supabase as unknown as { from: (t: string) => any }; // tablas genéricas (id, data jsonb)

/** Guarda en la base de datos los elementos nuevos/cambiados y borra los quitados (comparando por referencia). */
function useSync<T extends { id: string }>(tabla: Tabla, items: T[], listo: boolean, prev: React.MutableRefObject<T[] | null>) {
  useEffect(() => {
    if (!listo || prev.current === null) return;
    const antes = prev.current;
    prev.current = items;
    if (antes === items) return;
    const viejos = new Map(antes.map((x) => [x.id, x]));
    const cambiados = items.filter((x) => viejos.get(x.id) !== x);
    const ids = new Set(items.map((x) => x.id));
    const quitados = antes.filter((x) => !ids.has(x.id)).map((x) => x.id);
    const err = (e: { message: string } | null) => e && toast.error(`No se pudo guardar: ${e.message}`);
    if (cambiados.length) db.from(tabla).upsert(cambiados.map((x) => ({ id: x.id, data: x, updated_at: new Date().toISOString() }))).then(({ error }: any) => err(error));
    if (quitados.length) db.from(tabla).delete().in("id", quitados).then(({ error }: any) => err(error));
  }, [items, listo]); // eslint-disable-line react-hooks/exhaustive-deps
}

function useStoreState() {
  const [hoy] = useState(() => hoyAR());
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [cuadros, setCuadros] = useState<Cuadro[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [configs, setConfigs] = useState<(ConfigAvisos & { id: string })[]>([]);
  const config: ConfigAvisos = configs[0] ?? configInicial;
  const setConfig = (c: ConfigAvisos) => setConfigs([{ ...c, id: "main" }]);

  const refs = {
    cuadros: useRef<Cuadro[] | null>(null), filas: useRef<Fila[] | null>(null), tareas: useRef<Tarea[] | null>(null),
    productos: useRef<Producto[] | null>(null), aplicaciones: useRef<Aplicacion[] | null>(null), movimientos: useRef<Movimiento[] | null>(null),
    registros: useRef<Registro[] | null>(null), config: useRef<(ConfigAvisos & { id: string })[] | null>(null),
  };

  const cargar = async (uid: string) => {
    setListo(false);
    const leer = async <T,>(t: Tabla): Promise<T[]> => {
      const { data, error } = await db.from(t).select("data");
      if (error) throw error;
      return (data ?? []).map((r: { data: T }) => r.data);
    };
    try {
      const [cu, fi, ta, pr, ap, mo, re, co, pe, ro] = await Promise.all([
        leer<Cuadro>("cuadros"), leer<Fila>("filas"), leer<Tarea>("tareas"), leer<Producto>("productos"), leer<Aplicacion>("aplicaciones"),
        leer<Movimiento>("movimientos"), leer<Registro>("registros"), leer<ConfigAvisos & { id: string }>("config"),
        supabase.from("profiles").select("*"), supabase.from("user_roles").select("*"),
      ]);
      const us: Usuario[] = (pe.data ?? []).map((p) => ({
        id: p.id, nombre: p.nombre, email: p.email, activo: p.activo,
        rol: (ro.data ?? []).some((r) => r.user_id === p.id && r.role === "admin") ? "admin" : "campo",
      }));
      if (!us.some((u) => u.id === uid && u.activo)) { setSinAcceso(true); return; }
      const ordenFecha = <T extends { fecha: string },>(x: T[]) => x.sort((a, b) => b.fecha.localeCompare(a.fecha));
      refs.cuadros.current = cu; refs.filas.current = fi; refs.tareas.current = ta; refs.productos.current = pr;
      refs.aplicaciones.current = ordenFecha(ap); refs.movimientos.current = ordenFecha(mo); refs.registros.current = ordenFecha(re); refs.config.current = co;
      setCuadros(cu); setFilas(fi); setTareas(ta); setProductos(pr); setAplicaciones(ap); setMovimientos(mo); setRegistros(re); setConfigs(co);
      setUsuarios(us); setCurrentUserId(uid); setSinAcceso(false); setListo(true);
    } catch (e) {
      toast.error(`No se pudieron cargar los datos: ${(e as Error).message}`);
    }
  };

  useSync("cuadros", cuadros, listo, refs.cuadros);
  useSync("filas", filas, listo, refs.filas);
  useSync("tareas", tareas, listo, refs.tareas);
  useSync("productos", productos, listo, refs.productos);
  useSync("aplicaciones", aplicaciones, listo, refs.aplicaciones);
  useSync("movimientos", movimientos, listo, refs.movimientos);
  useSync("registros", registros, listo, refs.registros);
  useSync("config", configs, listo, refs.config);

  const user = usuarios.find((u) => u.id === currentUserId) ?? { id: "", nombre: "", email: "", rol: "campo" as const, activo: false };
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
        ...(estado === "hecha" ? { completada_en: new Date().toISOString(), completada_por: currentUserId ?? "" } : {}),
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

  const setSeccionesHechas = (id: string, secs: string[], fechaDia?: string) => {
    const prev = tareas.find((t) => t.id === id);
    if (prev) {
      const antes = new Set(prev.secciones_hechas);
      const ahora = new Set(secs);
      const hechas = secs.filter((x) => !antes.has(x));
      const quitadas = prev.secciones_hechas.filter((x) => !ahora.has(x));
      const nuevos: Registro[] = [];
      const ahoraIso = new Date().toISOString();
      const fecha = fechaDia && fechaDia !== ahoraIso.slice(0, 10) ? `${fechaDia}T12:00:00.000Z` : ahoraIso;
      if (hechas.length) nuevos.push({ id: nid("r"), fecha, tarea_id: id, titulo: prev.titulo, tipo: prev.tipo, secciones: hechas, accion: "hecho", usuario_id: currentUserId ?? "" });
      if (quitadas.length) nuevos.push({ id: nid("r"), fecha, tarea_id: id, titulo: prev.titulo, tipo: prev.tipo, secciones: quitadas, accion: "desmarcado", usuario_id: currentUserId ?? "" });
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

  const saveUsuario = async (u: Usuario) => {
    if (!u.id) {
      const { error } = await supabase.from("invitaciones").upsert({ email: u.email.trim().toLowerCase(), nombre: u.nombre, rol: u.rol });
      if (error) return toast.error(error.message);
      return toast.success(`Invitación creada. ${u.email} ya puede crear su cuenta en la pantalla de acceso.`);
    }
    const { error } = await supabase.from("profiles").update({ activo: u.activo, nombre: u.nombre }).eq("id", u.id);
    if (error) return toast.error(error.message);
    setUsuarios((us) => us.map((x) => (x.id === u.id ? u : x)));
  };

  return {
    hoy, usuarios, user, isAdmin, listo, sinAcceso, cargar, currentUserId, cuadros, setCuadros, filas, setFilas, tareas, productos, aplicaciones,
    movimientos, registros, config, setConfig, saveTarea, deleteTarea, setEstadoTarea, setSeccionesHechas, addAplicacion, deleteAplicacion, saveProducto,
    addCompra, addAjuste, crearFilasMasivo, regenerarPlan, saveUsuario,
  };
}

type Store = ReturnType<typeof useStoreState>;
// Se guarda en globalThis para que el contexto sobreviva a las recargas en caliente durante el desarrollo.
const g = globalThis as unknown as { __ovStoreCtx?: ReturnType<typeof createContext<Store | null>> };
const Ctx = (g.__ovStoreCtx ??= createContext<Store | null>(null));
export function StoreProvider({ children }: { children: ReactNode }) {
  const s = useStoreState();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [sesion, setSesion] = useState<"cargando" | "no" | "si">("cargando");
  useEffect(() => {
    const aplicar = (uid: string | null) => {
      if (uid) { setSesion("si"); s.cargar(uid); } else setSesion("no");
    };
    supabase.auth.getSession().then(({ data }) => aplicar(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((ev, ses) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") aplicar(ses?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sesion === "no" && path !== "/login") navigate({ to: "/login" });
  }, [sesion, path]); // eslint-disable-line react-hooks/exhaustive-deps

  const espera = (txt: ReactNode) => <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">{txt}</div>;
  let contenido: ReactNode = children;
  if (path !== "/login") {
    if (s.sinAcceso) contenido = espera(<div>Tu usuario no está activo. Pide acceso a la administradora.<br /><button className="mt-3 underline" onClick={() => supabase.auth.signOut()}>Salir</button></div>);
    else if (sesion !== "si" || !s.listo) contenido = espera("Cargando el cuaderno de campo…");
  }
  return <Ctx.Provider value={s}>{contenido}</Ctx.Provider>;
}
export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}
export const nombreCuadro = (cuadros: Cuadro[], id: string | null) =>
  id ? cuadros.find((c) => c.id === id)?.nombre ?? "—" : "Todo el campo";
