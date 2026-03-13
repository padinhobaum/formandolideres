
-- Chat system tables
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  is_group boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Targeted notices: add target_user_ids column to notices
ALTER TABLE public.notices ADD COLUMN target_user_ids uuid[] DEFAULT NULL;

-- RLS for chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_conversations: participants can read
CREATE POLICY "Participants can read conversations" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id = id AND user_id = auth.uid()));

-- chat_conversations: authenticated can create
CREATE POLICY "Authenticated can create conversations" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- chat_participants: participants can read
CREATE POLICY "Participants can read participants" ON public.chat_participants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_participants cp WHERE cp.conversation_id = chat_participants.conversation_id AND cp.user_id = auth.uid()));

-- chat_participants: conversation creator can add participants
CREATE POLICY "Authenticated can add participants" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- chat_messages: participants can read
CREATE POLICY "Participants can read messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));

-- chat_messages: participants can send
CREATE POLICY "Participants can send messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Update handle_new_user to also set class_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, class_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'class_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
