-- Server-generated token used only between pg_cron and internal Edge workers.
CREATE TABLE IF NOT EXISTS public.sf_internal_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sf_internal_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sf_internal_config FROM anon, authenticated;
INSERT INTO public.sf_internal_config(key,value)
VALUES ('job_token', encode(gen_random_bytes(32),'hex'))
ON CONFLICT (key) DO NOTHING;
