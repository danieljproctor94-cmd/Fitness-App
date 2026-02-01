-- Collaborative Features Schema

-- 1. Collaborations (Friendships)
create table if not exists collaborations (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requester_id, receiver_id)
);

-- RLS for Collaborations
alter table collaborations enable row level security;

create policy "Users can view their own collaborations"
  on collaborations for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can insert collaborations (request)"
  on collaborations for insert
  with check (auth.uid() = requester_id);

create policy "Users can update their own collaborations (accept)"
  on collaborations for update
  using (auth.uid() = receiver_id); -- Only receiver can accept

create policy "Users can delete their own collaborations"
  on collaborations for delete
  using (auth.uid() = requester_id or auth.uid() = receiver_id);


-- 2. Todo Collaborators (Shared Tasks)
create table if not exists todo_collaborators (
  id uuid default uuid_generate_v4() primary key,
  todo_id uuid references todos(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  permission text check (permission in ('view', 'edit')) default 'edit',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(todo_id, user_id)
);

-- RLS for Todo Collaborators
alter table todo_collaborators enable row level security;

create policy "Users can view tasks shared with them"
  on todo_collaborators for select
  using (user_id = auth.uid());

create policy "Task owners can add collaborators"
  on todo_collaborators for insert
  with check (
    exists (
      select 1 from todos
      where id = todo_collaborators.todo_id
      and user_id = auth.uid()
    )
  );

-- Update RLS on Todos to allow collaborators to view/edit
create policy "Collaborators can view shared todos"
  on todos for select
  using (
    exists (
      select 1 from todo_collaborators
      where todo_id = todos.id
      and user_id = auth.uid()
    )
  );

create policy "Collaborators can update shared todos"
  on todos for update
  using (
    exists (
      select 1 from todo_collaborators
      where todo_id = todos.id
      and user_id = auth.uid()
      and permission = 'edit'
    )
  );

-- 3. Update Profiles RLS to allow friends to read basic info
-- This is tricky. We need a policy that says "If user B is in a 'accepted' collaboration with user A, let A read B's profile".
create policy "Friends can view profiles"
  on profiles for select
  using (
    exists (
      select 1 from collaborations
      where (requester_id = auth.uid() and receiver_id = profiles.id and status = 'accepted')
      or (receiver_id = auth.uid() and requester_id = profiles.id and status = 'accepted')
    )
  );

-- Helper function to search users by email (for inviting)
-- We cannot expose auth.users directly. We rely on profiles having email (which they do in our setup usually, or we search by username).
-- Assuming profiles has 'email' column from previous sync, or we just rely on username.
-- Let's check if profiles has email. If not, we might need a secure function.
-- For now, we'll assume we search by exact email match on profiles if available, or just implement a function.
