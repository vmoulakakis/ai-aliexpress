-- Tighten the CarPlay pain: portable/dashboard solution only; never replace the factory radio.
UPDATE public.sf_pains SET
  sourcing_queries_en=ARRAY['portable wireless carplay dashboard screen','portable carplay screen no installation'],
  sourcing_rules='{"solution_label_el":"Φορητή οθόνη ασύρματου CarPlay","must_any":["portable carplay","carplay screen","carplay display","dashboard screen"],"exclude_any":["car radio","1 din","2 din","1din","2din","head unit","car stereo","for volkswagen","for peugeot","for ford"],"category":"car-tech"}'::jsonb
WHERE slug='old-car-carplay';

UPDATE public.sf_solutions s SET stage='archive', active=false, updated_at=now()
FROM public.sf_pains p
WHERE s.pain_id=p.id AND p.slug='old-car-carplay'
  AND EXISTS (
    SELECT 1 FROM public.sf_offers o
    JOIN public.sf_products pr ON pr.id=o.product_id
    WHERE o.solution_id=s.id
      AND lower(pr.canonical_title) ~ '(car radio|1 din|2 din|1din|2din|head unit|car stereo)'
  );

UPDATE public.sf_b2b_opportunities b SET active=false, updated_at=now()
FROM public.sf_solutions s WHERE b.solution_id=s.id AND s.stage='archive';
