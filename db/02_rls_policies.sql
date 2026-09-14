-- ============================================================================
-- MHINA FOREX — Row Level Security Policies
-- Enforces the access gate (Headway-verified OR paid membership) and
-- membership-tier gating (Free / Pro / VIP) at the database layer, so
-- protected content cannot be reached even if a frontend check is bypassed.
-- Run after mhina_forex_schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- (security definer so they can read profiles regardless of the caller's
-- own row-level policy, avoiding recursive RLS checks)
-- ----------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function is_moderator_or_above()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('moderator', 'admin', 'super_admin')
  );
$$;

create or replace function has_active_access()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and access_status = 'active'
  );
$$;

-- Numeric rank so 'vip' >= 'pro' >= 'free' comparisons are simple
create or replace function tier_rank(t membership_tier)
returns integer
language sql immutable
as $$
  select case t
    when 'free' then 0
    when 'pro' then 1
    when 'vip' then 2
  end;
$$;

create or replace function user_tier_rank()
returns integer
language sql security definer stable
as $$
  select coalesce(tier_rank(membership_tier), 0)
  from profiles
  where id = auth.uid();
$$;

create or replace function meets_required_tier(required membership_tier)
returns boolean
language sql security definer stable
as $$
  select has_active_access() and user_tier_rank() >= tier_rank(required);
$$;

-- ----------------------------------------------------------------------------
-- PROFILES
-- Everyone (incl. anon) can view public-facing profile fields via a view
-- if needed later; for the base table, keep it to owner + admin for now.
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_select_public_basic"
  on profiles for select
  using (true);  -- profile is mostly public (username, avatar, level, trades stats if public)
  -- NOTE: sensitive columns (email, phone_number) should be excluded via a
  -- public-facing view rather than relying on column-level filtering here.

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on profiles for update
  using (is_admin());

create policy "profiles_insert_self"
  on profiles for insert
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- HEADWAY ACCOUNTS
-- Users submit their own; only moderators/admins can review/update status.
-- ----------------------------------------------------------------------------
create policy "headway_select_own_or_staff"
  on headway_accounts for select
  using (user_id = auth.uid() or is_moderator_or_above());

create policy "headway_insert_own"
  on headway_accounts for insert
  with check (user_id = auth.uid());

create policy "headway_update_staff_only"
  on headway_accounts for update
  using (is_moderator_or_above());

-- ----------------------------------------------------------------------------
-- PAYMENTS
-- Users can only read their own payment history. All writes happen via the
-- backend service role (AzamPay webhook handler), never directly from the
-- client — so no insert/update policy is granted to regular users at all.
-- ----------------------------------------------------------------------------
create policy "payments_select_own_or_admin"
  on payments for select
  using (user_id = auth.uid() or is_admin());

-- (no insert/update/delete policies for role 'authenticated' — service role bypasses RLS)

-- ----------------------------------------------------------------------------
-- COURSES / LESSONS — tier-gated reading, admin-only writing
-- ----------------------------------------------------------------------------
create policy "courses_select_by_tier"
  on courses for select
  using (
    is_published = true
    and (required_tier = 'free' or meets_required_tier(required_tier))
  );

create policy "courses_admin_full_access"
  on courses for all
  using (is_admin())
  with check (is_admin());

create policy "lessons_select_by_parent_course_tier"
  on lessons for select
  using (
    exists (
      select 1 from courses c
      where c.id = lessons.course_id
        and c.is_published = true
        and (c.required_tier = 'free' or meets_required_tier(c.required_tier))
    )
  );

create policy "lessons_admin_full_access"
  on lessons for all
  using (is_admin())
  with check (is_admin());

-- enrollments / quiz_attempts: owner only
create policy "enrollments_owner_only"
  on enrollments for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "quiz_attempts_owner_only"
  on quiz_attempts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- SIGNALS — tier-gated reading (e.g. VIP-only), admin/staff publish
-- ----------------------------------------------------------------------------
create policy "signals_select_by_tier"
  on signals for select
  using (meets_required_tier(required_tier));

create policy "signals_staff_write"
  on signals for all
  using (is_moderator_or_above())
  with check (is_moderator_or_above());

create policy "signal_results_select_with_parent"
  on signal_results for select
  using (
    exists (
      select 1 from signals s
      where s.id = signal_results.signal_id
        and meets_required_tier(s.required_tier)
    )
  );

