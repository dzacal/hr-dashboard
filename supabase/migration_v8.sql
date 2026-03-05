-- Notifications table for in-app notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'pto_request' | 'pto_decision' | 'hr_message' | 'hr_reply' | 'report_reminder'
  title text not null,
  body text,
  link text,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table notifications enable row level security;

-- Users can only read their own notifications
create policy "users_read_own_notifications" on notifications
  for select using (auth.uid() = user_id);

-- Users can mark their own notifications as read
create policy "users_update_own_notifications" on notifications
  for update using (auth.uid() = user_id);

-- Index for fast unread count lookups
create index notifications_user_unread_idx on notifications (user_id, read) where read = false;
create index notifications_user_created_idx on notifications (user_id, created_at desc);
