import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo-olivares.png.asset.json";
import { pageHead } from "@/lib/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ov";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Acceso", "Acceso al cuaderno de campo de Olivares Villairenses."),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl">
        <img src={logo.url} alt="Olivares Villairenses" className="mx-auto size-28" />
        <h1 className="mt-2 text-center text-3xl">Cuaderno de campo</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">Olivares Villairenses</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email || !pass) return toast.error("Email o contraseña incorrectos.");
            navigate({ to: "/" });
          }}
        >
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          </Field>
          <Field label="Contraseña">
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="h-11" />
          </Field>
          <Button className="w-full" type="submit">Entrar</Button>
          <button type="button" className="w-full text-sm text-ov-olive-light hover:underline" onClick={() => toast.success("Te enviaremos un email para recuperar la contraseña.")}>
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  );
}
