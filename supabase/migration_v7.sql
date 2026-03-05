-- v7: management report links per employee
create table if not exists public.management_report_links (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table public.management_report_links enable row level security;

-- Employees can read their own links
create policy "Employees see own report links" on public.management_report_links
  for select using (
    auth.uid() = employee_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

-- Only admins can insert
create policy "Admins insert report links" on public.management_report_links
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );

-- Only admins can delete
create policy "Admins delete report links" on public.management_report_links
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'both'))
  );
