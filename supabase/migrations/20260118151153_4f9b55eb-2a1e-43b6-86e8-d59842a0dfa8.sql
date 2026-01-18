-- Add missing UPDATE policy for chat_sessions
-- This allows users to update their own session titles (for AI-generated titles)
CREATE POLICY "Users can update own sessions" 
ON public.chat_sessions
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);