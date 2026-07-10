-- StudyHub Phase 2 migration: marketplace, orders, payments, wallets, moderation
-- Run in the Supabase SQL editor AFTER schema.sql, storage.sql, and seed.sql.

-- ---------------------------------------------------------------------------
-- Profile roles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Promote your own account after signing up:
--   update public.profiles set role = 'admin' where username = 'your_username';

-- ---------------------------------------------------------------------------
-- Notes: selling configuration and moderation
-- ---------------------------------------------------------------------------

alter table public.notes
  add column discount_percent int not null default 0 check (discount_percent between 0 and 90),
  add column version text check (char_length(version) <= 40),
  add column edition text check (char_length(edition) <= 60),
  add column visibility text not null default 'public' check (visibility in ('public', 'private')),
  add column moderation_status text not null default 'approved'
    check (moderation_status in ('approved', 'pending', 'hidden', 'removed')),
  add column sales_count bigint not null default 0,
  add column rating_avg numeric(3, 2) not null default 0,
  add column rating_count int not null default 0;

create index notes_sales_idx on public.notes (sales_count desc);
create index notes_price_idx on public.notes (price);

create or replace function public.note_final_price(unit_price numeric, discount int)
returns numeric
language sql
immutable
as $$
  select greatest(round(unit_price * (100 - discount) / 100.0, 2), 0);
$$;

