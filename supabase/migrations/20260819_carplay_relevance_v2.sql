update public.sf_pains
set sourcing_rules = jsonb_set(
  sourcing_rules,
  '{exclude_any}',
  jsonb_build_array('1 din','2 din','1din','2din','head unit','radio frame','fascia','replacement radio','for volkswagen','for peugeot','for ford')
)
where slug='old-car-carplay';
