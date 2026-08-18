-- Search V2: never leave the product experience empty when verified LAB evidence exists.
-- CORE ranks first. LAB is explicitly labelled as pending Greek-market gap verification.

CREATE OR REPLACE FUNCTION public.sf_search_cards_v2(p_query text, p_limit int DEFAULT 8)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text,
  express boolean, quality_score numeric, gap_type text, stage text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  WITH ranked AS (
    SELECT s.id AS solution_id, p.title_el AS pain_title, s.title_el AS solution_title,
           pr.image_url, o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
           o.delivery_days, coalesce(m.name,'Ελεγμένος έμπορος') AS merchant_name,
           m.merchant_score, s.survivor_score, o.affiliate_url, o.express,
           pr.quality_score, s.gap_type, s.stage,
           CASE WHEN s.stage='core' THEN 0 ELSE 1 END AS stage_rank
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
    WHERE s.active AND s.stage IN ('core','lab') AND (
      lower(p.title_el) LIKE '%'||lower(p_query)||'%'
      OR lower(s.title_el) LIKE '%'||lower(p_query)||'%'
      OR lower(pr.canonical_title) LIKE '%'||lower(p_query)||'%'
      OR EXISTS (
        SELECT 1 FROM regexp_split_to_table(lower(p_query), E'\\s+') w
        WHERE length(w)>=3 AND (
          lower(p.title_el) LIKE '%'||w||'%'
          OR lower(s.title_el) LIKE '%'||w||'%'
          OR lower(pr.canonical_title) LIKE '%'||w||'%'
          OR EXISTS (SELECT 1 FROM unnest(p.keywords) k WHERE lower(k) LIKE '%'||w||'%' OR w LIKE '%'||lower(k)||'%')
        )
      )
    )
  )
  SELECT solution_id,pain_title,solution_title,image_url,price_eur,old_price_eur,discount_pct,
         warehouse_country,delivery_days,merchant_name,merchant_score,survivor_score,
         affiliate_url,express,quality_score,gap_type,stage
  FROM ranked
  ORDER BY stage_rank, survivor_score DESC NULLS LAST, merchant_score DESC NULLS LAST, price_eur ASC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),20);
$$;

CREATE OR REPLACE FUNCTION public.sf_featured_cards_v2(p_limit int DEFAULT 6)
RETURNS TABLE (
  solution_id uuid, pain_title text, solution_title text, image_url text,
  price_eur numeric, old_price_eur numeric, discount_pct numeric,
  warehouse_country text, delivery_days int, merchant_name text,
  merchant_score numeric, survivor_score numeric, affiliate_url text,
  express boolean, quality_score numeric, gap_type text, stage text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT s.id, p.title_el, s.title_el, pr.image_url,
         o.price_eur, o.old_price_eur, o.discount_pct, o.warehouse_country,
         o.delivery_days, coalesce(m.name,'Ελεγμένος έμπορος'), m.merchant_score,
         s.survivor_score, o.affiliate_url, o.express, pr.quality_score, s.gap_type, s.stage
  FROM sf_solutions s
  JOIN sf_pains p ON p.id=s.pain_id
  JOIN LATERAL (
    SELECT oo.* FROM sf_offers oo JOIN sf_merchants mm ON mm.id=oo.merchant_id AND mm.active
    WHERE oo.solution_id=s.id AND oo.active AND oo.eu_verified
      AND oo.verified_at > now()-interval '30 hours'
    ORDER BY oo.discount_pct DESC NULLS LAST, mm.merchant_score DESC NULLS LAST, oo.price_eur ASC NULLS LAST LIMIT 1
  ) o ON true
  JOIN sf_products pr ON pr.id=o.product_id
  JOIN sf_merchants m ON m.id=o.merchant_id
  WHERE s.active AND s.stage IN ('core','lab')
  ORDER BY (s.stage='core') DESC, o.discount_pct DESC NULLS LAST, s.survivor_score DESC NULLS LAST
  LIMIT LEAST(GREATEST(p_limit,1),12);
$$;

GRANT EXECUTE ON FUNCTION public.sf_search_cards_v2(text,int), public.sf_featured_cards_v2(int) TO anon, authenticated;
