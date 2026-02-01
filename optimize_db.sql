-- Optimizations for Fitness App Web
-- Adds indices to foreign keys and frequently queried columns to improve RLS and filter performance.

-- 1. Todos Table
-- Used heavily for "My Tasks" (RLS) and Calendar/List filtering
create index if not exists idx_todos_user_id on public.todos(user_id);
create index if not exists idx_todos_due_date on public.todos(due_date);
-- Composite index for common query: "My tasks in range"
create index if not exists idx_todos_user_date on public.todos(user_id, due_date);

-- 2. Workouts Table
-- Used for "My Workouts" list and analytics
create index if not exists idx_workouts_user_id on public.workouts(user_id);
create index if not exists idx_workouts_date on public.workouts(date);

-- 3. Measurements Table
-- Used for progress charts
create index if not exists idx_measurements_user_id on public.measurements(user_id);
create index if not exists idx_measurements_date on public.measurements(date);

-- 4. Mindset Logs
-- Used for history view
create index if not exists idx_mindset_logs_user_id on public.mindset_logs(user_id);
create index if not exists idx_mindset_logs_date on public.mindset_logs(date);

-- 5. Notifications
-- Used for the notification checking
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
