-- StudyHub Phase 3 migration: reviews, reports, verification, moderation,
-- audit logging, analytics rollups, notifications, platform settings.
-- Run in the Supabase SQL editor AFTER migration-phase2.sql.

-- ---------------------------------------------------------------------------
-- Profiles: account status and seller verification flag
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column is_verified boolean not null default false,
  add column status text not null default 'active' check (status in ('active', 'suspended'));

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

-- Suspended accounts can no longer publish
drop policy "Users can create their own notes" on public.notes;

create policy "Active users can create their own notes"
  on public.notes for insert with check (
    auth.uid() = uploader_id and public.is_active_user()
  );

-- ---------------------------------------------------------------------------
-- Reviews and ratings
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text check (char_length(title) <= 80),
  body text check (char_length(body) <= 2000),
  helpful_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (note_id, reviewer_id)
);

create index reviews_note_idx on public.reviews (note_id, created_at desc);
create index reviews_reviewer_idx on public.reviews (reviewer_id);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Per-note rating aggregate with star distribution
create table public.ratings (
  note_id uuid primary key references public.notes (id) on delete cascade,
  average numeric(3, 2) not null default 0,
  count int not null default 0,
  star_1 int not null default 0,
  star_2 int not null default 0,
  star_3 int not null default 0,
  star_4 int not null default 0,
  star_5 int not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.sync_note_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_note_id uuid := coalesce(new.note_id, old.note_id);
begin
  insert into public.ratings (note_id, average, count, star_1, star_2, star_3, star_4, star_5, updated_at)
  select
    v_note_id,
    coalesce(round(avg(rating)::numeric, 2), 0),
    count(*),
    count(*) filter (where rating = 1),
    count(*) filter (where rating = 2),
    count(*) filter (where rating = 3),
    count(*) filter (where rating = 4),
    count(*) filter (where rating = 5),
    now()
  from public.reviews
  where note_id = v_note_id
  on conflict (note_id) do update set
    average = excluded.average,
    count = excluded.count,
    star_1 = excluded.star_1,
    star_2 = excluded.star_2,
    star_3 = excluded.star_3,
    star_4 = excluded.star_4,
    star_5 = excluded.star_5,
    updated_at = now();

  update public.notes n
  set rating_avg = r.average, rating_count = r.count
  from public.ratings r
  where n.id = v_note_id and r.note_id = v_note_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_sync_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_note_rating();

create table public.review_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, voter_id)
);

create or replace function public.sync_review_votes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reviews set helpful_count = helpful_count + 1 where id = new.review_id;
    return new;
  else
    update public.reviews set helpful_count = greatest(helpful_count - 1, 0) where id = old.review_id;
    return old;
  end if;
end;
$$;

create trigger review_votes_sync
  after insert or delete on public.review_votes
  for each row execute function public.sync_review_votes();

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (
    reason in ('spam', 'wrong_content', 'duplicate', 'copyright', 'abusive', 'broken_file', 'other')
  ),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  action_taken text,
  resolution_note text check (char_length(resolution_note) <= 1000),
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_note_idx on public.reports (note_id);

-- ---------------------------------------------------------------------------
-- Seller verification
-- ---------------------------------------------------------------------------

