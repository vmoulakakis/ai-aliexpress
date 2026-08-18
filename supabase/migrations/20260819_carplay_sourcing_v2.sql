update public.sf_pains
set sourcing_queries_en = array[
  'portable wireless carplay monitor dashboard',
  'portable wireless apple carplay screen suction mount',
  'portable carplay display dash mount'
],
sourcing_rules = jsonb_build_object(
  'category','car-tech',
  'must_any',jsonb_build_array('portable carplay','wireless carplay','carplay screen','carplay display','dashboard screen','dash monitor'),
  'exclude_any',jsonb_build_array('car radio','1 din','2 din','1din','2din','head unit','car stereo','radio frame','fascia','replacement radio','for volkswagen','for peugeot','for ford'),
  'solution_label_el','Φορητή οθόνη ασύρματου CarPlay'
)
where slug='old-car-carplay';
