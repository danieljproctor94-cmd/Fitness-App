-- Fix for "Missing Tasks": Breaking the Circular RLS Dependency

-- The issue is likely that checking "Shared Tasks" triggers a check on "Collaborators", 
-- which in turn checks "Task Ownership" on "Tasks", causing an infinite loop that blocks all data.

-- 1. Create a secure function to check ownership without triggering RLS loops
-- This function runs with "security definer" privileges (admin) to bypass the recursive check.
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

-- 2. Drop the problematic recursive policies on todo_collaborators
drop policy if exists "Users can view todo collaborators" on todo_collaborators;
drop policy if exists "Todo owners can add collaborators" on todo_collaborators;
drop policy if exists "Users can remove collaborators" on todo_collaborators;

-- 3. Re-create policies using the secure function

-- View: Collaborator themselves OR Todo Owner
create policy "Users can view todo collaborators v2"
  on todo_collaborators for select
  using (
    auth.uid() = user_id 
    or 
    check_is_todo_owner(todo_id)
  );

-- Insert: Todo owners can add
create policy "Todo owners can add collaborators v2"
  on todo_collaborators for insert
  with check (
    check_is_todo_owner(todo_id)
  );

-- Delete: Both can delete
create policy "Users can remove collaborators v2"
  on todo_collaborators for delete
  using (
    auth.uid() = user_id 
    or 
    check_is_todo_owner(todo_id)
  );

-- 4. Ensure standard "View Own" policies exist for Todos (Safety Check)
-- (These shouldn't loop, but good to ensure they exist)

drop policy if exists "Users can view their own todos" on public.todos;
create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own todos" on public.todos;
create policy "Users can create their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own todos" on public.todos;
create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own todos" on public.todos;
create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);
