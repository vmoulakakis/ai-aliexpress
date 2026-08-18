-- Drop V0 public read-model functions before V1 changes their RETURNS TABLE shape.
DROP FUNCTION IF EXISTS public.sf_search_cards(text,int);
DROP FUNCTION IF EXISTS public.sf_featured_cards(int);
DROP FUNCTION IF EXISTS public.sf_b2b_feed(int);
