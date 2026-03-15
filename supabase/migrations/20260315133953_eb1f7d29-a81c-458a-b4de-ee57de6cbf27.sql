
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN xp >= 4000 THEN 10
    WHEN xp >= 3000 THEN 9
    WHEN xp >= 2300 THEN 8
    WHEN xp >= 1700 THEN 7
    WHEN xp >= 1200 THEN 6
    WHEN xp >= 800 THEN 5
    WHEN xp >= 500 THEN 4
    WHEN xp >= 250 THEN 3
    WHEN xp >= 100 THEN 2
    ELSE 1
  END;
$$;
