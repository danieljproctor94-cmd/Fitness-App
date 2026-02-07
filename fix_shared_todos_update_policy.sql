-- Allow collaborators to update shared tasks

-- 1. Ensure the helper function exists (from fix_rls_recursion.sql)
create or replace function public.check_is_todo_owner(target_todo_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from todos 
    where id = target_todo_id 
    and user_id = auth.uid()
  );
$$;

-- 2. Create helper function to check if user is an editor
create or replace function public.check_is_todo_editor(target_todo_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from todo_collaborators
    where todo_id = target_todo_id
    and user_id = auth.uid()
    and permission = 'edit'
  );
$$;

-- 3. Update Policies on Todos table

-- Drop existing update policy if it conflicts or is too narrow
drop policy if exists "Users can update their own todos" on public.todos;
drop policy if exists "Users can update shared todos (if edit permission)" on public.todos;

-- Create comprehensive update policy
create policy "Users can update todos they own or have edit rights to"
  on public.todos for update
  using (
    auth.uid() = user_id 
    or 
    check_is_todo_editor(id)
  )
  with check (
    auth.uid() = user_id 
    or 
    check_is_todo_editor(id)
  );

-- Ensure select policy covers shared tasks (it should already, but let's reinforce)
-- (Assuming "Users can view shared todos" exists or is covered by "Users can view their own todos")
-- If not, we can add:
-- create policy "Users can view shared todos"
--   on public.todos for select
--   using (
--     auth.uid() = user_id 
--     or 
--     exists (select 1 from todo_collaborators where todo_id = id and user_id = auth.uid())
--   );
