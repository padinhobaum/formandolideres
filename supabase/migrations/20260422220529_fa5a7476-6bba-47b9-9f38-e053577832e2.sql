-- 1. Reset XP de todos os usuários
TRUNCATE TABLE public.user_xp;
TRUNCATE TABLE public.xp_events;

-- 2. Reset dados de pesquisas e clima da sala (preservando estrutura)
TRUNCATE TABLE public.survey_responses;
TRUNCATE TABLE public.class_climate_responses;

-- 3. Adicionar trigger para conceder 50 XP automaticamente ao responder Clima da Sala
CREATE OR REPLACE FUNCTION public.award_climate_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Concede 50 XP, usando o ID da resposta como reference_id para evitar duplicidade
  PERFORM public.award_xp(NEW.user_id, 'class_climate_response', NEW.id::text, 50);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_xp_on_climate_response ON public.class_climate_responses;
CREATE TRIGGER award_xp_on_climate_response
AFTER INSERT ON public.class_climate_responses
FOR EACH ROW
EXECUTE FUNCTION public.award_climate_xp();