create table public.seller_verification (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text check (char_length(message) <= 1000),
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Featured products
-- ---------------------------------------------------------------------------

create table public.featured_products (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique references public.notes (id) on delete cascade,
  kind text not null check (kind in ('featured', 'editors_choice')),
  featured_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit and activity logging
-- ---------------------------------------------------------------------------

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_logs_created_idx on public.admin_logs (created_at desc);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);
create index activity_logs_created_idx on public.activity_logs (created_at desc);

create or replace function public.log_admin_action(
  action_name text,
  target_type text,
  target_id text,
  details jsonb default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  insert into public.admin_logs (admin_id, action, target_type, target_id, details)
  values (auth.uid(), action_name, target_type, target_id, details);
end;
$$;

create or replace function public.log_note_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.activity_logs (user_id, action, target_type, target_id)
  values (new.uploader_id, 'note_uploaded', 'note', new.id::text);
  return new;
end;
$$;

create trigger notes_activity_log
  after insert on public.notes
  for each row execute function public.log_note_activity();

create or replace function public.log_download_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.activity_logs (user_id, action, target_type, target_id)
  values (new.user_id, 'note_downloaded', 'note', new.note_id::text);
  return new;
end;
$$;

create trigger downloads_activity_log
  after insert on public.downloads
  for each row execute function public.log_download_activity();

create or replace function public.log_purchase_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.activity_logs (user_id, action, target_type, target_id, metadata)
  values (
    new.buyer_id, 'purchase_completed', 'note', new.note_id::text,
    jsonb_build_object('order_id', new.order_id, 'price_paid', new.price_paid)
  );
  return new;
end;
$$;

create trigger purchases_activity_log
  after insert on public.purchases
  for each row execute function public.log_purchase_activity();

-- ---------------------------------------------------------------------------
-- Daily platform analytics
-- ---------------------------------------------------------------------------

create table public.analytics (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  new_users int not null default 0,
  uploads_count int not null default 0,
  downloads_count int not null default 0,
  orders_count int not null default 0,
  revenue numeric(12, 2) not null default 0
);

create or replace function public.bump_analytics(metric text, amount numeric default 1)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.analytics (day) values (current_date)
  on conflict (day) do nothing;

  if metric = 'new_users' then
    update public.analytics set new_users = new_users + amount where day = current_date;
  elsif metric = 'uploads' then
    update public.analytics set uploads_count = uploads_count + amount where day = current_date;
  elsif metric = 'downloads' then
    update public.analytics set downloads_count = downloads_count + amount where day = current_date;
  elsif metric = 'orders' then
    update public.analytics set orders_count = orders_count + 1, revenue = revenue + amount
      where day = current_date;
  end if;
end;
$$;

create or replace function public.analytics_on_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_analytics('new_users');
  return new;
end;
$$;

create trigger profiles_analytics after insert on public.profiles
  for each row execute function public.analytics_on_profile();

create or replace function public.analytics_on_note()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_analytics('uploads');
  return new;
end;
$$;

create trigger notes_analytics after insert on public.notes
  for each row execute function public.analytics_on_note();

create or replace function public.analytics_on_download()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_analytics('downloads');
  return new;
end;
$$;

create trigger downloads_analytics after insert on public.downloads
  for each row execute function public.analytics_on_download();

create or replace function public.analytics_on_order_paid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.bump_analytics('orders', new.total);
  end if;
  return new;
end;
$$;

create trigger orders_analytics after update on public.orders
  for each row execute function public.analytics_on_order_paid();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'upload_approved', 'upload_rejected', 'purchase_success', 'sale_made',
      'review_received', 'report_resolved', 'verification_updated'
    )
  ),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.create_notification(
  target_user uuid,
  notif_type text,
  notif_title text,
  notif_body text default null,
  notif_link text default null
)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (target_user, notif_type, notif_title, notif_body, notif_link);
$$;

create or replace function public.notify_on_purchase()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_seller uuid;
begin
  select title, uploader_id into v_title, v_seller from public.notes where id = new.note_id;

  perform public.create_notification(
    new.buyer_id, 'purchase_success',
    'Purchase complete',
    'You now have lifetime access to "' || coalesce(v_title, 'your purchase') || '".',
    '/dashboard/library'
  );

  if v_seller is not null then
    perform public.create_notification(
      v_seller, 'sale_made',
      'You made a sale',
      '"' || coalesce(v_title, 'Your upload') || '" was just purchased.',
      '/dashboard/seller'
    );
  end if;
  return new;
end;
$$;

create trigger purchases_notify after insert on public.purchases
  for each row execute function public.notify_on_purchase();

create or replace function public.notify_on_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_seller uuid;
begin
  select title, uploader_id into v_title, v_seller from public.notes where id = new.note_id;
  if v_seller is not null and v_seller <> new.reviewer_id then
    perform public.create_notification(
      v_seller, 'review_received',
      'New review on your upload',
      '"' || coalesce(v_title, 'Your upload') || '" received a ' || new.rating || '-star review.',
      '/notes/' || new.note_id
    );
  end if;
  return new;
end;
$$;

create trigger reviews_notify after insert on public.reviews
  for each row execute function public.notify_on_review();

create or replace function public.notify_on_report_close()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('resolved', 'dismissed') and old.status = 'open' then
    perform public.create_notification(
      new.reporter_id, 'report_resolved',
      'Your report was reviewed',
      case when new.status = 'resolved'
        then 'Thanks for helping keep StudyHub safe — action was taken on the content you reported.'
        else 'We reviewed the content you reported and found no policy violation.'
      end,
      '/notes/' || new.note_id
    );
  end if;
  return new;
end;
$$;

create trigger reports_notify after update on public.reports
  for each row execute function public.notify_on_report_close();

