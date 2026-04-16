
-- Add vote_type column to proposal_votes (1 = positive, -1 = negative)
ALTER TABLE public.proposal_votes
ADD COLUMN vote_type smallint NOT NULL DEFAULT 1;

-- Add positive/negative count columns to proposals
ALTER TABLE public.proposals
ADD COLUMN positive_vote_count integer NOT NULL DEFAULT 0,
ADD COLUMN negative_vote_count integer NOT NULL DEFAULT 0;

-- Initialize positive_vote_count from existing vote_count (all existing votes are positive)
UPDATE public.proposals SET positive_vote_count = vote_count;

-- Drop existing unique constraint if any, then add proper one
DO $$
BEGIN
  -- Check if constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proposal_votes_proposal_id_user_id_key'
  ) THEN
    ALTER TABLE public.proposal_votes DROP CONSTRAINT proposal_votes_proposal_id_user_id_key;
  END IF;
END $$;

ALTER TABLE public.proposal_votes
ADD CONSTRAINT proposal_votes_proposal_id_user_id_key UNIQUE (proposal_id, user_id);

-- Replace the vote count trigger function
CREATE OR REPLACE FUNCTION public.update_proposal_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 1 THEN
      UPDATE proposals SET
        positive_vote_count = positive_vote_count + 1,
        vote_count = positive_vote_count + 1 - negative_vote_count,
        score = positive_vote_count + 1 - negative_vote_count
      WHERE id = NEW.proposal_id;
    ELSE
      UPDATE proposals SET
        negative_vote_count = negative_vote_count + 1,
        vote_count = positive_vote_count - (negative_vote_count + 1),
        score = positive_vote_count - (negative_vote_count + 1)
      WHERE id = NEW.proposal_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 1 THEN
      UPDATE proposals SET
        positive_vote_count = GREATEST(positive_vote_count - 1, 0),
        vote_count = GREATEST(positive_vote_count - 1, 0) - negative_vote_count,
        score = GREATEST(positive_vote_count - 1, 0) - negative_vote_count
      WHERE id = OLD.proposal_id;
    ELSE
      UPDATE proposals SET
        negative_vote_count = GREATEST(negative_vote_count - 1, 0),
        vote_count = positive_vote_count - GREATEST(negative_vote_count - 1, 0),
        score = positive_vote_count - GREATEST(negative_vote_count - 1, 0)
      WHERE id = OLD.proposal_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote type change
    IF OLD.vote_type <> NEW.vote_type THEN
      IF NEW.vote_type = 1 THEN
        -- Changed from negative to positive
        UPDATE proposals SET
          positive_vote_count = positive_vote_count + 1,
          negative_vote_count = GREATEST(negative_vote_count - 1, 0),
          vote_count = (positive_vote_count + 1) - GREATEST(negative_vote_count - 1, 0),
          score = (positive_vote_count + 1) - GREATEST(negative_vote_count - 1, 0)
        WHERE id = NEW.proposal_id;
      ELSE
        -- Changed from positive to negative
        UPDATE proposals SET
          positive_vote_count = GREATEST(positive_vote_count - 1, 0),
          negative_vote_count = negative_vote_count + 1,
          vote_count = GREATEST(positive_vote_count - 1, 0) - (negative_vote_count + 1),
          score = GREATEST(positive_vote_count - 1, 0) - (negative_vote_count + 1)
        WHERE id = NEW.proposal_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Recreate the trigger to also handle UPDATE
DROP TRIGGER IF EXISTS update_proposal_vote_count ON public.proposal_votes;
CREATE TRIGGER update_proposal_vote_count
AFTER INSERT OR DELETE OR UPDATE ON public.proposal_votes
FOR EACH ROW EXECUTE FUNCTION public.update_proposal_vote_count();

-- Allow users to update their own votes (to change vote_type)
CREATE POLICY "Users can update own votes"
ON public.proposal_votes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
