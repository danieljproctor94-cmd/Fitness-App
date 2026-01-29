-- Create a table for Mindset Logs
create table mindset_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null, -- Stores the date of the log (e.g., '2023-10-27')
  grateful_for text,
  improvements text
);

-- Set up Row Level Security (RLS)
alter table mindset_logs enable row level security;

-- Policy: Users can can only view and insert their own logs
create policy "Users can view own mindset logs" on mindset_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own mindset logs" on mindset_logs
  for insert with check (auth.uid() = user_id);

-- Optional: Index for faster querying by date
create index mindset_logs_user_date_idx on mindset_logs (user_id, date);
