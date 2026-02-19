-- Create table for storing Google Refresh Tokens
-- This table stores the refresh tokens needed to generate new access tokens for background syncing.
CREATE TABLE IF NOT EXISTS public.google_sync_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect the table
ALTER TABLE public.google_sync_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own sync status
CREATE POLICY "Users can manage their own google sync" ON public.google_sync_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Add google_event_id to todos to track synced events and avoid duplicates
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS google_event_id TEXT;
-- Create an index instead of unique to avoid conflicts if previously deleted
CREATE INDEX IF NOT EXISTS idx_todos_google_event_id ON public.todos(google_event_id);
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
