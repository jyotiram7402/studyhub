-- StudyHub Phase 6 migration: security hardening.
-- Closes a privilege-escalation hole where the "update your own profile"
-- RLS policy allowed users to modify protected columns (role, is_verified,
-- status, points) on their own row via the PostgREST API.
-- Run in the Supabase SQL editor AFTER migration-phase5.sql.

-- ---------------------------------------------------------------------------
-- Protect privileged profile columns from self-modification
-- ---------------------------------------------------------------------------

-- Trusted SECURITY DEFINER functions set this transaction-local flag before
-- writing protected columns; direct client updates never set it.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if coalesce(current_setting('studyhub.trusted_write', true), 'off') = 'on' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_verified is distinct from old.is_verified
     or new.status is distinct from old.status
     or new.points is distinct from old.points
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by then
    raise exception 'You are not allowed to modify protected profile fields';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Re-declare award_points to mark its write as trusted so the leaderboard
-- keeps working while direct client point edits stay blocked.
create or replace function public.award_points(target_user uuid, amount int)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('studyhub.trusted_write', 'on', true);
  update public.profiles set points = points + amount where id = target_user;
  perform set_config('studyhub.trusted_write', 'off', true);
end;
$$;
