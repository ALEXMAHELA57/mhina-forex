-- ============================================================================
-- MHINA FOREX — Database Schema (Supabase / PostgreSQL)
-- Covers: Access & Membership, Payments (AzamPay), Education, Signals,
-- Market Analysis, News, AI Analyzer, Community, Live Sessions, Admin
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type access_status as enum ('pending', 'active', 'expired', 'suspended');
create type access_route as enum ('headway', 'paid_monthly', 'paid_lifetime');
create type user_role as enum ('member', 'moderator', 'admin', 'super_admin');
create type membership_tier as enum ('free', 'pro', 'vip');

create type headway_verification_status as enum ('pending', 'verified', 'rejected', 'attach_pending');
create type payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');
create type payment_package as enum ('monthly_300', 'lifetime_3000');

create type signal_direction as enum ('buy', 'sell');
create type signal_status as enum ('open', 'tp_hit', 'sl_hit', 'breakeven', 'cancelled', 'no_trade');

create type course_level as enum ('beginner', 'intermediate', 'advanced');
create type media_provider as enum ('cloudflare_images', 'bunny_stream', 'supabase_storage');
create type media_type as enum ('image', 'video');

create type post_classification as enum ('buy', 'sell', 'analysis', 'general');
create type report_status as enum ('open', 'reviewed', 'actioned', 'dismissed');

create type live_session_type as enum ('mentorship', 'broadcast');
create type live_session_status as enum ('scheduled', 'live', 'ended', 'cancelled');
create type attendee_role as enum ('host', 'co_host', 'viewer');

create type notification_type as enum (
  'signal_new', 'news_alert', 'session_reminder', 'session_live',
  'payment_confirmed', 'headway_verified', 'community_activity', 'system'
);

-- ----------------------------------------------------------------------------
-- USERS & PROFILES
-- (auth.users is Supabase's built-in auth table — this extends it)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  email text unique not null,
  phone_number text,
  avatar_media_id uuid,              -- fk added after media_assets exists
  bio text,
  trader_level text,                  -- 'Beginner' | 'Intermediate' | 'Pro' (display label only)
  role user_role not null default 'member',
  membership_tier membership_tier not null default 'free',
  access_status access_status not null default 'pending',
  access_route access_route,
  performance_visibility text not null default 'private' check (performance_visibility in ('public','private')),
  member_since timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MEDIA (single reference table for all uploaded images/video)
-- ----------------------------------------------------------------------------
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references profiles(id) on delete set null,
  type media_type not null,
  provider media_provider not null,
  provider_asset_id text not null,     -- Cloudflare Images ID / Bunny video GUID / Supabase path
  duration_seconds integer,            -- video only
  view_only boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint fk_avatar_media foreign key (avatar_media_id) references media_assets(id) on delete set null;

-- ----------------------------------------------------------------------------
-- ACCESS & MEMBERSHIP — HEADWAY
-- ----------------------------------------------------------------------------
create table headway_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  headway_identifier text not null,     -- email/ID user submits from their Headway account
  status headway_verification_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  notes text
);

create index idx_headway_accounts_user on headway_accounts(user_id);
create index idx_headway_accounts_status on headway_accounts(status);

-- ----------------------------------------------------------------------------
-- ACCESS & MEMBERSHIP — PAYMENTS (AzamPay)
-- ----------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  package payment_package not null,
  amount numeric(12,2) not null,
  currency text not null default 'TZS',
  status payment_status not null default 'pending',
  azampay_transaction_id text unique,
  azampay_reference_id text,
  provider_channel text,               -- e.g. 'AzamPesa', 'Tigo Pesa', 'Card'
  paid_at timestamptz,
  expires_at timestamptz,              -- null for lifetime package
  created_at timestamptz not null default now()
);

create index idx_payments_user on payments(user_id);
create index idx_payments_status on payments(status);

-- ----------------------------------------------------------------------------
-- EDUCATION
-- ----------------------------------------------------------------------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level course_level not null,
  category text,                        -- 'Market Structure', 'Risk Management', etc.
  required_tier membership_tier not null default 'free',
  thumbnail_media_id uuid references media_assets(id),
  is_published boolean not null default false,
  order_index integer not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  video_media_id uuid references media_assets(id),
  notes_url text,                       -- PDF/notes stored via Supabase Storage
  order_index integer not null default 0,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  passing_score integer not null default 70
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null,               -- [{id, text}]
  correct_option_id text not null,
  explanation text
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  progress_percent integer not null default 0,
  completed_at timestamptz,
  last_lesson_id uuid references lessons(id),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SIGNALS
