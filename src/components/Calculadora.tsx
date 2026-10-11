import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UNIDAD_DOSIS_LABEL, type Producto, type UnidadDosis } from "@/lib/data";
import { cantidadBase, num, unidadBase, unidadGrande } from "@/lib/logic";
import { Field, SimpleSelect } from "./ov";

export function ResultadoDosis({
  dosis,
  unidad,
  litros,
  producto,
}: {
  dosis: number;
  unidad: UnidadDosis;
  litros: number;
  producto?: Producto;
}) {
  if (!(dosis > 0) || !(litros > 0))
    return <p className="text-sm text-muted-foreground">Indica litros de caldo y dosis mayores que 0.</p>;
  const base = cantidadBase(dosis, unidad, litros);
  const alta = producto && producto.unidad_dosis === unidad && dosis > producto.dosis_recomendada * 1.2;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-ov-white-broken/60 p-4">
        <div className="text-4xl text-foreground">
          {num(base, 1)} {unidadBase(unidad)}
        </div>
        <div className="text-sm text-muted-foreground">
          = {num(base / 1000, 3)} {unidadGrande(unidad)} de producto · {Math.ceil(litros / 16)} mochila(s) de 16 L
        </div>
        <p className="mt-2 text-sm">
          Para {num(litros)} L de caldo: {num(base, 1)} {unidadBase(unidad)} de producto (dosis {num(dosis)} {UNIDAD_DOSIS_LABEL[unidad]}).
        </p>
      </div>
      {alta && (
        <p className="status-warn flex items-center gap-2 rounded-lg p-3 text-sm">
          <AlertTriangle className="size-4" /> Estás por encima de la dosis recomendada ({num(producto!.dosis_recomendada)} {UNIDAD_DOSIS_LABEL[unidad]}).
        </p>
      )}
    </div>
  );
}

export function LitrosInput({ litros, onChange }: { litros: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onChange(16)}>Mochila 16 L</Button>
        <Button type="button" variant="outline" onClick={() => onChange(200)}>Tanque 200 L</Button>
      </div>
      <Input type="number" min={0} step="any" value={litros || ""} onChange={(e) => onChange(Number(e.target.value))} className="h-11" placeholder="Litros de caldo" />
    </div>
  );
}

export const UNIDAD_OPTS = (Object.keys(UNIDAD_DOSIS_LABEL) as UnidadDosis[]).map((u) => ({ value: u, label: UNIDAD_DOSIS_LABEL[u] }));

export function DosisInputs({
  dosis,
  unidad,
  onDosis,
  onUnidad,
}: {
  dosis: number;
  unidad: UnidadDosis;
  onDosis: (n: number) => void;
  onUnidad: (u: UnidadDosis) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Dosis">
        <Input type="number" min={0} step="any" value={dosis || ""} onChange={(e) => onDosis(Number(e.target.value))} className="h-11" />
      </Field>
      <Field label="Unidad">
        <SimpleSelect value={unidad} onChange={onUnidad} options={UNIDAD_OPTS} />
      </Field>
    </div>
  );
}
