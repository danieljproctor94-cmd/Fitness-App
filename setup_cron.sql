-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Set up a cron job to run every 5 minutes
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY (or SERVICE_ROLE_KEY)
-- Note: It is safer to use the service role key for internal triggers.
-- The URL is standard: https://<project-ref>.supabase.co/functions/v1/process-reminders

SELECT cron.schedule(
    'process-reminders-every-5-mins',
    '*/5 * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://mhwxdqcnlibqxeiyyuxl.supabase.co/functions/v1/process-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer OMgBozNS6UdqIja8rYuVpUV9gKZ436LWKu_6mLkCofs"}'-- Using the private key provided as a temporary measure, though usually it's the Service Role Key
      ) as request_id;
    $$
);
