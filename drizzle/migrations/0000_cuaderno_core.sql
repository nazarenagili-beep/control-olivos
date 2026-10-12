CREATE TYPE public.app_role AS ENUM ('admin', 'campo');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE TABLE public.invitaciones (
  email text PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  rol public.app_role NOT NULL DEFAULT 'campo',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitaciones TO authenticated;
GRANT ALL ON public.invitaciones TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.es_miembro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.activo)
     AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id)
$$;

CREATE POLICY "Miembros ven perfiles" ON public.profiles FOR SELECT TO authenticated USING (public.es_miembro(auth.uid()) OR id = auth.uid());
CREATE POLICY "Admin edita perfiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Miembros ven roles" ON public.user_roles FOR SELECT TO authenticated USING (public.es_miembro(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admin gestiona invitaciones" ON public.invitaciones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Solo pueden crear cuenta los emails invitados (la administradora siempre).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.invitaciones%ROWTYPE;
BEGIN
  IF lower(NEW.email) = 'olivaresvillairenses@gmail.com' THEN
    INSERT INTO public.profiles (id, nombre, email) VALUES (NEW.id, 'Administradora', lower(NEW.email));
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    RETURN NEW;
  END IF;
  SELECT * INTO inv FROM public.invitaciones WHERE email = lower(NEW.email);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este email no tiene invitación';
  END IF;
  INSERT INTO public.profiles (id, nombre, email) VALUES (NEW.id, coalesce(nullif(inv.nombre, ''), split_part(NEW.email, '@', 1)), lower(NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, inv.rol);
  DELETE FROM public.invitaciones WHERE email = lower(NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Datos del campo: una fila por elemento, contenido en jsonb.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cuadros','filas','tareas','productos','aplicaciones','movimientos','registros','config'] LOOP
    EXECUTE format('CREATE TABLE public.%I (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Miembros leen" ON public.%I FOR SELECT TO authenticated USING (public.es_miembro(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Miembros crean" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.es_miembro(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Miembros editan" ON public.%I FOR UPDATE TO authenticated USING (public.es_miembro(auth.uid())) WITH CHECK (public.es_miembro(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Miembros borran" ON public.%I FOR DELETE TO authenticated USING (public.es_miembro(auth.uid()))', t);
  END LOOP;
END $$;
-- El histórico no se borra ni se modifica.
DROP POLICY "Miembros borran" ON public.registros;
DROP POLICY "Miembros editan" ON public.registros;