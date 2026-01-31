/**
 * Enable Realtime for Notifications
 * 
 * By default, new tables are not exposed to the Realtime API for performance/security.
 * We must explicitly add the 'notifications' table to the 'supabase_realtime' publication.
 */

alter publication supabase_realtime add table public.notifications;
