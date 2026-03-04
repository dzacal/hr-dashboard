-- ============================================================
-- HR Portal - Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  auth_email text not null,
  real_email text not null,
  username text unique not null,
  full_name text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  department text,
  position text,
  start_date date,
  pto_accrual_rate numeric(4,2) not null default 1.25,
  created_at timestamptz default now()
);

-- PTO REQUESTS TABLE
create table public.pto_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  days_requested numeric(5,2) not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REMOTE REQUESTS TABLE
create table public.remote_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HR MESSAGES TABLE
create table public.hr_messages (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  admin_reply text,
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.pto_requests enable row level security;
alter table public.remote_requests enable row level security;
alter table public.hr_messages enable row level security;

-- PROFILES POLICIES
-- Allow username lookup (needed for login page)
create policy "Allow username lookup" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- PTO REQUESTS POLICIES
create policy "Employees see own PTO" on public.pto_requests
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Employees create own PTO" on public.pto_requests
  for insert with check (auth.uid() = employee_id);

create policy "Admins update PTO" on public.pto_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- REMOTE REQUESTS POLICIES
create policy "Employees see own remote" on public.remote_requests
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Employees create own remote" on public.remote_requests
  for insert with check (auth.uid() = employee_id);

create policy "Admins update remote" on public.remote_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- HR MESSAGES POLICIES
create policy "Employees see own messages" on public.hr_messages
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Employees create own messages" on public.hr_messages
  for insert with check (auth.uid() = employee_id);

create policy "Admins update messages" on public.hr_messages
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CREATE YOUR FIRST ADMIN USER
-- After running this schema, go to Supabase > Authentication >
-- Users and manually create a user with your email + password.
-- Then run this INSERT replacing the UUID with that user's ID:
-- ============================================================

-- insert into public.profiles (id, auth_email, real_email, username, full_name, role)
-- values (
--   'PASTE-USER-UUID-HERE',
--   'admin@yourcompany.com',
--   'admin@yourcompany.com',
--   'admin',
--   'HR Admin',
--   'admin'
-- );
