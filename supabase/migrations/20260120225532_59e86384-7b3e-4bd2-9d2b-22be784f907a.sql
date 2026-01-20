-- Create study_events table to track user study activities
CREATE TABLE public.study_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'pomodoro_completed', 'flashcard_reviewed', 'document_analyzed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.study_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own study events"
ON public.study_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study events"
ON public.study_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study events"
ON public.study_events
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_study_events_user_id ON public.study_events(user_id);
CREATE INDEX idx_study_events_type ON public.study_events(event_type);
CREATE INDEX idx_study_events_created_at ON public.study_events(created_at DESC);