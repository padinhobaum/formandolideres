-- Fix the broken SELECT policy on chat_conversations
DROP POLICY IF EXISTS "Participants can read conversations" ON public.chat_conversations;

CREATE POLICY "Participants can read conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.conversation_id = chat_conversations.id
      AND chat_participants.user_id = auth.uid()
  )
);

-- Also allow creators to read their own conversations
CREATE POLICY "Creators can read own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Enable realtime for chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
