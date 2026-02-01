-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create Collaborations Table (Friends)
create table if not exists public.collaborations (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requester_id, receiver_id)
);

-- RLS for Collaborations
alter table public.collaborations enable row level security;

-- Users can view their own collaborations (sent or received)
create policy "Users can view their own collaborations"
  on public.collaborations for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- Users can create a friend request
create policy "Users can create friend requests"
  on public.collaborations for insert
  with check (auth.uid() = requester_id);

-- Users can accept (update) requests sent to them
create policy "Users can update their received requests"
  on public.collaborations for update
  using (auth.uid() = receiver_id);

-- Users can delete their own collaborations
create policy "Users can delete their own collaborations"
  on public.collaborations for delete
  using (auth.uid() = requester_id or auth.uid() = receiver_id);


-- 2. Create Todo Collaborators Table
create table if not exists public.todo_collaborators (
  id uuid default uuid_generate_v4() primary key,
  todo_id uuid references public.todos(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  permission text check (permission in ('view', 'edit')) default 'view',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(todo_id, user_id)
);

-- RLS for Todo Collaborators
alter table public.todo_collaborators enable row level security;

-- View: Users can view collaborations they are part of OR if they own the todo
create policy "Users can view todo collaborators"
  on public.todo_collaborators for select
  using (
    auth.uid() = user_id 
    or 
    exists (select 1 from public.todos where id = todo_id and user_id = auth.uid())
  );

-- Insert: Todo owners can add collaborators
create policy "Todo owners can add collaborators"
  on public.todo_collaborators for insert
  with check (
    exists (select 1 from public.todos where id = todo_id and user_id = auth.uid())
  );

-- Delete: Todo owners or the collaborator themselves can remove
create policy "Users can remove collaborators"
  on public.todo_collaborators for delete
  using (
    auth.uid() = user_id 
    or 
    exists (select 1 from public.todos where id = todo_id and user_id = auth.uid())
  );


-- 3. Update Todos RLS to support shared access
-- Note: You might need to drop existing policies on 'todos' if they conflict, 
-- or this might just add to them. Ensure your existing 'Select' policy is broad enough or add this one.

create policy "Users can view shared todos"
  on public.todos for select
  using (
    exists (
      select 1 from public.todo_collaborators 
      where todo_id = public.todos.id and user_id = auth.uid()
    )
  );

create policy "Users can update shared todos (if edit permission)"
  on public.todos for update
  using (
    exists (
      select 1 from public.todo_collaborators 
      where todo_id = public.todos.id and user_id = auth.uid() and permission = 'edit'
    )
  );


-- 4. Enable Realtime for these tables (Optional but recommended)
alter publication supabase_realtime add table collaborations;
alter publication supabase_realtime add table todo_collaborators;
