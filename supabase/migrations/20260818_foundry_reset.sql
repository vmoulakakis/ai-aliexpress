-- EU Solution Foundry clean application schema
-- Keeps Supabase auth/storage and public.app_secrets intact.

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, viewname FROM pg_views WHERE schemaname='public' LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.schemaname, r.viewname);
  END LOOP;
  FOR r IN SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname='public' LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', r.schemaname, r.matviewname);
  END LOOP;
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'app_secrets' LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
  FOR r IN
    SELECT p.oid::regprocedure::text AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.signature || ' CASCADE';
  END LOOP;
END $$;

CREATE TABLE public.sf_pains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_el text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  demand_score numeric(5,2),
  source_scope text NOT NULL DEFAULT 'greece',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pain_id uuid NOT NULL REFERENCES public.sf_pains(id) ON DELETE CASCADE,
  title_el text NOT NULL,
  explanation_el text,
  stage text NOT NULL DEFAULT 'watch' CHECK (stage IN ('watch','lab','core','archive')),
  gap_type text CHECK (gap_type IN ('true_gap','value_gap','commodity')),
  survivor_score numeric(5,2),
  local_gap_score numeric(5,2),
  outcome_confidence numeric(5,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text UNIQUE NOT NULL,
  canonical_title text NOT NULL,
  image_url text,
  capabilities jsonb NOT NULL DEFAULT '{}',
  quality_score numeric(5,2),
  maturity text NOT NULL DEFAULT 'emerging' CHECK (maturity IN ('experimental','emerging','proven','commodity')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ali_shop_id text UNIQUE NOT NULL,
  name text,
  merchant_score numeric(5,2),
  eu_stock_reliability numeric(5,2),
  product_survival_rate numeric(5,2),
  outcome_success_rate numeric(5,2),
  specializations jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL REFERENCES public.sf_solutions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.sf_products(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.sf_merchants(id) ON DELETE CASCADE,
  ali_product_id text NOT NULL,
  warehouse_country text NOT NULL,
  price_eur numeric(12,2),
  old_price_eur numeric(12,2),
  discount_pct numeric(6,2),
  delivery_days int,
  affiliate_url text,
  express boolean NOT NULL DEFAULT false,
  eu_verified boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (solution_id, merchant_id, ali_product_id, warehouse_country)
);

CREATE TABLE public.sf_competitor_checks (
  id bigserial PRIMARY KEY,
  solution_id uuid NOT NULL REFERENCES public.sf_solutions(id) ON DELETE CASCADE,
  source text NOT NULL,
  equivalent_found boolean NOT NULL DEFAULT false,
  min_price_eur numeric(12,2),
  evidence jsonb NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_sourcing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL DEFAULT 'nightshift',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','partial')),
  stats jsonb NOT NULL DEFAULT '{}',
  ai_cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_candidates (
  id bigserial PRIMARY KEY,
  run_id uuid REFERENCES public.sf_sourcing_runs(id) ON DELETE CASCADE,
  ali_product_id text,
  stage text NOT NULL DEFAULT 'discovered',
  rejection_reason text,
  source_payload jsonb NOT NULL DEFAULT '{}',
  scores jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_search_events (
  id bigserial PRIMARY KEY,
  session_id text,
  query text NOT NULL,
  normalized_query text,
  result_count int NOT NULL DEFAULT 0,
  ai_model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_outcomes (
  id bigserial PRIMARY KEY,
  session_id text,
  solution_id uuid REFERENCES public.sf_solutions(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.sf_offers(id) ON DELETE SET NULL,
  outcome text NOT NULL CHECK (outcome IN ('solved','partial','failed','returned')),
  score smallint CHECK (score BETWEEN 1 AND 10),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL DEFAULT 'b2c' CHECK (audience IN ('b2c','b2b')),
  solution_id uuid REFERENCES public.sf_solutions(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.sf_offers(id) ON DELETE CASCADE,
  title_el text NOT NULL,
  reason_el text,
  priority numeric(5,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_b2b_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid UNIQUE NOT NULL REFERENCES public.sf_solutions(id) ON DELETE CASCADE,
  demand_score numeric(5,2),
  local_gap_score numeric(5,2),
  margin_pct numeric(7,2),
  opportunity_score numeric(5,2),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sf_model_usage (
  id bigserial PRIMARY KEY,
  provider text NOT NULL DEFAULT 'deepseek',
  model text NOT NULL,
  task text NOT NULL,
  input_tokens int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  cache_hit boolean NOT NULL DEFAULT false,
  estimated_cost_usd numeric(12,8) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sf_pains_title_idx ON public.sf_pains USING gin (to_tsvector('simple', title_el));
CREATE INDEX sf_solutions_title_idx ON public.sf_solutions USING gin (to_tsvector('simple', title_el));
CREATE INDEX sf_offers_live_idx ON public.sf_offers (active, eu_verified, verified_at DESC);
CREATE INDEX sf_candidates_stage_idx ON public.sf_candidates (stage, updated_at DESC);
CREATE INDEX sf_merchants_score_idx ON public.sf_merchants (merchant_score DESC NULLS LAST);

INSERT INTO public.sf_pains (slug,title_el,keywords) VALUES
('old-car-carplay','Θέλω CarPlay στο παλιό μου αυτοκίνητο χωρίς να αλλάξω radio',ARRAY['carplay','παλιό αυτοκίνητο','android auto']),
('weak-bedroom-wifi','Το Wi‑Fi δεν πιάνει καλά στο υπνοδωμάτιο',ARRAY['wifi','σήμα','υπνοδωμάτιο']),
('renter-night-heat','Ζεσταίνομαι το βράδυ αλλά δεν μπορώ να βάλω A/C',ARRAY['ζέστη','ύπνος','χωρίς εγκατάσταση']),
('pet-hair-sofa','Έχω τρίχες σκύλου παντού στον καναπέ',ARRAY['τρίχες','σκύλος','καναπές']),
('laptop-neck','Πονάει ο αυχένας μου όταν δουλεύω στο laptop',ARRAY['αυχένας','laptop','εργονομία']),
('small-kitchen-no-drill','Θέλω να οργανώσω μικρή κουζίνα χωρίς τρύπες',ARRAY['κουζίνα','οργάνωση','χωρίς τρύπες']);

CREATE OR REPLACE FUNCTION public.sf_search_cards(p_query text, p_limit int DEFAULT 8)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT s.id, p.title_el, s.title_el, pr.image_url,
         o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
         o.delivery_days, m.name, m.merchant_score, s.survivor_score, o.affiliate_url
  FROM sf_solutions s
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN sf_offers o ON o.solution_id=s.id AND o.active AND o.eu_verified
  JOIN sf_products pr ON pr.id=o.product_id
  JOIN sf_merchants m ON m.id=o.merchant_id AND m.active
  WHERE s.active AND s.stage='core' AND (
    p.title_el ILIKE '%'||p_query||'%' OR s.title_el ILIKE '%'||p_query||'%'
    OR to_tsvector('simple', p.title_el||' '||s.title_el) @@ plainto_tsquery('simple', p_query)
    OR EXISTS (SELECT 1 FROM unnest(p.keywords) k WHERE p_query ILIKE '%'||k||'%' OR k ILIKE '%'||p_query||'%')
  )
  ORDER BY s.survivor_score DESC NULLS LAST, m.merchant_score DESC NULLS LAST, o.price_eur ASC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),20);
$$;

CREATE OR REPLACE FUNCTION public.sf_featured_cards(p_limit int DEFAULT 1)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT s.id, p.title_el, s.title_el, pr.image_url,
         o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
         o.delivery_days, m.name, m.merchant_score, s.survivor_score, o.affiliate_url
  FROM sf_solutions s
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN sf_offers o ON o.solution_id=s.id AND o.active AND o.eu_verified
  JOIN sf_products pr ON pr.id=o.product_id
  JOIN sf_merchants m ON m.id=o.merchant_id AND m.active
  WHERE s.active AND s.stage='core'
  ORDER BY s.survivor_score DESC NULLS LAST, o.discount_pct DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),10);
$$;

CREATE OR REPLACE FUNCTION public.sf_b2b_feed(p_limit int DEFAULT 24)
RETURNS TABLE (
  id uuid, pain_title text, solution_title text, demand_score numeric,
  local_gap_score numeric, merchant_score numeric, margin_pct numeric,
  warehouse_country text, delivery_days int, price_eur numeric, affiliate_url text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT b.id,p.title_el,s.title_el,b.demand_score,b.local_gap_score,m.merchant_score,b.margin_pct,
         o.warehouse_country,o.delivery_days,o.price_eur,o.affiliate_url
  FROM sf_b2b_opportunities b
  JOIN sf_solutions s ON s.id=b.solution_id AND s.active
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN LATERAL (
    SELECT oo.* FROM sf_offers oo JOIN sf_merchants mm ON mm.id=oo.merchant_id
    WHERE oo.solution_id=s.id AND oo.active AND oo.eu_verified
    ORDER BY mm.merchant_score DESC NULLS LAST, oo.price_eur ASC NULLS LAST LIMIT 1
  ) o ON true
  JOIN sf_merchants m ON m.id=o.merchant_id
  WHERE b.active
  ORDER BY b.opportunity_score DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),50);
$$;

ALTER TABLE sf_pains ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_b2b_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY sf_public_pains ON sf_pains FOR SELECT USING (active);
CREATE POLICY sf_public_solutions ON sf_solutions FOR SELECT USING (active AND stage='core');
CREATE POLICY sf_public_products ON sf_products FOR SELECT USING (true);
CREATE POLICY sf_public_merchants ON sf_merchants FOR SELECT USING (active);
CREATE POLICY sf_public_offers ON sf_offers FOR SELECT USING (active AND eu_verified);
CREATE POLICY sf_public_b2b ON sf_b2b_opportunities FOR SELECT USING (active);

GRANT SELECT ON sf_pains,sf_solutions,sf_products,sf_merchants,sf_offers,sf_b2b_opportunities TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sf_search_cards(text,int), public.sf_featured_cards(int), public.sf_b2b_feed(int) TO anon, authenticated;
