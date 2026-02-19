-- Set up a cron job to sync all Google Calendars every hour
-- Reference: https://mhwxdqcnlibqxeiyyuxl.supabase.co/functions/v1/sync-all-calendars

SELECT cron.schedule(
    'sync-google-calendars-hourly',
    '0 * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://mhwxdqcnlibqxeiyyuxl.supabase.co/functions/v1/sync-all-calendars',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer OMgBozNS6UdqIja8rYuVpUV9gKZ436LWKu_6mLkCofs"}'
      ) as request_id;
    $$
);

-- Also ensuring the reminders job is still correctly set
-- Scheduled every 5 minutes
-- SELECT cron.schedule(
--    'process-reminders-every-5-mins',
--    '*/5 * * * *',
--    ...
-- );