-- ---------------------------------------------------------------------------
-- Orders and payments
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  discount_total numeric(10, 2) not null default 0 check (discount_total >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  currency text not null default 'INR',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_buyer_idx on public.orders (buyer_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  discount_percent int not null default 0 check (discount_percent between 0 and 90),
  final_price numeric(10, 2) not null check (final_price >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_seller_idx on public.order_items (seller_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_payment_id text not null unique,
  status text not null default 'created'
    check (status in ('created', 'succeeded', 'failed', 'refunded')),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  method text not null default 'card',
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  price_paid numeric(10, 2) not null check (price_paid >= 0),
  created_at timestamptz not null default now(),
  unique (buyer_id, note_id)
);

create index purchases_buyer_idx on public.purchases (buyer_id, created_at desc);
create index purchases_note_idx on public.purchases (note_id);

create table public.seller_wallet (
  seller_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  total_earned numeric(12, 2) not null default 0 check (total_earned >= 0),
  total_sales bigint not null default 0 check (total_sales >= 0),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('sale', 'refund', 'payout')),
  amount numeric(10, 2) not null,
  order_id uuid references public.orders (id) on delete set null,
  note_id uuid references public.notes (id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);

create index transactions_seller_idx on public.transactions (seller_id, created_at desc);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete set null,
  created_at timestamptz not null default now()
);

create index downloads_user_idx on public.downloads (user_id, created_at desc);
create index downloads_note_idx on public.downloads (note_id);

create table public.sales_reports (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  period date not null,
  sales_count bigint not null default 0,
  revenue numeric(12, 2) not null default 0,
  downloads_count bigint not null default 0,
  unique (seller_id, period)
);

create index sales_reports_seller_idx on public.sales_reports (seller_id, period desc);

create table public.recently_viewed (
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Order lifecycle functions
-- ---------------------------------------------------------------------------

-- Builds an order server-side so prices always come from the notes table and
-- can never be tampered with by the client.
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

-- Settles an order after the payment provider verifies the charge. Fulfils
-- purchases, credits seller wallets, records transactions, and rolls up
-- monthly sales reports in a single transaction.
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

    insert into public.seller_wallet (seller_id, balance, total_earned, total_sales)
    values (v_item.seller_id, v_item.final_price, v_item.final_price, 1)
    on conflict (seller_id) do update set
      balance = public.seller_wallet.balance + excluded.balance,
      total_earned = public.seller_wallet.total_earned + excluded.total_earned,
      total_sales = public.seller_wallet.total_sales + 1,
      updated_at = now();

    insert into public.transactions (seller_id, type, amount, order_id, note_id, description)
    values (
      v_item.seller_id, 'sale', v_item.final_price, target_order_id, v_item.note_id,
      'Sale of "' || v_item.title || '"'
    );

    insert into public.sales_reports (seller_id, period, sales_count, revenue)
    values (v_item.seller_id, date_trunc('month', now())::date, 1, v_item.final_price)
    on conflict (seller_id, period) do update set
      sales_count = public.sales_reports.sales_count + 1,
      revenue = public.sales_reports.revenue + excluded.revenue;
  end loop;

  return 'paid';
end;
$$;

-- Records a download and rolls it into the seller's monthly report.
create or replace function public.record_download(target_note_id uuid, target_purchase_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_seller uuid;
begin
  if v_user is null then
    return;
  end if;

  insert into public.downloads (user_id, note_id, purchase_id)
  values (v_user, target_note_id, target_purchase_id);

  update public.notes set downloads = downloads + 1
  where id = target_note_id and status = 'published';

  select uploader_id into v_seller from public.notes where id = target_note_id;
  if v_seller is not null then
    insert into public.sales_reports (seller_id, period, downloads_count)
    values (v_seller, date_trunc('month', now())::date, 1)
    on conflict (seller_id, period) do update set
      downloads_count = public.sales_reports.downloads_count + 1;
  end if;
end;
$$;

create or replace function public.track_recently_viewed(target_note_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.recently_viewed (user_id, note_id)
  values (auth.uid(), target_note_id)
  on conflict (user_id, note_id) do update set viewed_at = now();
end;
$$;

-- Exposes seller notification context to the buyer's session only after the
-- order is paid, so the app can dispatch emails without a service-role key.
create or replace function public.get_order_email_context(target_order_id uuid)
returns table (seller_email text, seller_name text, item_title text, amount numeric)
language sql
stable
security definer set search_path = public
as $$
  select u.email::text, p.full_name, oi.title, oi.final_price
  from public.order_items oi
  join public.profiles p on p.id = oi.seller_id
  join auth.users u on u.id = oi.seller_id
  where oi.order_id = target_order_id
    and exists (
      select 1 from public.orders o
      where o.id = target_order_id and o.buyer_id = auth.uid() and o.status = 'paid'
    );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.purchases enable row level security;
alter table public.seller_wallet enable row level security;
alter table public.transactions enable row level security;
alter table public.downloads enable row level security;
alter table public.sales_reports enable row level security;
alter table public.recently_viewed enable row level security;

-- orders
create policy "Buyers can view their own orders"
  on public.orders for select using (buyer_id = auth.uid() or public.is_admin());

-- order_items
create policy "Buyers and sellers can view their order items"
  on public.order_items for select using (
    seller_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.orders where id = order_id and buyer_id = auth.uid()
    )
  );

-- payments
create policy "Buyers can view payments for their orders"
  on public.payments for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders where id = order_id and buyer_id = auth.uid()
    )
  );

create policy "Buyers can register a payment attempt for their pending order"
  on public.payments for insert with check (
    status = 'created'
    and exists (
      select 1 from public.orders
      where id = order_id and buyer_id = auth.uid() and status = 'pending'
    )
  );

-- purchases
create policy "Buyers can view their purchases"
  on public.purchases for select using (
    buyer_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.notes where id = note_id and uploader_id = auth.uid()
    )
  );

-- seller_wallet
create policy "Sellers can view their wallet"
  on public.seller_wallet for select using (seller_id = auth.uid() or public.is_admin());

-- transactions
create policy "Sellers can view their transactions"
  on public.transactions for select using (seller_id = auth.uid() or public.is_admin());

-- downloads
create policy "Users can view their download history"
  on public.downloads for select using (user_id = auth.uid() or public.is_admin());

-- sales_reports
create policy "Sellers can view their sales reports"
  on public.sales_reports for select using (seller_id = auth.uid() or public.is_admin());

-- recently_viewed
create policy "Users can view their recently viewed notes"
  on public.recently_viewed for select using (user_id = auth.uid());

-- notes: replace the public read policy so hidden/private/removed listings
-- disappear from buyers while owners and admins keep access
drop policy "Published notes are viewable by everyone" on public.notes;

create policy "Approved public notes are viewable by everyone"
  on public.notes for select using (
    (status = 'published' and visibility = 'public' and moderation_status = 'approved')
    or uploader_id = auth.uid()
    or public.is_admin()
  );

create policy "Admins can moderate notes"
  on public.notes for update using (public.is_admin()) with check (public.is_admin());

-- profiles: admins manage sellers
create policy "Admins can update profiles"
  on public.profiles for update using (public.is_admin()) with check (public.is_admin());
