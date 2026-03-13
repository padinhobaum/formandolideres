
-- Fix permissive INSERT policy on chat_participants
DROP POLICY "Authenticated can add participants" ON public.chat_participants;
CREATE POLICY "Conversation members can add participants" ON public.chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = conversation_id AND created_by = auth.uid())
    OR auth.uid() = user_id
  );

-- Allow deleting own conversations
CREATE POLICY "Creator can delete conversations" ON public.chat_conversations
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());
