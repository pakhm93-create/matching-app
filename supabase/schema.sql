-- ════════════════════════════════════════════════════════
-- 성향 매칭 앱 — 데이터베이스 구조
--
-- Supabase 대시보드의 SQL Editor에 이 파일 전체를 붙여넣고 실행하면 된다.
-- 한 번만 실행하면 되고, 다시 실행해도 문제없도록 만들어뒀다.
--
-- ⚠️ 이 앱은 민감정보(종교·정치 성향)를 다룬다.
--    한국 개인정보보호법상 별도 동의가 필요하므로 sensitive_consent 칼럼을 뒀다.
--    실서비스 전에 동의 화면을 반드시 붙일 것.
-- ════════════════════════════════════════════════════════

-- ── 프로필 ────────────────────────────────────────────
-- auth.users(Supabase가 만들어주는 계정 표)와 1:1로 붙는다.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  nickname      text not null,
  birth_year    int  not null,
  birth_month   int  not null,
  gender        text not null,
  seeking       text[] not null,
  sido          text not null,
  sigungu       text not null,
  height_cm     int  not null,
  education     text,
  mbti          text,

  -- 항상 적용되는 조건
  max_travel_minutes int not null default 90,
  age_min       int,
  age_max       int,
  height_min    int,
  height_max    int,

  -- 절대 조건 태그 (최대 3개)
  stance_ids    text[] not null default '{}',
  -- 매칭 기준: strict / balanced / relaxed
  strictness    text not null default 'balanced',

  -- 민감정보(종교·정치) 수집 동의
  sensitive_consent boolean not null default false,

  -- 설문을 다 마쳤는가. 마치기 전에는 매칭 대상이 아니다
  survey_done   boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 설문 응답 ──────────────────────────────────────────
-- 문항이 자주 바뀌므로 칼럼을 늘리지 않고 통째로 담는다.
-- { "f_smoke": "피우지 않아요", "life_tidy": 4, "t_active": ["헬스","등산"] }
create table if not exists public.answers (
  user_id  uuid primary key references public.profiles(id) on delete cascade,
  data     jsonb not null default '{}'::jsonb,
  -- 응답에서 계산해둔 값. 매칭할 때마다 다시 계산하지 않으려고 저장한다
  facts    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 프로필 사진 ────────────────────────────────────────
-- 실제 파일은 Storage 버킷에 두고 여기엔 경로만 남긴다.
create table if not exists public.photos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  path      text not null,
  sort      int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists photos_user_idx on public.photos(user_id);

-- ── 배급된 인연 ────────────────────────────────────────
-- 주 1회 계산해서 여기에 넣고, 알림으로 내보낸다.
-- 같은 두 사람에게 서로를 동시에 배달하므로 두 줄이 생긴다.
create table if not exists public.deliveries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  score      numeric(4,1) not null,
  best_section  text,
  worst_section text,
  -- 유효기간이 지나면 사라진다. 지금 행동할 이유를 만든다
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_id)
);
create index if not exists deliveries_user_idx on public.deliveries(user_id, created_at desc);

-- ── 좋아요 ─────────────────────────────────────────────
-- 무료. 서로 눌러야 매칭이 성사된다.
create table if not exists public.likes (
  from_id   uuid not null references public.profiles(id) on delete cascade,
  to_id     uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);

-- ── 매칭 성사 ──────────────────────────────────────────
-- 두 사람이 서로 좋아요를 눌렀거나, 한쪽이 먼저 연락해 답장을 받은 상태.
-- 사람 두 명을 항상 같은 순서로 넣어 중복을 막는다 (작은 id가 a).
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  a_id       uuid not null references public.profiles(id) on delete cascade,
  b_id       uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (a_id, b_id),
  check (a_id < b_id)
);

