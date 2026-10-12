import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CATEGORIA_LABEL, type Categoria, type Producto } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Field, SimpleSelect } from "./ov";
import { UNIDAD_OPTS } from "./Calculadora";

export const productoVacio: Producto = {
  id: "", nombre_comercial: "", principio_activo: "", categoria: "fungicida", uso: "", dosis_recomendada: 0, unidad_dosis: "ml_por_100L",
  unidad_stock: "L", stock_actual: 0, stock_minimo: 0, precio_por_unidad: 0, plazo_seguridad_dias: NaN, activo: true, notas: "",
};

export function ProductoDialog({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const s = useStore();
  const [p, setP] = useState(producto);
  const [err, setErr] = useState("");
  const up = (x: Partial<Producto>) => setP({ ...p, ...x });
  const n = (v: string) => (v === "" ? NaN : Number(v));
  const guardar = () => {
    if (!p.nombre_comercial.trim()) return setErr("Indica el nombre comercial.");
    if (!Number.isFinite(p.plazo_seguridad_dias) || p.plazo_seguridad_dias < 0) return setErr("Indica el plazo de seguridad. Si el producto no tiene, pon 0.");
    s.saveProducto(p);
    toast.success("Producto guardado");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl font-medium">{p.id ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial"><Input className="h-11" value={p.nombre_comercial} onChange={(e) => up({ nombre_comercial: e.target.value })} /></Field>
          <Field label="Principio activo"><Input className="h-11" value={p.principio_activo} onChange={(e) => up({ principio_activo: e.target.value })} /></Field>
          <Field label="Categoría"><SimpleSelect value={p.categoria} onChange={(v) => up({ categoria: v })} options={(Object.keys(CATEGORIA_LABEL) as Categoria[]).map((k) => ({ value: k, label: CATEGORIA_LABEL[k] }))} /></Field>
          <Field label="Plazo de seguridad (días)"><Input type="number" min={0} className="h-11" value={Number.isFinite(p.plazo_seguridad_dias) ? p.plazo_seguridad_dias : ""} onChange={(e) => up({ plazo_seguridad_dias: n(e.target.value) })} /></Field>
          <Field label="Dosis recomendada"><Input type="number" step="any" className="h-11" value={p.dosis_recomendada || ""} onChange={(e) => up({ dosis_recomendada: Number(e.target.value) })} /></Field>
          <Field label="Unidad de dosis"><SimpleSelect value={p.unidad_dosis} onChange={(v) => up({ unidad_dosis: v })} options={UNIDAD_OPTS} /></Field>
          <Field label="Unidad de stock"><SimpleSelect value={p.unidad_stock} onChange={(v) => up({ unidad_stock: v })} options={[{ value: "L", label: "Litros (L)" }, { value: "kg", label: "Kilos (kg)" }]} /></Field>
          <Field label="Stock mínimo"><Input type="number" step="any" className="h-11" value={p.stock_minimo || ""} onChange={(e) => up({ stock_minimo: Number(e.target.value) })} /></Field>
          <Field label="Precio por unidad (ARS)"><Input type="number" className="h-11" value={p.precio_por_unidad || ""} onChange={(e) => up({ precio_por_unidad: Number(e.target.value) })} /></Field>
          <Field label="Ficha técnica (PDF, máx. 10 MB)">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-card px-3 text-sm">
              <FileText className="size-4" /> {p.ficha_tecnica_nombre ?? "Subir PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 10 * 1024 * 1024) return toast.error("El PDF supera los 10 MB.");
                up({ ficha_tecnica_nombre: f.name });
              }} />
            </label>
          </Field>
          <Field label="Uso" className="sm:col-span-2"><Textarea value={p.uso} onChange={(e) => up({ uso: e.target.value })} /></Field>
          <label className="flex items-center gap-3 text-sm"><Switch checked={p.activo} onCheckedChange={(v) => up({ activo: v })} /> Activo</label>
        </div>
        {err && <p className="status-danger rounded-md p-3 text-sm">{err}</p>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={guardar}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
