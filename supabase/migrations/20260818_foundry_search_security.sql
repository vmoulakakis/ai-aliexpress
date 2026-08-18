CREATE TABLE IF NOT EXISTS public.sf_rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 0
);
ALTER TABLE public.sf_rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sf_competitor_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_sourcing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_model_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sf_claim_rate_limit(p_key text, p_limit int DEFAULT 30, p_window_seconds int DEFAULT 60)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r sf_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO sf_rate_limits(key,window_start,count) VALUES(p_key,now(),1)
  ON CONFLICT (key) DO UPDATE SET
    window_start=CASE WHEN sf_rate_limits.window_start < now()-make_interval(secs=>p_window_seconds) THEN now() ELSE sf_rate_limits.window_start END,
    count=CASE WHEN sf_rate_limits.window_start < now()-make_interval(secs=>p_window_seconds) THEN 1 ELSE sf_rate_limits.count+1 END
  RETURNING * INTO r;
  RETURN r.count <= p_limit;
END $$;
REVOKE EXECUTE ON FUNCTION public.sf_claim_rate_limit(text,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sf_claim_rate_limit(text,int,int) TO service_role;