-- ── 대화 ───────────────────────────────────────────────
create table if not exists public.messages (
  id        uuid primary key default gen_random_uuid(),
  match_id  uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body      text not null,
  read_at   timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_match_idx on public.messages(match_id, created_at);

-- ── 토큰 ───────────────────────────────────────────────
-- 잔액을 직접 고치지 않고 내역을 쌓아 합계를 낸다.
-- 잘못 빠져나갔을 때 되돌리기 쉽고, 무엇에 썼는지 남는다.
create table if not exists public.token_ledger (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  -- 양수는 충전, 음수는 사용
  amount    int not null,
  -- signup_bonus / purchase / first_message / extra_match / refund_no_reply
  reason    text not null,
  -- 어떤 대화에 썼는지 (돌려줄 때 찾기 위해)
  match_id  uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists token_user_idx on public.token_ledger(user_id, created_at desc);

-- 지금 잔액
--
-- ⚠️ security_invoker를 반드시 켠다. 뷰는 기본적으로 "만든 사람 권한"으로 돌아가서
--    아래 token_ledger에 건 접근 권한을 그냥 통과해버린다.
--    그대로 두면 누구나 모든 사람의 토큰 잔액을 읽을 수 있다.
create or replace view public.token_balance
  with (security_invoker = on) as
  select user_id, coalesce(sum(amount), 0)::int as balance
  from public.token_ledger group by user_id;

-- ════════════════════════════════════════════════════════
-- 접근 권한 (Row Level Security)
--
-- 이걸 켜지 않으면 **누구나 남의 설문 응답과 프로필을 읽을 수 있다.**
-- Supabase는 기본이 열려 있으므로 반드시 켜야 한다.
-- ════════════════════════════════════════════════════════

alter table public.profiles     enable row level security;
alter table public.answers      enable row level security;
alter table public.photos       enable row level security;
alter table public.deliveries   enable row level security;
alter table public.likes        enable row level security;
alter table public.matches      enable row level security;
alter table public.messages     enable row level security;
alter table public.token_ledger enable row level security;

-- 프로필: 내 것은 읽고 쓸 수 있다
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "own profile write" on public.profiles;
create policy "own profile write" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 프로필: 나에게 배급된 사람의 프로필도 읽을 수 있다
drop policy if exists "delivered profile read" on public.profiles;
create policy "delivered profile read" on public.profiles
  for select using (
    exists (
      select 1 from public.deliveries d
      where d.user_id = auth.uid() and d.target_id = profiles.id
    )
  );

-- 설문 응답: 남에게 절대 보여주지 않는다. 매칭 계산은 서버에서만 한다
drop policy if exists "own answers only" on public.answers;
create policy "own answers only" on public.answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 사진: 내 것 + 배급된 상대 것
drop policy if exists "own photos" on public.photos;
create policy "own photos" on public.photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delivered photos read" on public.photos;
create policy "delivered photos read" on public.photos
  for select using (
    exists (
      select 1 from public.deliveries d
      where d.user_id = auth.uid() and d.target_id = photos.user_id
    )
  );

-- 배급: 나에게 온 것만
drop policy if exists "own deliveries" on public.deliveries;
create policy "own deliveries" on public.deliveries
  for select using (auth.uid() = user_id);

-- 좋아요: 내가 누른 것만 보이고 만들 수 있다.
-- 상대가 나를 눌렀는지는 알려주지 않는다 (그걸 아는 것 자체가 유료 기능이다)
drop policy if exists "own likes read" on public.likes;
create policy "own likes read" on public.likes
  for select using (auth.uid() = from_id);
drop policy if exists "own likes insert" on public.likes;
create policy "own likes insert" on public.likes
  for insert with check (auth.uid() = from_id);

-- 매칭: 내가 낀 것만
drop policy if exists "own matches" on public.matches;
create policy "own matches" on public.matches
  for select using (auth.uid() = a_id or auth.uid() = b_id);

-- 대화: 내가 낀 매칭의 메시지만
drop policy if exists "own messages read" on public.messages;
create policy "own messages read" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.a_id = auth.uid() or m.b_id = auth.uid())
    )
  );
drop policy if exists "own messages write" on public.messages;
create policy "own messages write" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.a_id = auth.uid() or m.b_id = auth.uid())
    )
  );

-- 토큰: 내역은 읽기만. 넣고 빼는 건 서버에서만 한다
drop policy if exists "own tokens" on public.token_ledger;
create policy "own tokens" on public.token_ledger
  for select using (auth.uid() = user_id);

-- ── 가입하면 프로필 자리를 만들어둔다 ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, birth_year, birth_month, gender, seeking, sido, sigungu, height_cm)
  values (new.id, '', 2000, 1, '', '{}', '', '', 170)
  on conflict (id) do nothing;

  -- 가입 선물: 첫 연락 한 번은 무료
  insert into public.token_ledger (user_id, amount, reason)
  values (new.id, 1, 'signup_bonus');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 함수는 가입할 때 자동으로만 돌아야 한다. 바깥에서 부를 수 없게 막는다.
-- (security definer 함수는 접근 권한을 통과하므로 열어두면 안 된다)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
