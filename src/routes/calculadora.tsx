import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { pageHead } from "@/lib/head";
import { useStore } from "@/lib/store";
import type { UnidadDosis } from "@/lib/data";
import { Field, PageHeader, SimpleSelect } from "@/components/ov";
import { DosisInputs, LitrosInput, ResultadoDosis } from "@/components/Calculadora";

export const Route = createFileRoute("/calculadora")({
  head: () => pageHead("Calculadora de dosis", "Calcula la cantidad de producto según los litros de caldo."),
  component: Calc,
});

function Calc() {
  const s = useStore();
  const [prodId, setProdId] = useState("manual");
  const prod = s.productos.find((p) => p.id === prodId);
  const [dosis, setDosis] = useState(300);
  const [unidad, setUnidad] = useState<UnidadDosis>("ml_por_100L");
  const [litros, setLitros] = useState(16);
  return (
    <>
      <PageHeader title="Calculadora de dosis" subtitle="Cuánto producto poner en la mochila o el tanque" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="ov-card space-y-4 p-6">
          <Field label="Producto">
            <SimpleSelect
              value={prodId}
              onChange={(id) => {
                setProdId(id);
                const p = s.productos.find((x) => x.id === id);
                if (p) { setDosis(p.dosis_recomendada); setUnidad(p.unidad_dosis); }
              }}
              options={[{ value: "manual", label: "Dosis manual" }, ...s.productos.filter((p) => p.activo).map((p) => ({ value: p.id, label: p.nombre_comercial }))]}
            />
          </Field>
          <DosisInputs dosis={dosis} unidad={unidad} onDosis={setDosis} onUnidad={setUnidad} />
          <Field label="Litros de caldo"><LitrosInput litros={litros} onChange={setLitros} /></Field>
        </div>
        <div className="ov-card p-6">
          <h3 className="mb-3 text-xl">Resultado</h3>
          <ResultadoDosis dosis={dosis} unidad={unidad} litros={litros} producto={prod} />
        </div>
      </div>
    </>
  );
}
