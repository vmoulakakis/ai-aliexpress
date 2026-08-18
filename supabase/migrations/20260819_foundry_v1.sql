-- EU Solution Foundry V1: evidence, memory, merchant history and public read models

ALTER TABLE public.sf_pains ADD COLUMN IF NOT EXISTS sourcing_queries_en text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.sf_pains ADD COLUMN IF NOT EXISTS sourcing_rules jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sf_solutions ADD COLUMN IF NOT EXISTS source_key text UNIQUE;
ALTER TABLE public.sf_offers ADD COLUMN IF NOT EXISTS commission_rate numeric(7,4);
ALTER TABLE public.sf_offers ADD COLUMN IF NOT EXISTS evidence jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.sf_eu_evidence (
  id bigserial PRIMARY KEY,
  run_id uuid REFERENCES public.sf_sourcing_runs(id) ON DELETE CASCADE,
  pain_id uuid REFERENCES public.sf_pains(id) ON DELETE CASCADE,
  sourcing_query text NOT NULL,
  ali_product_id text NOT NULL,
  warehouse_country text NOT NULL,
  proof_url text NOT NULL,
  verification_source text NOT NULL DEFAULT 'aliexpress_ship_from_filter',
  title_hint text,
  image_hint text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(run_id, pain_id, sourcing_query, ali_product_id, warehouse_country)
);

CREATE TABLE IF NOT EXISTS public.sf_merchant_observations (
  id bigserial PRIMARY KEY,
  merchant_id uuid REFERENCES public.sf_merchants(id) ON DELETE CASCADE,
  ali_shop_id text NOT NULL,
  category_key text,
  evaluate_rate numeric(7,3),
  recent_volume numeric(14,2),
  eu_offer_count int NOT NULL DEFAULT 0,
  average_price_eur numeric(12,2),
  observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sf_offer_snapshots (
  id bigserial PRIMARY KEY,
  offer_id uuid REFERENCES public.sf_offers(id) ON DELETE CASCADE,
  price_eur numeric(12,2),
  old_price_eur numeric(12,2),
  discount_pct numeric(7,2),
  warehouse_country text,
  delivery_days int,
  eu_verified boolean NOT NULL DEFAULT false,
  observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sf_agent_events (
  id bigserial PRIMARY KEY,
  run_id uuid REFERENCES public.sf_sourcing_runs(id) ON DELETE SET NULL,
  agent_role text NOT NULL,
  subject_type text NOT NULL,
  subject_key text NOT NULL,
  decision text NOT NULL,
  reason_code text,
  confidence numeric(5,2),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sf_memory_items (
  id bigserial PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('fact','lesson','merchant','product','pain','outcome','policy')),
  subject_key text NOT NULL,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  confidence numeric(5,2) NOT NULL DEFAULT 70,
  source text,
  embedding extensions.vector(384),
  active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kind, subject_key, content)
);

CREATE INDEX IF NOT EXISTS sf_eu_evidence_product_idx ON public.sf_eu_evidence(ali_product_id, verified_at DESC);
CREATE INDEX IF NOT EXISTS sf_eu_evidence_query_idx ON public.sf_eu_evidence(run_id, pain_id, sourcing_query);
CREATE INDEX IF NOT EXISTS sf_merchant_observations_idx ON public.sf_merchant_observations(ali_shop_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS sf_offer_snapshots_idx ON public.sf_offer_snapshots(offer_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS sf_agent_events_subject_idx ON public.sf_agent_events(subject_type, subject_key, created_at DESC);
CREATE INDEX IF NOT EXISTS sf_memory_tags_idx ON public.sf_memory_items USING gin(tags);
CREATE INDEX IF NOT EXISTS sf_memory_subject_idx ON public.sf_memory_items(kind, subject_key, updated_at DESC);
CREATE INDEX IF NOT EXISTS sf_memory_embedding_hnsw ON public.sf_memory_items USING hnsw (embedding vector_cosine_ops) WHERE embedding IS NOT NULL;

ALTER TABLE public.sf_eu_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_merchant_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_offer_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sf_memory_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sf_eu_evidence, public.sf_merchant_observations, public.sf_offer_snapshots, public.sf_agent_events, public.sf_memory_items FROM anon, authenticated;

-- Greek pain → English supply-query rules. No demand score is invented here.
UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['portable wireless carplay screen','wireless carplay display old car'],
  sourcing_rules='{"solution_label_el":"Φορητή οθόνη ασύρματου CarPlay","must_any":["carplay","android auto"],"exclude_any":["radio replacement","2 din","head unit","for volkswagen","for peugeot","for ford"],"category":"car-tech"}'::jsonb
WHERE slug='old-car-carplay';

UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['wifi repeater range extender','powerline wifi adapter'],
  sourcing_rules='{"solution_label_el":"Ενίσχυση Wi‑Fi για δύσκολο δωμάτιο","must_any":["wifi","wi-fi","repeater","extender","powerline"],"exclude_any":["carplay","car radio","zigbee gateway"],"category":"home-connectivity"}'::jsonb
WHERE slug='weak-bedroom-wifi';

UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['quiet tower fan bedroom','portable air circulator bedroom'],
  sourcing_rules='{"solution_label_el":"Ήσυχη φορητή ψύξη χωρίς εγκατάσταση","must_any":["fan","air circulator","cooling"],"exclude_any":["car fan","gpu fan","computer fan"],"category":"home-comfort"}'::jsonb
WHERE slug='renter-night-heat';

UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['pet hair remover sofa','dog hair remover couch'],
  sourcing_rules='{"solution_label_el":"Αφαίρεση τρίχας κατοικιδίου από καναπέ","must_any":["pet hair","dog hair","fur remover","lint remover"],"exclude_any":["hair clip","human hair","bracelet","sunglasses","wig"],"category":"pets-home"}'::jsonb
WHERE slug='pet-hair-sofa';

UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['ergonomic laptop stand','portable laptop riser'],
  sourcing_rules='{"solution_label_el":"Εργονομική ανύψωση laptop","must_any":["laptop stand","laptop riser","notebook stand"],"exclude_any":["phone stand","tablet only","car holder"],"category":"workspace"}'::jsonb
WHERE slug='laptop-neck';

UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['no drill kitchen organizer','adhesive kitchen storage rack'],
  sourcing_rules='{"solution_label_el":"Οργάνωση κουζίνας χωρίς τρύπες","must_any":["kitchen","organizer","storage rack","adhesive"],"exclude_any":["bathroom only","car organizer","jewelry"],"category":"home-organization"}'::jsonb
WHERE slug='small-kitchen-no-drill';

CREATE OR REPLACE FUNCTION public.sf_search_cards(p_query text, p_limit int DEFAULT 8)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text,
  express boolean, quality_score numeric, gap_type text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT s.id, p.title_el, s.title_el, pr.image_url,
         o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
         o.delivery_days, coalesce(m.name,'Ελεγμένος έμπορος'), m.merchant_score,
         s.survivor_score, o.affiliate_url, o.express, pr.quality_score, s.gap_type
  FROM sf_solutions s
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN LATERAL (
    SELECT oo.* FROM sf_offers oo
    JOIN sf_merchants mm ON mm.id=oo.merchant_id AND mm.active
    WHERE oo.solution_id=s.id AND oo.active AND oo.eu_verified
      AND oo.verified_at > now()-interval '30 hours'
    ORDER BY mm.merchant_score DESC NULLS LAST, oo.price_eur ASC NULLS LAST LIMIT 1
  ) o ON true
  JOIN sf_products pr ON pr.id=o.product_id
  JOIN sf_merchants m ON m.id=o.merchant_id
  WHERE s.active AND s.stage='core' AND (
    p.title_el ILIKE '%'||p_query||'%' OR s.title_el ILIKE '%'||p_query||'%'
    OR pr.canonical_title ILIKE '%'||p_query||'%'
    OR to_tsvector('simple', p.title_el||' '||s.title_el||' '||pr.canonical_title) @@ plainto_tsquery('simple', p_query)
    OR EXISTS (SELECT 1 FROM unnest(p.keywords) k WHERE p_query ILIKE '%'||k||'%' OR k ILIKE '%'||p_query||'%')
  )
  ORDER BY s.survivor_score DESC NULLS LAST, m.merchant_score DESC NULLS LAST, o.price_eur ASC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),20);
$$;

CREATE OR REPLACE FUNCTION public.sf_featured_cards(p_limit int DEFAULT 6)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text,
  express boolean, quality_score numeric, gap_type text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT s.id, p.title_el, s.title_el, pr.image_url,
         o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
         o.delivery_days, coalesce(m.name,'Ελεγμένος έμπορος'), m.merchant_score,
         s.survivor_score, o.affiliate_url, o.express, pr.quality_score, s.gap_type
  FROM sf_solutions s
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN LATERAL (
    SELECT oo.* FROM sf_offers oo JOIN sf_merchants mm ON mm.id=oo.merchant_id
    WHERE oo.solution_id=s.id AND oo.active AND oo.eu_verified
      AND oo.verified_at > now()-interval '30 hours'
    ORDER BY oo.discount_pct DESC NULLS LAST, mm.merchant_score DESC NULLS LAST, oo.price_eur ASC NULLS LAST LIMIT 1
  ) o ON true
  JOIN sf_products pr ON pr.id=o.product_id
  JOIN sf_merchants m ON m.id=o.merchant_id
  WHERE s.active AND s.stage='core'
  ORDER BY o.discount_pct DESC NULLS LAST, s.survivor_score DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),12);
