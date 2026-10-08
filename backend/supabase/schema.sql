create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null check (date <= current_date + 1),
  sleep_hours numeric(4, 1) not null check (sleep_hours between 0 and 12),
  stress_level smallint not null check (stress_level between 1 and 5),
  caffeine_cups smallint not null check (caffeine_cups between 0 and 20),
  exercise_minutes smallint not null check (exercise_minutes between 0 and 600),
  medication_taken boolean not null,
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.seizure_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  duration_minutes smallint not null check (duration_minutes between 1 and 180),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 30),
  priority smallint not null check (priority between 1 and 20),
  created_at timestamptz not null default now()
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, date desc);
create index if not exists seizure_events_user_time_idx on public.seizure_events (user_id, occurred_at desc);
create index if not exists emergency_contacts_user_priority_idx on public.emergency_contacts (user_id, priority);

alter table public.daily_logs enable row level security;
alter table public.seizure_events enable row level security;
alter table public.emergency_contacts enable row level security;

create policy "Users can manage their own daily logs"
  on public.daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own seizure events"
  on public.seizure_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own emergency contacts"
  on public.emergency_contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
