import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Camera, FlaskConical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TIPO_LABEL, type Tarea, type TipoTarea } from "@/lib/data";
import { nombreCuadro, useStore } from "@/lib/store";
import { conflictosCosecha, esAtrasada, fmt } from "@/lib/logic";
import { EstadoBadge, Field, MapaFilas, SimpleSelect, TipoChip, filasDeSecciones, seccionesTexto } from "./ov";

export function nuevaTarea(fecha: string): Tarea {
  return {
    id: "",
    titulo: "",
    tipo: "mantenimiento",
    descripcion: "",
    fecha_inicio: fecha,
    fecha_fin: fecha,
    cuadro_id: null,
    fila_ids: [],
    secciones: [],
    secciones_hechas: [],
    estado: "pendiente",
    responsable_id: null,
    recurrencia: "ninguna",
    origen: "manual",
  };
}

export function TaskDialog({ tarea, onClose }: { tarea: Tarea | null; onClose: () => void }) {
  const s = useStore();
  const navigate = useNavigate();
  const [t, setT] = useState<Tarea | null>(tarea);
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [confirmo, setConfirmo] = useState(false);
  const [hechas, setHechas] = useState<string[]>(tarea?.secciones_hechas ?? []);
  useEffect(() => {
    setT(tarea);
    setNota(tarea?.nota_cierre ?? "");
    setFoto("");
    setConfirmo(false);
    setHechas(tarea?.secciones_hechas ?? []);
  }, [tarea]);

  const conflictos = useMemo(
    () => (t ? conflictosCosecha(t, s.filas, s.aplicaciones, s.productos) : []),
    [t, s.filas, s.aplicaciones, s.productos],
  );
  if (!t) return null;
  const editable = s.isAdmin;
  const puedeCerrar = s.isAdmin || !t.responsable_id || t.responsable_id === s.user.id;
  const up = (p: Partial<Tarea>) => setT({ ...t, ...p });
  const filasCuadro = s.filas.filter((f) => f.cuadro_id === t.cuadro_id).sort((a, b) => a.numero - b.numero);

  const mensajeConflicto = () => {
    const byCuadro = new Map<string, typeof conflictos>();
    conflictos.forEach((c) => byCuadro.set(c.fila.cuadro_id, [...(byCuadro.get(c.fila.cuadro_id) ?? []), c]));
    return [...byCuadro.entries()].map(([cid, cs]) => {
      const peor = cs.reduce((a, b) => ((a.libre ?? "") > (b.libre ?? "") ? a : b));
      return `Las filas ${cs.map((c) => c.fila.numero).join(", ")} del ${nombreCuadro(s.cuadros, cid)} no se pueden cosechar hasta el ${fmt(peor.libre)} por la aplicación de ${peor.producto?.nombre_comercial} del ${fmt(peor.aplicacion?.fecha)}.`;
    });
  };

  const guardar = () => {
    if (!t.titulo.trim()) return toast.error("Pon un título a la tarea.");
    if (t.fecha_fin < t.fecha_inicio) return toast.error("La fecha de fin no puede ser anterior al inicio.");
    if (conflictos.length && !confirmo) return toast.error("Hay filas dentro del plazo de seguridad.");
    s.saveTarea({
      ...t,
      secciones_hechas: hechas,
      ...(conflictos.length ? { plazo_confirmado_por: s.user.id, plazo_confirmado_en: new Date().toISOString() } : {}),
    });
    toast.success("Tarea guardada");
    onClose();
  };
  const cerrar = (estado: Tarea["estado"]) => {
    s.setEstadoTarea(t.id, estado, nota, foto || undefined);
    toast.success(estado === "hecha" ? "Tarea marcada como hecha" : "Tarea guardada");
    onClose();
  };

  const tipoOpts = (Object.keys(TIPO_LABEL) as TipoTarea[]).map((k) => ({ value: k, label: TIPO_LABEL[k] }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">{t.id ? (editable ? "Editar tarea" : t.titulo) : "Nueva tarea"}</DialogTitle>
        </DialogHeader>

        {editable ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" className="sm:col-span-2">
              <Input value={t.titulo} onChange={(e) => up({ titulo: e.target.value })} className="h-11" />
            </Field>
            <Field label="Tipo">
              <SimpleSelect value={t.tipo} onChange={(v) => up({ tipo: v })} options={tipoOpts} />
            </Field>
            <Field label="Responsable">
              <SimpleSelect
                value={t.responsable_id ?? "none"}
                onChange={(v) => up({ responsable_id: v === "none" ? null : v })}
                options={[{ value: "none", label: "Sin responsable" }, ...s.usuarios.filter((u) => u.activo).map((u) => ({ value: u.id, label: u.nombre }))]}
              />
            </Field>
            <Field label="Fecha inicio">
              <Input type="date" value={t.fecha_inicio} onChange={(e) => up({ fecha_inicio: e.target.value })} className="h-11" />
            </Field>
            <Field label="Fecha fin">
              <Input type="date" value={t.fecha_fin} onChange={(e) => up({ fecha_fin: e.target.value })} className="h-11" />
            </Field>
            <Field label="Cuadro">
              <SimpleSelect
                value={t.cuadro_id ?? "all"}
                onChange={(v) => up({ cuadro_id: v === "all" ? null : v, fila_ids: [], secciones: [] })}
                options={[{ value: "all", label: "Todo el campo" }, ...s.cuadros.map((c) => ({ value: c.id, label: c.nombre }))]}
              />
            </Field>
            {t.cuadro_id && (
              <Field label="¿Dónde? Toca la mitad de cada fila (A izquierda, B derecha)" className="sm:col-span-2">
                <MapaFilas filas={filasCuadro} value={t.secciones} onChange={(secs) => up({ secciones: secs, fila_ids: filasDeSecciones(secs) })} />
              </Field>
            )}
            <Field label="Recurrencia">
              <SimpleSelect
                value={t.recurrencia}
                onChange={(v) => up({ recurrencia: v })}
                options={[
                  { value: "ninguna", label: "Ninguna" },
                  { value: "mensual", label: "Mensual" },
                  { value: "anual", label: "Anual" },
                ]}
              />
            </Field>
            <Field label="Descripción" className="sm:col-span-2">
              <Textarea value={t.descripcion} onChange={(e) => up({ descripcion: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <TipoChip tipo={t.tipo} />
              <EstadoBadge estado={t.estado} atrasada={esAtrasada(t, s.hoy)} />
            </div>
            <p>{t.descripcion}</p>
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-muted-foreground">Fechas</dt>
              <dd>{fmt(t.fecha_inicio)} – {fmt(t.fecha_fin)}</dd>
              <dt className="text-muted-foreground">Dónde</dt>
              <dd>
                {nombreCuadro(s.cuadros, t.cuadro_id)} · {seccionesTexto(s.filas, t.secciones)}
              </dd>
            </dl>
          </div>
        )}

        {conflictos.length > 0 && (
          <div className="status-danger space-y-2 rounded-lg p-3 text-sm">
            {mensajeConflicto().map((m) => (
              <p key={m} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {m}
              </p>
            ))}
            {s.isAdmin ? (
              <label className="flex items-center gap-2 pt-1">
                <Checkbox checked={confirmo} onCheckedChange={(v) => setConfirmo(!!v)} />
                Confirmo que he revisado el plazo de seguridad
              </label>
            ) : (
              <p>No puedes guardar esta cosecha. Consulta con la administradora.</p>
            )}
          </div>
        )}

        {t.id && (
          <div className="space-y-3">
            <h3 className="text-lg">Avance por fila y zona</h3>
            <p className="text-xs text-muted-foreground">Toca cada mitad de fila cuando el trabajo esté hecho. Se guarda al momento.</p>
            {(t.cuadro_id ? s.cuadros.filter((c) => c.id === t.cuadro_id) : s.cuadros).map((c) => {
              const fs = s.filas.filter((f) => f.cuadro_id === c.id);
              const ids = new Set(fs.map((f) => f.id));
              const mine = (x: string) => ids.has(x.split(":")[0]);
              return (
                <div key={c.id} className="space-y-1">
                  {!t.cuadro_id && <p className="text-sm text-foreground">{c.nombre}</p>}
                  <MapaFilas
                    modo="progreso"
                    filas={fs}
                    disponibles={t.secciones.filter(mine)}
                    value={hechas.filter(mine)}
                    readOnly={!puedeCerrar || t.estado === "hecha"}
                    onChange={(v) => {
                      const n = [...hechas.filter((x) => !mine(x)), ...v];
                      setHechas(n);
                      s.setSeccionesHechas(t.id, n);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {t.id && puedeCerrar && t.estado !== "hecha" && (
          <div className="space-y-3 rounded-lg border border-border bg-ov-white-broken/60 p-4">
            <h3 className="text-lg">Cerrar tarea</h3>
            <Field label="Nota de cierre (opcional)">
              <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />
            </Field>
            <Field label="Foto (opcional, jpg/png/heic, máx. 10 MB)">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-card px-3 text-sm">
                <Camera className="size-4" /> {foto || "Elegir foto"}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 10 * 1024 * 1024) return toast.error("La foto supera los 10 MB.");
                    setFoto(f.name);
                  }}
                />
              </label>
            </Field>
          </div>
        )}
        {t.estado === "hecha" && t.completada_en && (
          <p className="status-ok rounded-lg p-3 text-sm">
            Hecha el {fmt(t.completada_en)} por {s.usuarios.find((u) => u.id === t.completada_por)?.nombre ?? "—"}.
            {t.nota_cierre && ` Nota: ${t.nota_cierre}`}
          </p>
        )}
        {t.plazo_confirmado_por && (
          <p className="text-xs text-muted-foreground">
            Plazo de seguridad confirmado por {s.usuarios.find((u) => u.id === t.plazo_confirmado_por)?.nombre} el {fmt(t.plazo_confirmado_en)}.
          </p>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {editable && t.id && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              onClick={() => {
                if (confirm("¿Borrar esta tarea?")) {
                  s.deleteTarea(t.id);
                  toast.success("Tarea borrada");
                  onClose();
                }
              }}
            >
              <Trash2 /> Borrar
            </Button>
          )}
          {t.id && puedeCerrar && t.estado === "pendiente" && (
            <Button variant="outline" onClick={() => cerrar("en_curso")}>Marcar en curso</Button>
          )}
          {t.id && puedeCerrar && t.estado !== "hecha" && t.tipo === "tratamiento" && (
            <Button
              onClick={() => {
                onClose();
                navigate({ to: "/tratamientos/nueva", search: { tarea: t.id } });
              }}
            >
              <FlaskConical /> Registrar aplicación
            </Button>
          )}
          {t.id && puedeCerrar && t.estado !== "hecha" && t.tipo !== "tratamiento" && (
            <Button variant={editable ? "outline" : "default"} onClick={() => cerrar("hecha")}>Marcar como hecha</Button>
          )}
          {editable && (
            <Button onClick={guardar} disabled={conflictos.length > 0 && !confirmo}>
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
