CREATE TABLE public.cosechas (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cosechas TO authenticated;
GRANT ALL ON public.cosechas TO service_role;
ALTER TABLE public.cosechas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin lee cosechas" ON public.cosechas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin crea cosechas" ON public.cosechas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edita cosechas" ON public.cosechas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin borra cosechas" ON public.cosechas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));