create or replace function public.notify_on_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.moderation_status is distinct from old.moderation_status then
    if new.moderation_status = 'approved' then
      perform public.create_notification(
        new.uploader_id, 'upload_approved',
        'Upload approved',
        '"' || new.title || '" is live on the marketplace.',
        '/notes/' || new.id
      );
    elsif new.moderation_status in ('hidden', 'removed', 'rejected') then
      perform public.create_notification(
        new.uploader_id, 'upload_rejected',
        'Upload ' || new.moderation_status,
        '"' || new.title || '" is no longer visible to buyers.',
        '/dashboard/uploads'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger notes_moderation_notify after update on public.notes
  for each row execute function public.notify_on_moderation();

-- ---------------------------------------------------------------------------
-- Platform settings (singleton row)
-- ---------------------------------------------------------------------------

create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  platform_name text not null default 'StudyHub',
  logo_url text,
  commission_percent numeric(5, 2) not null default 10 check (commission_percent between 0 and 50),
  max_upload_size_mb int not null default 50 check (max_upload_size_mb between 1 and 50),
  allowed_file_types text[] not null default array['pdf','doc','docx','ppt','pptx','zip','png','jpg','jpeg','webp'],
  maintenance_mode boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Commission-aware order settlement (replaces the Phase 2 version)
-- ---------------------------------------------------------------------------

create or replace function public.complete_order_payment(
  target_order_id uuid,
  payment_reference text,
  payment_succeeded boolean,
  payment_failure_reason text default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_purchase_id uuid;
  v_commission numeric(5, 2);
  v_net numeric(10, 2);
begin
  if v_buyer is null then
    raise exception 'Authentication required';
  end if;

  select * into v_order
  from public.orders
  where id = target_order_id and buyer_id = v_buyer
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'paid' then
    return 'paid';
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Order can no longer be paid';
  end if;

  if not exists (
    select 1 from public.payments
    where order_id = target_order_id and provider_payment_id = payment_reference
  ) then
    raise exception 'Unknown payment reference';
  end if;

  if not payment_succeeded then
    update public.payments
    set status = 'failed', failure_reason = payment_failure_reason
    where order_id = target_order_id and provider_payment_id = payment_reference;
    return 'failed';
  end if;

  select commission_percent into v_commission from public.platform_settings where id = 1;
  v_commission := coalesce(v_commission, 0);

  update public.payments
  set status = 'succeeded', failure_reason = null
  where order_id = target_order_id and provider_payment_id = payment_reference;

  update public.orders
  set status = 'paid', paid_at = now()
  where id = target_order_id;

  for v_item in
    select * from public.order_items where order_id = target_order_id
  loop
    insert into public.purchases (buyer_id, note_id, order_id, order_item_id, price_paid)
    values (v_buyer, v_item.note_id, target_order_id, v_item.id, v_item.final_price)
    on conflict (buyer_id, note_id) do nothing
    returning id into v_purchase_id;

    if v_purchase_id is null then
      continue;
    end if;

    update public.notes
    set sales_count = sales_count + 1
    where id = v_item.note_id;

    v_net := round(v_item.final_price * (100 - v_commission) / 100.0, 2);

    insert into public.seller_wallet (seller_id, balance, total_earned, total_sales)
    values (v_item.seller_id, v_net, v_net, 1)
    on conflict (seller_id) do update set
      balance = public.seller_wallet.balance + excluded.balance,
      total_earned = public.seller_wallet.total_earned + excluded.total_earned,
      total_sales = public.seller_wallet.total_sales + 1,
      updated_at = now();

    insert into public.transactions (seller_id, type, amount, order_id, note_id, description)
    values (
      v_item.seller_id, 'sale', v_net, target_order_id, v_item.note_id,
      'Sale of "' || v_item.title || '" (' || v_commission || '% platform fee applied)'
    );

    insert into public.sales_reports (seller_id, period, sales_count, revenue)
    values (v_item.seller_id, date_trunc('month', now())::date, 1, v_net)
    on conflict (seller_id, period) do update set
      sales_count = public.sales_reports.sales_count + 1,
      revenue = public.sales_reports.revenue + excluded.revenue;
  end loop;

  return 'paid';
end;
$$;

-- Suspended accounts cannot start new orders
create or replace function public.create_note_order(target_note_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_note public.notes%rowtype;
  v_final numeric(10, 2);
  v_order_id uuid;
begin
  if v_buyer is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_active_user() then
    raise exception 'Your account is suspended';
  end if;

  select * into v_note
  from public.notes
  where id = target_note_id
    and status = 'published'
    and visibility = 'public'
    and moderation_status = 'approved';

  if not found then
    raise exception 'This resource is not available for purchase';
  end if;

  if v_note.uploader_id = v_buyer then
    raise exception 'You cannot purchase your own upload';
  end if;

  if v_note.price <= 0 then
    raise exception 'This resource is free to download';
  end if;

  if exists (
    select 1 from public.purchases where buyer_id = v_buyer and note_id = target_note_id
  ) then
    raise exception 'You already own this resource';
  end if;

  v_final := public.note_final_price(v_note.price, v_note.discount_percent);

  insert into public.orders (order_number, buyer_id, subtotal, discount_total, tax, total)
  values (
    'SH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    v_buyer,
    v_note.price,
    v_note.price - v_final,
    0,
    v_final
  )
  returning id into v_order_id;

  insert into public.order_items
    (order_id, note_id, seller_id, title, unit_price, discount_percent, final_price)
  values
    (v_order_id, target_note_id, v_note.uploader_id, v_note.title,
     v_note.price, v_note.discount_percent, v_final);

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin account removal (cascades through profiles and all owned data)
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.reviews enable row level security;
alter table public.ratings enable row level security;
alter table public.review_votes enable row level security;
alter table public.reports enable row level security;
alter table public.seller_verification enable row level security;
alter table public.featured_products enable row level security;
alter table public.admin_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.analytics enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;

-- reviews: buyers and downloaders of a note may review it
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Eligible users can review notes"
  on public.reviews for insert with check (
    reviewer_id = auth.uid()
    and public.is_active_user()
    and not exists (
      select 1 from public.notes where id = note_id and uploader_id = auth.uid()
    )
    and (
      exists (select 1 from public.purchases where buyer_id = auth.uid() and note_id = reviews.note_id)
      or exists (select 1 from public.downloads where user_id = auth.uid() and note_id = reviews.note_id)
    )
  );

create policy "Reviewers can update their reviews"
  on public.reviews for update using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());

create policy "Reviewers and admins can delete reviews"
  on public.reviews for delete using (reviewer_id = auth.uid() or public.is_admin());

create policy "Ratings are viewable by everyone"
  on public.ratings for select using (true);

create policy "Review votes are viewable by everyone"
  on public.review_votes for select using (true);

create policy "Users can vote reviews helpful"
  on public.review_votes for insert with check (
    voter_id = auth.uid()
    and not exists (
      select 1 from public.reviews where id = review_id and reviewer_id = auth.uid()
    )
  );

create policy "Users can remove their helpful votes"
  on public.review_votes for delete using (voter_id = auth.uid());

-- reports
create policy "Reporters and admins can view reports"
  on public.reports for select using (reporter_id = auth.uid() or public.is_admin());

create policy "Active users can file reports"
  on public.reports for insert with check (
    reporter_id = auth.uid() and public.is_active_user()
  );

create policy "Admins can manage reports"
  on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- seller verification
create policy "Sellers and admins can view verification requests"
  on public.seller_verification for select using (seller_id = auth.uid() or public.is_admin());

create policy "Sellers can request verification"
  on public.seller_verification for insert with check (
    seller_id = auth.uid() and status = 'pending' and public.is_active_user()
  );

create policy "Sellers can resubmit after rejection"
  on public.seller_verification for update
  using (seller_id = auth.uid() and status = 'rejected')
  with check (seller_id = auth.uid() and status = 'pending');

create policy "Admins can review verification requests"
  on public.seller_verification for update using (public.is_admin()) with check (public.is_admin());

-- featured products
create policy "Featured products are viewable by everyone"
  on public.featured_products for select using (true);

create policy "Admins can feature products"
  on public.featured_products for insert with check (public.is_admin());

create policy "Admins can unfeature products"
  on public.featured_products for delete using (public.is_admin());

-- logs and analytics
create policy "Admins can view admin logs"
  on public.admin_logs for select using (public.is_admin());

create policy "Users and admins can view activity logs"
  on public.activity_logs for select using (user_id = auth.uid() or public.is_admin());

create policy "Admins can view analytics"
  on public.analytics for select using (public.is_admin());

-- platform settings
create policy "Platform settings are viewable by everyone"
  on public.platform_settings for select using (true);

create policy "Admins can update platform settings"
  on public.platform_settings for update using (public.is_admin()) with check (public.is_admin());

-- notifications
create policy "Users can view their notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users can mark their notifications read"
  on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- taxonomy management for admins
create policy "Admins can update universities"
  on public.universities for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete universities"
  on public.universities for delete using (public.is_admin());

create policy "Admins can update courses"
  on public.courses for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete courses"
  on public.courses for delete using (public.is_admin());

create policy "Admins can update subjects"
  on public.subjects for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete subjects"
  on public.subjects for delete using (public.is_admin());

create policy "Admins can insert categories"
  on public.categories for insert with check (public.is_admin());
create policy "Admins can update categories"
  on public.categories for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete categories"
  on public.categories for delete using (public.is_admin());

create policy "Admins can update tags"
  on public.tags for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete tags"
  on public.tags for delete using (public.is_admin());
