-- Stable offer identity for idempotent nightly upserts.
CREATE UNIQUE INDEX IF NOT EXISTS sf_offers_source_identity_uq
ON public.sf_offers(solution_id, merchant_id, ali_product_id, warehouse_country);
