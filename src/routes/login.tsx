import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo-olivares.png.asset.json";
import { pageHead } from "@/lib/head";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ov";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Acceso", "Acceso al cuaderno de campo de Olivares Villairenses."),
  component: Login,
});

type Modo = "entrar" | "crear" | "recuperar" | "nueva";

function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "PASSWORD_RECOVERY") setModo("nueva");
    });
    supabase.auth.getSession().then(({ data: d }) => {
      if (d.session && !window.location.hash.includes("type=recovery")) navigate({ to: "/" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const enviar = async () => {
    setBusy(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return toast.error("Email o contraseña incorrectos, o falta confirmar el email.");
        navigate({ to: "/" });
      } else if (modo === "crear") {
        if (pass.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres.");
        const { error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin } });
        if (error) return toast.error(error.message.includes("invitación") || error.message.includes("Database") ? "Este email no tiene invitación. Pídesela a la administradora." : error.message);
        toast.success("Cuenta creada. Revisa tu email para confirmarla y después entra.");
        setModo("entrar");
      } else if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (error) return toast.error(error.message);
        toast.success("Te enviamos un email para cambiar la contraseña.");
      } else {
        if (pass.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres.");
        const { error } = await supabase.auth.updateUser({ password: pass });
        if (error) return toast.error(error.message);
        toast.success("Contraseña cambiada.");
        navigate({ to: "/" });
      }
    } finally {
      setBusy(false);
    }
  };

  const titulo = { entrar: "Entrar", crear: "Crear cuenta (con invitación)", recuperar: "Recuperar contraseña", nueva: "Nueva contraseña" }[modo];

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl">
        <img src={logo.url} alt="Olivares Villairenses" className="mx-auto size-28" />
        <h1 className="mt-2 text-center text-3xl">Cuaderno de campo</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">{titulo}</p>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
          {modo !== "nueva" && (
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </Field>
          )}
          {modo !== "recuperar" && (
            <Field label={modo === "entrar" ? "Contraseña" : "Contraseña nueva (mínimo 8)"}>
              <Input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} className="h-11" />
            </Field>
          )}
          <Button className="w-full" type="submit" disabled={busy}>{busy ? "Un momento…" : titulo}</Button>
        </form>
        <div className="mt-4 space-y-1 text-center text-sm">
          {modo !== "entrar" && <button className="block w-full text-ov-olive-light hover:underline" onClick={() => setModo("entrar")}>Volver a entrar</button>}
          {modo === "entrar" && (
            <>
              <button className="block w-full text-ov-olive-light hover:underline" onClick={() => setModo("recuperar")}>¿Olvidaste tu contraseña?</button>
              <button className="block w-full text-ov-olive-light hover:underline" onClick={() => setModo("crear")}>Me invitaron: crear mi cuenta</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
