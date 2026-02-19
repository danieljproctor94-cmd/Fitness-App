CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_google_event_id ON todos (google_event_id) WHERE google_event_id IS NOT NULL;
