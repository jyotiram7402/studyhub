-- StudyHub Phase 5 migration: gamification, search analytics, monetization
-- groundwork, and operational cleanup.
-- Run in the Supabase SQL editor AFTER migration-phase4.sql.

-- ---------------------------------------------------------------------------
-- Gamification: points, levels, leaderboard
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column points bigint not null default 0 check (points >= 0),
  add column referral_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  add column referred_by uuid references public.profiles (id) on delete set null;

create or replace function public.award_points(target_user uuid, amount int)
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles set points = points + amount where id = target_user;
$$;

create or replace function public.points_on_note()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.uploader_id, 10);
  return new;
end;
$$;

create trigger notes_points after insert on public.notes
  for each row execute function public.points_on_note();

create or replace function public.points_on_purchase()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_seller uuid;
begin
  perform public.award_points(new.buyer_id, 5);
  select uploader_id into v_seller from public.notes where id = new.note_id;
  if v_seller is not null then
    perform public.award_points(v_seller, 25);
  end if;
  return new;
end;
$$;

create trigger purchases_points after insert on public.purchases
  for each row execute function public.points_on_purchase();

create or replace function public.points_on_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_points(new.reviewer_id, 5);
  return new;
end;
$$;

create trigger reviews_points after insert on public.reviews
  for each row execute function public.points_on_review();

create or replace function public.get_leaderboard(entry_count int default 20)
returns table (
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  is_verified boolean,
  points bigint,
  upload_count bigint,
  sales_count bigint
)
language sql
stable
security definer set search_path = public
as $$
  select
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.is_verified,
    p.points,
    count(distinct n.id) as upload_count,
    coalesce(max(w.total_sales), 0) as sales_count
  from public.profiles p
  left join public.notes n
    on n.uploader_id = p.id
    and n.status = 'published'
    and n.visibility = 'public'
    and n.moderation_status = 'approved'
  left join public.seller_wallet w on w.seller_id = p.id
  where p.status = 'active' and p.points > 0
  group by p.id
  order by p.points desc, upload_count desc
  limit least(entry_count, 50);
$$;

-- ---------------------------------------------------------------------------
-- Search analytics
-- ---------------------------------------------------------------------------

create or replace function public.get_popular_searches(entry_count int default 8)
returns table (query text, search_count bigint)
language sql
stable
security definer set search_path = public
as $$
  select metadata ->> 'q' as query, count(*) as search_count
  from public.activity_logs
  where action = 'search'
    and created_at > now() - interval '30 days'
    and char_length(metadata ->> 'q') between 3 and 60
  group by metadata ->> 'q'
  having count(*) >= 2
  order by search_count desc, max(created_at) desc
  limit least(entry_count, 20);
$$;

create or replace function public.get_trending_searches(entry_count int default 8)
returns table (query text, search_count bigint)
language sql
stable
security definer set search_path = public
as $$
  select metadata ->> 'q' as query, count(*) as search_count
  from public.activity_logs
  where action = 'search'
    and created_at > now() - interval '48 hours'
    and char_length(metadata ->> 'q') between 3 and 60
  group by metadata ->> 'q'
  order by search_count desc, max(created_at) desc
  limit least(entry_count, 20);
$$;

-- ---------------------------------------------------------------------------
-- Monetization groundwork (no billing integration yet)
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_monthly numeric(10, 2) not null default 0 check (price_monthly >= 0),
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (slug, name, price_monthly, features) values
  ('free', 'Free', 0, '["Browse and buy notes", "AI study tools on owned notes", "Seller dashboard"]'),
  ('premium', 'Premium', 199, '["Unlimited AI assistant usage", "Priority AI processing", "Premium seller badge", "Reduced commission"]')
on conflict (slug) do nothing;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,24}$'),
  percent_off int not null check (percent_off between 1 and 100),
  max_redemptions int,
  redeemed_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (coupon_id, user_id)
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  reward_points int not null default 50,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Operational cleanup
-- ---------------------------------------------------------------------------

-- Pending orders older than seven days are abandoned checkouts
create or replace function public.cancel_stale_orders()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.orders
  set status = 'cancelled'
  where status = 'pending' and created_at < now() - interval '7 days';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Storage usage rollup for the system health dashboard
create or replace function public.get_storage_usage()
returns table (file_count bigint, total_bytes bigint)
language sql
stable
security definer set search_path = public
as $$
  select count(*), coalesce(sum(file_size), 0)::bigint from public.notes;
$$;

-- Admins can remove orphaned storage objects during cleanup
create policy "Admins can delete note files"
  on storage.objects for delete
  using (bucket_id = 'note-files' and public.is_admin());

create policy "Admins can delete thumbnails"
  on storage.objects for delete
  using (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admins can list storage objects"
  on storage.objects for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.referrals enable row level security;

create policy "Plans are viewable by everyone"
  on public.plans for select using (is_active = true or public.is_admin());

create policy "Users can view their subscription"
  on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

create policy "Admins manage coupons"
  on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create policy "Users can view their redemptions"
  on public.coupon_redemptions for select using (user_id = auth.uid() or public.is_admin());

create policy "Users can view their referrals"
  on public.referrals for select using (
    referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin()
  );
