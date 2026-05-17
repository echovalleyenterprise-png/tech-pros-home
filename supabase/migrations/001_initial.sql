-- ── Tech Pros Home — Initial Schema ────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                      uuid references auth.users on delete cascade primary key,
  email                   text,
  name                    text,
  role                    text not null default 'homeowner', -- 'homeowner' | 'partner'
  plan                    text not null default 'free',      -- 'free' | 'home' | 'family'
  questions_used          int not null default 0,
  questions_reset_at      timestamptz default now(),
  affiliate_code          text unique,   -- partners only — their referral code
  referred_by             text,          -- affiliate_code of the partner who referred this user
  created_at              timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role, affiliate_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'homeowner'),
    case
      when new.raw_user_meta_data->>'role' = 'partner'
      then lower(replace(coalesce(new.raw_user_meta_data->>'name', 'partner'), ' ', '-')) || '-' || substring(new.id::text, 1, 6)
      else null
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── conversations ─────────────────────────────────────────────────────────────
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  title       text default 'New conversation',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table conversations enable row level security;

create policy "Users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

-- ── messages ──────────────────────────────────────────────────────────────────
create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references conversations on delete cascade not null,
  user_id          uuid references auth.users on delete cascade not null,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  created_at       timestamptz default now()
);

alter table messages enable row level security;

create policy "Users can manage own messages"
  on messages for all using (auth.uid() = user_id);

-- ── referrals ─────────────────────────────────────────────────────────────────
create table if not exists referrals (
  id               uuid primary key default gen_random_uuid(),
  partner_id       uuid references auth.users on delete cascade not null,
  referred_user_id uuid references auth.users on delete cascade not null,
  affiliate_code   text not null,
  plan             text default 'free',
  is_paying        boolean default false,
  created_at       timestamptz default now()
);

alter table referrals enable row level security;

create policy "Partners can view own referrals"
  on referrals for select using (auth.uid() = partner_id);

-- service role can insert referrals
create policy "Service role can insert referrals"
  on referrals for insert with check (true);

-- ── callback_requests ─────────────────────────────────────────────────────────
create table if not exists callback_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade not null,
  partner_id          uuid references auth.users on delete set null,
  issue_description   text not null,
  device_type         text,
  preferred_time      text,
  phone               text,
  status              text default 'pending' check (status in ('pending', 'scheduled', 'completed', 'cancelled')),
  partner_notes       text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table callback_requests enable row level security;

create policy "Users can view own callback requests"
  on callback_requests for select using (auth.uid() = user_id or auth.uid() = partner_id);

create policy "Users can insert own callback requests"
  on callback_requests for insert with check (auth.uid() = user_id);

create policy "Partners can update assigned callbacks"
  on callback_requests for update using (auth.uid() = partner_id);