-- ----------------------------------------------------------------------------
-- MARKET ANALYSIS / NEWS — generally free-to-read platform content
-- ----------------------------------------------------------------------------
create policy "market_analysis_select_active_users"
  on market_analysis for select
  using (has_active_access());

create policy "news_events_select_active_users"
  on news_events for select
  using (has_active_access());

create policy "ai_news_analyses_select_active_users"
  on ai_news_analyses for select
  using (has_active_access());

-- ----------------------------------------------------------------------------
-- AI CHART ANALYSES — private to the user unless shared to community
-- ----------------------------------------------------------------------------
create policy "ai_chart_analyses_owner_or_shared"
  on ai_chart_analyses for select
  using (user_id = auth.uid() or shared_to_community = true);

create policy "ai_chart_analyses_owner_write"
  on ai_chart_analyses for insert
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- COMMUNITY — any active member can post/interact; staff can moderate
-- ----------------------------------------------------------------------------
create policy "posts_select_active_users"
  on community_posts for select
  using (has_active_access() and is_removed = false);

create policy "posts_select_staff_incl_removed"
  on community_posts for select
  using (is_moderator_or_above());

create policy "posts_insert_own"
  on community_posts for insert
  with check (author_id = auth.uid() and has_active_access());

create policy "posts_update_own_or_staff"
  on community_posts for update
  using (author_id = auth.uid() or is_moderator_or_above());

create policy "posts_delete_own_or_staff"
  on community_posts for delete
  using (author_id = auth.uid() or is_moderator_or_above());

create policy "comments_select_active_users"
  on comments for select
  using (has_active_access());

create policy "comments_insert_own"
  on comments for insert
  with check (author_id = auth.uid() and has_active_access());

create policy "comments_delete_own_or_staff"
  on comments for delete
  using (author_id = auth.uid() or is_moderator_or_above());

create policy "likes_owner_only"
  on likes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saves_owner_only"
  on saves for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "follows_owner_only"
  on follows for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

create policy "follows_select_any"
  on follows for select
  using (true);  -- follower/following counts are public

create policy "reports_insert_own"
  on reports for insert
  with check (reporter_id = auth.uid());

create policy "reports_select_staff_only"
  on reports for select
  using (is_moderator_or_above());

create policy "reports_update_staff_only"
  on reports for update
  using (is_moderator_or_above());

-- ----------------------------------------------------------------------------
-- TRADE RECORDS — private by default; user controls public visibility
-- via profiles.performance_visibility, enforced in application layer for
-- the aggregated view, but raw records stay owner+admin only here.
-- ----------------------------------------------------------------------------
create policy "trade_records_owner_or_admin"
  on trade_records for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- LIVE SESSIONS — tier-gated visibility; join tokens are minted server-side
-- (service role), RLS here only governs metadata visibility, not room access.
-- ----------------------------------------------------------------------------
create policy "live_sessions_select_by_tier"
  on live_sessions for select
  using (meets_required_tier(required_tier));

create policy "live_sessions_staff_write"
  on live_sessions for all
  using (is_moderator_or_above())
  with check (is_moderator_or_above());

create policy "session_attendees_select_own_or_staff"
  on session_attendees for select
  using (user_id = auth.uid() or is_moderator_or_above());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — strictly owner-only
-- ----------------------------------------------------------------------------
create policy "notifications_owner_only"
  on notifications for select
  using (user_id = auth.uid());

create policy "notifications_owner_update_read_state"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- (inserts happen via service role when the app generates a notification)

-- ----------------------------------------------------------------------------
-- ACTIVITY LOGS — admin-only, write via service role
-- ----------------------------------------------------------------------------
create policy "activity_logs_admin_select"
  on activity_logs for select
  using (is_admin());

alter table trade_records enable row level security;
alter table enrollments enable row level security;
alter table quiz_attempts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table saves enable row level security;
alter table follows enable row level security;
alter table reports enable row level security;
alter table session_attendees enable row level security;
alter table market_analysis enable row level security;
alter table news_events enable row level security;
alter table ai_news_analyses enable row level security;
alter table ai_chart_analyses enable row level security;
alter table signal_results enable row level security;
alter table activity_logs enable row level security;
