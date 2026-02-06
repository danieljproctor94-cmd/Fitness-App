-- Fix missing relationships for PostgREST to detect them
-- The error PGRST200 means Supabase/PostgREST doesn't see the foreign key to profiles.

-- 1. Ensure the constraints exist (safely drop first to be sure)
alter table collaborations drop constraint if exists collaborations_requester_id_fkey;
alter table collaborations drop constraint if exists collaborations_receiver_id_fkey;

-- 2. Add them back explicitly pointing to profiles.id
alter table collaborations
  add constraint collaborations_requester_id_fkey
  foreign key (requester_id)
  references profiles(id)
  on delete cascade;

alter table collaborations
  add constraint collaborations_receiver_id_fkey
  foreign key (receiver_id)
  references profiles(id)
  on delete cascade;

-- 3. Reload the schema cache is usually automatic, but just incase, we do a dummy notify
notify pgrst, 'reload schema';
