-- Sprint 2 migration — Cost & Reliability
--
-- Adds two tables:
--   ai_cache       — generated, validated questions for re-serving
--   ai_generations — per-user log of LLM calls (drives the monthly cap)
--
-- Apply in the Supabase SQL editor. Idempotent: re-running is safe.

-- ============================================================================
-- ai_cache
-- ============================================================================

create table if not exists public.ai_cache (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('mc','open')),
  cert text not null check (cert in ('PSM1','PSPO1')),
  difficulty text null,
  style text null,
  topic_seed text null,
  topic text null,
  prompt_version int not null default 1,
  payload jsonb not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_cache_lookup_idx
  on public.ai_cache (mode, cert, difficulty, prompt_version);

create index if not exists ai_cache_topic_idx
  on public.ai_cache (topic);

-- RLS: only service_role (used via SUPABASE_SERVICE_ROLE_KEY in API routes)
-- can read/write. Anonymous and authenticated end users see nothing directly;
-- they only ever receive cached payloads through the API.
alter table public.ai_cache enable row level security;

drop policy if exists "service_role only" on public.ai_cache;
create policy "service_role only" on public.ai_cache
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- ai_generations
-- ============================================================================

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (endpoint in (
    'generate-question',
    'generate-open-question',
    'grade-open-answer'
  )),
  cached boolean not null default false,
  cert text null,
  difficulty text null,
  style text null,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_user_window_idx
  on public.ai_generations (user_id, cached, created_at desc);

alter table public.ai_generations enable row level security;

-- Users may read their own generation log (so we can build a usage page later).
drop policy if exists "user reads own" on public.ai_generations;
create policy "user reads own" on public.ai_generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- All writes happen via service_role from the API route.
drop policy if exists "service_role writes" on public.ai_generations;
create policy "service_role writes" on public.ai_generations
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- Done.
-- ============================================================================
