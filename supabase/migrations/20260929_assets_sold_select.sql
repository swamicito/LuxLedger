-- Sold assets must remain publicly readable so /asset/:id renders read-only
-- for everyone — including the buyer, who is not the assets.owner_id. Without
-- this, "Public can view verified and listed assets" (status IN verified/
-- tokenized/listed) stops matching the moment status flips to 'sold' and the
-- page 404s. Permissive policies OR together, so this is purely additive and
-- cannot widen visibility of non-sold rows.

DROP POLICY IF EXISTS "Public can view sold assets" ON public.assets;
CREATE POLICY "Public can view sold assets"
    ON public.assets FOR SELECT
    USING (status = 'sold');
