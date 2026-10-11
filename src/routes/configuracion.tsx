import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import { OLIVOS_POR_FILA, type Rol } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, PageHeader, SimpleSelect, Status } from "@/components/ov";

export const Route = createFileRoute("/configuracion")({
  head: () => pageHead("Configuración", "Cuadros, filas, usuarios, avisos por email y plan anual."),
  component: Config,
});

function Config() {
  const s = useStore();
  const [hasta, setHasta] = useState<Record<string, string>>({});
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", rol: "campo" as Rol });
  const [emails, setEmails] = useState(s.config.emails_destino.join(", "));
  const [anio, setAnio] = useState(String(Number(s.hoy.slice(0, 4)) + 1));
  if (!s.isAdmin) return <p className="ov-card p-8 text-center">Solo la administradora puede ver la configuración.</p>;

  return (
    <>
      <PageHeader title="Configuración" />
      <Tabs defaultValue="cuadros">
        <TabsList className="mb-4 flex-wrap"><TabsTrigger value="cuadros">Cuadros y filas</TabsTrigger><TabsTrigger value="usuarios">Usuarios</TabsTrigger><TabsTrigger value="avisos">Avisos por email</TabsTrigger><TabsTrigger value="plan">Plan anual</TabsTrigger></TabsList>

        <TabsContent value="cuadros" className="grid gap-4 md:grid-cols-2">
          {s.cuadros.map((c) => {
            const fs = s.filas.filter((f) => f.cuadro_id === c.id);
            return (
              <div key={c.id} className="ov-card space-y-3 p-5">
                <h3 className="text-2xl">{c.nombre}</h3>
                <p className="text-sm">{c.hectareas} ha · {fs.length} filas · {fs.reduce((a, f) => a + (f.cantidad_olivos ?? 0), 0)} olivos</p>
                <p className="text-xs text-muted-foreground">Cada fila se divide en zona A (izquierda) y zona B (derecha).</p>
                <div className="flex items-end gap-2">
                  <Field label="Crear filas de la 1 a la N" className="flex-1">
                    <Input type="number" min={1} className="h-11" value={hasta[c.id] ?? ""} onChange={(e) => setHasta({ ...hasta, [c.id]: e.target.value })} />
                  </Field>
                  <Button onClick={() => { const n = Number(hasta[c.id]); if (n > 0) { s.crearFilasMasivo(c.id, n, OLIVOS_POR_FILA); toast.success("Filas creadas"); } }}>Crear</Button>
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="ov-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ov-beige-light text-left"><tr><th className="p-3">Nombre</th><th className="p-3">Email</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3" /></tr></thead>
              <tbody>
                {s.usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3 text-foreground">{u.nombre}</td><td className="p-3">{u.email}</td><td className="p-3">{u.rol === "admin" ? "Administradora" : "Campo"}</td>
                    <td className="p-3">{u.activo ? <Status tone="ok">Activo</Status> : <Status tone="pending">Desactivado</Status>}</td>
                    <td className="p-3 text-right">{u.id !== s.user.id && <Button variant="outline" size="sm" onClick={() => s.saveUsuario({ ...u, activo: !u.activo })}>{u.activo ? "Desactivar" : "Activar"}</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ov-card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
            <Field label="Nombre"><Input className="h-11" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" className="h-11" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></Field>
            <Field label="Rol"><SimpleSelect value={nuevo.rol} onChange={(v) => setNuevo({ ...nuevo, rol: v })} options={[{ value: "campo", label: "Campo" }, { value: "admin", label: "Administradora" }]} /></Field>
            <Button onClick={() => { if (!nuevo.nombre || !nuevo.email) return toast.error("Nombre y email son obligatorios."); s.saveUsuario({ id: "", ...nuevo, activo: true }); toast.success(`Invitación enviada a ${nuevo.email}`); setNuevo({ nombre: "", email: "", rol: "campo" }); }}>Invitar</Button>
          </div>
        </TabsContent>

        <TabsContent value="avisos">
          <div className="ov-card grid max-w-2xl gap-4 p-5">
            <Field label="Emails de destino (separados por coma)"><Input className="h-11" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="Pendiente de definir" /></Field>
            <Field label="Días de antelación para tareas"><Input type="number" className="h-11" value={s.config.dias_antelacion_tareas} onChange={(e) => s.setConfig({ ...s.config, dias_antelacion_tareas: Number(e.target.value) })} /></Field>
            <label className="flex items-center gap-3 text-sm"><Switch checked={s.config.resumen_semanal_activo} onCheckedChange={(v) => s.setConfig({ ...s.config, resumen_semanal_activo: v })} /> Resumen semanal activo</label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Día"><SimpleSelect value={s.config.dia_resumen} onChange={(v) => s.setConfig({ ...s.config, dia_resumen: v })} options={["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"].map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }))} /></Field>
              <Field label="Hora (Argentina)"><Input type="time" className="h-11" value={s.config.hora_envio} onChange={(e) => s.setConfig({ ...s.config, hora_envio: e.target.value })} /></Field>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { s.setConfig({ ...s.config, emails_destino: emails.split(",").map((x) => x.trim()).filter(Boolean) }); toast.success("Avisos guardados"); }}>Guardar</Button>
              <Button variant="outline" onClick={() => toast("El envío de emails se activará cuando esté configurado el remitente.")}>Enviar email de prueba</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <div className="ov-card flex max-w-xl flex-wrap items-end gap-3 p-5">
            <Field label="Año" className="w-32"><Input type="number" className="h-11" value={anio} onChange={(e) => setAnio(e.target.value)} /></Field>
            <Button onClick={() => { s.regenerarPlan(Number(anio)); toast.success(`Plan anual ${anio} regenerado sin duplicar tareas existentes`); }}>Regenerar plan anual</Button>
            <p className="w-full text-xs text-muted-foreground">Crea las tareas base del hemisferio sur para ese año. Las que ya existen no se duplican.</p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