$$;

CREATE OR REPLACE FUNCTION public.sf_b2b_feed(p_limit int DEFAULT 24)
RETURNS TABLE (
  id uuid, solution_id uuid, pain_title text, solution_title text, stage text,
  demand_score numeric, local_gap_score numeric, opportunity_score numeric,
  merchant_score numeric, margin_pct numeric, warehouse_country text,
  delivery_days int, price_eur numeric, discount_pct numeric, affiliate_url text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT b.id,s.id,p.title_el,s.title_el,s.stage,b.demand_score,b.local_gap_score,b.opportunity_score,
         m.merchant_score,b.margin_pct,o.warehouse_country,o.delivery_days,o.price_eur,o.discount_pct,o.affiliate_url
  FROM sf_b2b_opportunities b
  JOIN sf_solutions s ON s.id=b.solution_id AND s.active AND s.stage IN ('lab','core')
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN LATERAL (
    SELECT oo.* FROM sf_offers oo JOIN sf_merchants mm ON mm.id=oo.merchant_id
    WHERE oo.solution_id=s.id AND oo.active AND oo.eu_verified
    ORDER BY mm.merchant_score DESC NULLS LAST, oo.price_eur ASC NULLS LAST LIMIT 1
  ) o ON true
  JOIN sf_merchants m ON m.id=o.merchant_id
  WHERE b.active
  ORDER BY (s.stage='core') DESC, b.opportunity_score DESC NULLS LAST, m.merchant_score DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),50);
$$;

GRANT EXECUTE ON FUNCTION public.sf_search_cards(text,int), public.sf_featured_cards(int), public.sf_b2b_feed(int) TO anon, authenticated;
