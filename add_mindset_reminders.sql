-- Add columns for Mindset Reminders to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mindset_reminder_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mindset_reminder_time text DEFAULT '20:00'; -- Default to 8:00 PM
