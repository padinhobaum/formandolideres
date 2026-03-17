
-- Add color column to forum_categories
ALTER TABLE public.forum_categories ADD COLUMN color text DEFAULT '#3b82f6';

-- Update calculate_level function with halved thresholds
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN xp >= 2000 THEN 10
    WHEN xp >= 1500 THEN 9
    WHEN xp >= 1150 THEN 8
    WHEN xp >= 850 THEN 7
    WHEN xp >= 600 THEN 6
    WHEN xp >= 400 THEN 5
    WHEN xp >= 250 THEN 4
    WHEN xp >= 125 THEN 3
    WHEN xp >= 50 THEN 2
    ELSE 1
  END;
$function$;
