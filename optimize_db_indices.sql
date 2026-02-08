-- Database Optimization: Add Indices for Performance

-- 1. Foreign Key Indices (Crucial for joins and filtering by user)
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_mindset_logs_user_id ON mindset_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_completions_user_id ON todo_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_completions_todo_id ON todo_completions(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_exceptions_user_id ON todo_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_exceptions_todo_id ON todo_exceptions(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_user_id ON todo_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_collaborators_todo_id ON todo_collaborators(todo_id);

-- 2. Sorting Indices (For ORDER BY clauses)
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date ASC);
CREATE INDEX IF NOT EXISTS idx_mindset_logs_date ON mindset_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- 3. Collaboration Indices (For finding relationships)
CREATE INDEX IF NOT EXISTS idx_collaborations_requester_id ON collaborations(requester_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_receiver_id ON collaborations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);

-- 4. Profile Indices (For searching and ordering)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- 5. App Settings (Key lookup)
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
