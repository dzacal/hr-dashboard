-- v5 migration: update RLS policies to grant 'both' role the same access as 'admin'

-- Helper: is the current user an admin or both?
-- We update every policy that previously checked role = 'admin' to also allow role = 'both'

-- PTO REQUESTS
drop policy if exists "Employees see own PTO" on public.pto_requests;
create policy "Employees see own PTO" on public.pto_requests
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

drop policy if exists "Admins update PTO" on public.pto_requests;
create policy "Admins update PTO" on public.pto_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

-- REMOTE REQUESTS
drop policy if exists "Employees see own remote" on public.remote_requests;
create policy "Employees see own remote" on public.remote_requests
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

drop policy if exists "Admins update remote" on public.remote_requests;
create policy "Admins update remote" on public.remote_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

-- HR MESSAGES
drop policy if exists "Employees see own messages" on public.hr_messages;
create policy "Employees see own messages" on public.hr_messages
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

drop policy if exists "Admins update messages" on public.hr_messages;
create policy "Admins update messages" on public.hr_messages
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );
