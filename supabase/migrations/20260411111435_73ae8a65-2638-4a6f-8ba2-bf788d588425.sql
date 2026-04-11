
-- Help desk ticket categories and statuses
CREATE TYPE public.ticket_category AS ENUM ('infrastructure', 'conflicts', 'performance', 'meeting');
CREATE TYPE public.ticket_status AS ENUM ('open', 'deferred', 'denied', 'analyzing');

-- Help desk tickets table
CREATE TABLE public.help_desk_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category ticket_category NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  creator_id UUID NOT NULL,
  target_admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.help_desk_tickets ENABLE ROW LEVEL SECURITY;

-- Leaders can view their own tickets
CREATE POLICY "Users can read own tickets"
ON public.help_desk_tickets FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Admins can view tickets assigned to them
CREATE POLICY "Admins can read assigned tickets"
ON public.help_desk_tickets FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') AND target_admin_id = auth.uid());

-- Admins can read ALL tickets
CREATE POLICY "Admins can read all tickets"
ON public.help_desk_tickets FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can create tickets
CREATE POLICY "Users can create tickets"
ON public.help_desk_tickets FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Admins can update tickets (respond)
CREATE POLICY "Admins can update tickets"
ON public.help_desk_tickets FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Notice relay confirmations
CREATE TABLE public.notice_relays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notice_id, user_id)
);

ALTER TABLE public.notice_relays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read notice_relays"
ON public.notice_relays FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own relay"
ON public.notice_relays FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add requires_relay column to notices
ALTER TABLE public.notices ADD COLUMN requires_relay BOOLEAN NOT NULL DEFAULT false;