-- ----------------------------------------------------------------------------
create table signals (
  id uuid primary key default gen_random_uuid(),
  instrument text not null,             -- 'XAUUSD', 'EURUSD', etc.
  direction signal_direction not null,
  entry_price numeric(14,5) not null,
  stop_loss numeric(14,5) not null,
  take_profit_1 numeric(14,5),
  take_profit_2 numeric(14,5),
  take_profit_3 numeric(14,5),
  timeframe text not null,
  risk_reward text,
  market_bias text,
  analysis text,
  chart_media_id uuid references media_assets(id),
  status signal_status not null default 'open',
  required_tier membership_tier not null default 'vip',
  published_by uuid references profiles(id),
  published_at timestamptz not null default now(),
  closed_at timestamptz
);

create table signal_results (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals(id) on delete cascade,
  result_pips numeric(10,2),
  result_notes text,
  recorded_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MARKET ANALYSIS
-- ----------------------------------------------------------------------------
create table market_analysis (
  id uuid primary key default gen_random_uuid(),
  instrument text not null,
  trend text,                            -- 'Bullish' | 'Bearish' | 'Neutral'
  key_support numeric(14,5),
  key_resistance numeric(14,5),
  outlook_bias text,
  body text,
  published_by uuid references profiles(id),
  published_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- NEWS / ECONOMIC CALENDAR
-- ----------------------------------------------------------------------------
create table news_events (
  id uuid primary key default gen_random_uuid(),
  currency text not null,
  event_name text not null,
  event_time timestamptz not null,
  impact text not null check (impact in ('low','medium','high')),
  previous_value text,
  forecast_value text,
  actual_value text,
  created_at timestamptz not null default now()
);

create table ai_news_analyses (
  id uuid primary key default gen_random_uuid(),
  news_event_id uuid not null references news_events(id) on delete cascade,
  affected_currency text,
  affected_instruments text[],
  scenario text,                         -- 'bullish' | 'bearish' | 'neutral'
  gold_impact_note text,
  generated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AI CHART ANALYZER
-- ----------------------------------------------------------------------------
create table ai_chart_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  chart_media_id uuid not null references media_assets(id),
  instrument text not null,
  timeframe text not null,
  trade_type text,                       -- user-selected intent, not guaranteed output
  structure_note text,
  key_level_note text,
  confirmation_note text,
  entry_zone text,
  stop_loss text,
  take_profit text,
  risk_reward text,
  no_clear_setup boolean not null default false,
  shared_to_community boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- COMMUNITY
-- ----------------------------------------------------------------------------
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  chart_media_id uuid references media_assets(id),
  caption text,
  market text,
  classification post_classification not null default 'general',
  ai_analysis_id uuid references ai_chart_analyses(id),
  is_featured boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table likes (
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table saves (
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text not null,
  status report_status not null default 'open',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TRADER PERFORMANCE
-- ----------------------------------------------------------------------------
create table trade_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  instrument text not null,
  direction signal_direction not null,
  result_pips numeric(10,2),
  profit_loss numeric(14,2),
  opened_at timestamptz not null,
  closed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- LIVE SESSIONS
-- ----------------------------------------------------------------------------
create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type live_session_type not null,
  host_id uuid not null references profiles(id),
  linked_course_id uuid references courses(id),
  required_tier membership_tier not null default 'free',
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status live_session_status not null default 'scheduled',
  provider_room_id text,               -- Daily/LiveKit room identifier
  record_enabled boolean not null default false,
  recording_media_id uuid references media_assets(id),
  max_participants integer,
  created_at timestamptz not null default now()
);

create table session_attendees (
  session_id uuid not null references live_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role attendee_role not null default 'viewer',
  joined_at timestamptz,
  left_at timestamptz,
  primary key (session_id, user_id)
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  related_entity_type text,             -- 'signal' | 'session' | 'post' | etc.
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on notifications(user_id) where is_read = false;

-- ----------------------------------------------------------------------------
-- ADMIN / ACTIVITY LOGS
-- ----------------------------------------------------------------------------
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,                 -- 'signal.publish', 'user.suspend', etc.
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY — enable on every table; policies added per-table
-- as access-gate logic is finalized (this is the enforcement layer the
-- blueprint requires: protected content must be checked server-side, not
-- just hidden in the frontend).
-- ============================================================================
alter table profiles enable row level security;
alter table headway_accounts enable row level security;
alter table payments enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table signals enable row level security;
alter table community_posts enable row level security;
alter table live_sessions enable row level security;
alter table notifications enable row level security;
-- (repeat for remaining tables as policies are defined)
