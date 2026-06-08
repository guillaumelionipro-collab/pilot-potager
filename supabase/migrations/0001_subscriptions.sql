-- Pilot Potager — Freemium / Premium subscription schema
-- Run with: supabase db push   (or paste into the SQL editor of your Supabase project)
--
-- Subscriptions are sold via Google Play Billing and synced through RevenueCat
-- (see supabase/functions/revenuecat-webhook). RevenueCat's `app_user_id` is
-- set to the Supabase auth user id from the client (Purchases.logIn), so this
-- table can be keyed directly on `user_id`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. subscriptions: one row per user, mirrors RevenueCat / Google Play state
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  status                  text not null default 'free' check (status in ('free', 'premium', 'cancelled', 'past_due')),
  plan                    text not null default 'free' check (plan in ('free', 'premium_monthly')),
  store                   text default 'PLAY_STORE',
  revenuecat_app_user_id  text,
  product_id              text,
  entitlement_id          text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  last_event_type         text,
  last_event_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- Auto-provision a "free" row whenever a new user signs up
create or replace function public.handle_new_user_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, status, plan)
  values (new.id, 'free', 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. usage_counters: tracks monthly free-tier quotas (e.g. 10 analyses IA/mois)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.usage_counters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  period        text not null,              -- "YYYY-MM"
  ai_analyses   integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists usage_counters_user_period_idx on public.usage_counters (user_id, period);

-- Atomically increments (and creates if missing) the AI analysis counter for the
-- current month; returns the new count so the client can enforce the free quota.
create or replace function public.increment_ai_usage(p_user_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_period text := to_char(now(), 'YYYY-MM');
  v_count integer;
begin
  insert into public.usage_counters (user_id, period, ai_analyses)
  values (p_user_id, v_period, 1)
  on conflict (user_id, period)
  do update set ai_analyses = usage_counters.ai_analyses + 1
  returning ai_analyses into v_count;
  return v_count;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security — users can only read/write their own rows
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.usage_counters enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id);

-- Inserts/status changes coming from RevenueCat happen via the service-role key
-- in the webhook Edge Function, which bypasses RLS — no public insert policy needed.

drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own" on public.usage_counters
  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Convenience view: "is this user premium right now?"
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.my_subscription as
  select s.*,
         (s.status = 'premium' and (s.current_period_end is null or s.current_period_end > now())) as is_premium
  from public.subscriptions s
  where s.user_id = auth.uid();
