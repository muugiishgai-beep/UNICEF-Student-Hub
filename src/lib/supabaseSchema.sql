-- ================================================================
-- UNICEF ОЮУТНЫ ХОЛБОО (UNICEF STUDENT HUB)
-- PostgreSQL + Supabase Database Schema with Secure RLS & Admin RBAC
-- ================================================================

-- 1. PROFILES (Хэрэглэгчийн бүртгэл ба систем дэх үүрэг)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'Гишүүн',
  member_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MEMBERS (Клубийн албан ёсны гишүүд)
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  student_id text not null,
  university text not null,
  major text not null,
  role text not null default 'Гишүүн',
  status text not null default 'Идэвхтэй',
  joined_date date not null default current_date,
  email text not null,
  phone text not null,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MEMBERSHIP REQUESTS (Элсэх хүсэлтүүд)
create table if not exists public.membership_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  student_id text not null,
  university text not null,
  major text not null,
  email text not null,
  phone text not null,
  reason text not null,
  skills_interests text not null,
  status text not null default 'Хүлээгдэж буй',
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_by text,
  review_notes text,
  reviewed_at timestamp with time zone
);

-- 4. ATTENDANCE (Ирцийн бүртгэл)
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  event_id uuid,
  event_title text not null,
  date date not null default current_date,
  member_id uuid references public.members(id) on delete cascade not null,
  member_name text not null,
  status text not null default 'Ирсэн',
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PARTICIPATION (Оролцоо ба сайн дурын ажлын бүртгэл)
create table if not exists public.participation (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  member_name text not null,
  event_title text not null,
  date date not null default current_date,
  volunteer_hours numeric not null default 0,
  assigned_task text,
  task_status text default 'Хийгдэж буй',
  achievement text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PLANS (Сар ба жилийн төлөвлөгөө)
create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null default 'Сар',
  target_period text not null,
  responsible_person text not null,
  responsible_member_id uuid references public.members(id) on delete set null,
  deadline date not null,
  status text not null default 'Төлөвлөсөн',
  progress integer not null default 0,
  description text,
  budget numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. EVENTS (Арга хэмжээ, уулзалтууд)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null default 'Уулзалт',
  date date not null,
  time text not null default '14:00',
  location text not null,
  organizer text not null,
  description text not null,
  is_registration_open boolean not null default true,
  max_participants integer,
  registered_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ANNOUNCEMENTS (Зарлалын самбар)
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author text not null,
  is_pinned boolean not null default false,
  category text not null default 'Мэдэгдэл',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ================================================================
-- СЕРВЕР ТҮВШНИЙ АДМИН ЭРХ ШАЛГАХ ФУНКЦ БА ХАМГААЛАЛТ
-- ================================================================

-- Баталгаажсан администратор эсэхийг шалгах security definer функц
create or replace function public.is_admin()
returns boolean as $$
declare
  jwt_email text;
  user_role text;
begin
  -- 1. Хэрэглэгч нэвтрээгүй бол админ биш
  if auth.uid() is null then
    return false;
  end if;

  -- 2. Төслийн анхны баталгаажсан эзэмшигч администратор хаяг
  jwt_email := auth.jwt() ->> 'email';
  if jwt_email = 'muugiishgai@gmail.com' then
    return true;
  end if;

  -- 3. Profiles хүснэгтэд албан ёсоор олгогдсон эрхийг шалгах
  select role into user_role
  from public.profiles
  where id = auth.uid();

  -- Админ эрхтэй удирдах албан тушаалууд: Тэргүүн, Дэд тэргүүн, Нарийн бичгийн дарга
  return user_role in ('Тэргүүн', 'Дэд тэргүүн', 'Нарийн бичгийн дарга');
end;
$$ language plpgsql security definer set search_path = public;

-- Энгийн гишүүн өөрийнхөө эрхийг дур мэдэн Админ болгож өсгөхөөс хамгаалах триггер
create or replace function public.prevent_self_role_escalation()
returns trigger as $$
begin
  -- Хэрэв үүрэг (role) өөрчлөгдөж байгаа бөгөөд одоогийн хүсэлт явуулж буй хэрэглэгч админ биш бол цуцална!
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Эрх хүрэхгүй: Зөвхөн баталгаажсан администратор хэрэглэгчийн үүргийг өөрчлөх боломжтой.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_role_change_security on public.profiles;
create trigger enforce_role_change_security
before update on public.profiles
for each row execute procedure public.prevent_self_role_escalation();

-- Шинэ хэрэглэгч бүртгүүлэхэд ажиллах триггер:
-- Энгийн бүртгүүлэгчид шууд админ эрх ОЛГОХГҮЙ, анхдагчаар strictly 'Гишүүн' болно!
-- Зөвхөн төслийн баталгаажсан эзэмшигч muugiishgai@gmail.com хаягт 'Тэргүүн' оноогдоно.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.email = 'muugiishgai@gmail.com' then 'Тэргүүн' else 'Гишүүн' end
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case when excluded.email = 'muugiishgai@gmail.com' then 'Тэргүүн' else public.profiles.role end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) БОДЛОГУУД (Сервер түвшний хязгаарлалт)
-- ================================================================

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_requests enable row level security;
alter table public.attendance enable row level security;
alter table public.participation enable row level security;
alter table public.plans enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;

-- 1. PROFILES бодлого
drop policy if exists "Хэрэглэгч өөрийн профайлыг харах" on public.profiles;
create policy "Хэрэглэгч өөрийн профайлыг харах" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Админ бусдын эрхийг удирдах" on public.profiles;
create policy "Админ бусдын эрхийг удирдах" on public.profiles
  for update using (public.is_admin());

-- 2. MEMBERS бодлого:
-- Бүртгэлтэй хэрэглэгч гишүүдийн жагсаалтыг уншина.
-- Нэмэх, засах, устгахыг ЗӨВХӨН баталгаажсан админ гүйцэтгэнэ!
drop policy if exists "Бүх хэрэглэгч гишүүдийг харах" on public.members;
create policy "Бүх хэрэглэгч гишүүдийг харах" on public.members
  for select using (true);

drop policy if exists "Зөвхөн админ гишүүн нэмэх" on public.members;
create policy "Зөвхөн админ гишүүн нэмэх" on public.members
  for insert with check (public.is_admin());

drop policy if exists "Зөвхөн админ гишүүн засах" on public.members;
create policy "Зөвхөн админ гишүүн засах" on public.members
  for update using (public.is_admin());

drop policy if exists "Зөвхөн админ гишүүн устгах" on public.members;
create policy "Зөвхөн админ гишүүн устгах" on public.members
  for delete using (public.is_admin());

-- 3. MEMBERSHIP REQUESTS бодлого:
-- Гадны хүсэлт гаргагч бүр хүсэлтээ илгээж болно.
-- Харин харах, батлах, татгалзахыг ЗӨВХӨН админ хийнэ!
drop policy if exists "Нийт хэрэглэгч хүсэлт илгээх боломжтой" on public.membership_requests;
create policy "Нийт хэрэглэгч хүсэлт илгээх боломжтой" on public.membership_requests
  for insert with check (true);

drop policy if exists "Зөвхөн админ хүсэлт харах" on public.membership_requests;
create policy "Зөвхөн админ хүсэлт харах" on public.membership_requests
  for select using (public.is_admin());

drop policy if exists "Зөвхөн админ хүсэлт шийдвэрлэх" on public.membership_requests;
create policy "Зөвхөн админ хүсэлт шийдвэрлэх" on public.membership_requests
  for update using (public.is_admin());

drop policy if exists "Зөвхөн админ хүсэлт устгах" on public.membership_requests;
create policy "Зөвхөн админ хүсэлт устгах" on public.membership_requests
  for delete using (public.is_admin());

-- 4. ATTENDANCE бодлого:
-- Бүртгэлтэй хэрэглэгч ирц харна. ЗӨВХӨН админ үүсгэх, засах, устгана.
drop policy if exists "Хэрэглэгч ирц харах" on public.attendance;
create policy "Хэрэглэгч ирц харах" on public.attendance
  for select using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists "Зөвхөн админ ирц бүртгэх" on public.attendance;
create policy "Зөвхөн админ ирц бүртгэх" on public.attendance
  for insert with check (public.is_admin());

drop policy if exists "Зөвхөн админ ирц засах" on public.attendance;
create policy "Зөвхөн админ ирц засах" on public.attendance
  for update using (public.is_admin());

drop policy if exists "Зөвхөн админ ирц устгах" on public.attendance;
create policy "Зөвхөн админ ирц устгах" on public.attendance
  for delete using (public.is_admin());

-- 5. PARTICIPATION бодлого:
drop policy if exists "Хэрэглэгч оролцоо харах" on public.participation;
create policy "Хэрэглэгч оролцоо харах" on public.participation
  for select using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists "Зөвхөн админ оролцоо бүртгэх" on public.participation;
create policy "Зөвхөн админ оролцоо бүртгэх" on public.participation
  for insert with check (public.is_admin());

drop policy if exists "Зөвхөн админ оролцоо засах" on public.participation;
create policy "Зөвхөн админ оролцоо засах" on public.participation
  for update using (public.is_admin());

drop policy if exists "Зөвхөн админ оролцоо устгах" on public.participation;
create policy "Зөвхөн админ оролцоо устгах" on public.participation
  for delete using (public.is_admin());

-- 6. PLANS бодлого:
drop policy if exists "Хэрэглэгч төлөвлөгөө харах" on public.plans;
create policy "Хэрэглэгч төлөвлөгөө харах" on public.plans
  for select using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists "Зөвхөн админ төлөвлөгөө удирдах" on public.plans;
create policy "Зөвхөн админ төлөвлөгөө удирдах" on public.plans
  for all using (public.is_admin());

-- 7. EVENTS & ANNOUNCEMENTS бодлого:
drop policy if exists "Нийтээр арга хэмжээ харах" on public.events;
create policy "Нийтээр арга хэмжээ харах" on public.events
  for select using (true);

drop policy if exists "Зөвхөн админ арга хэмжээ удирдах" on public.events;
create policy "Зөвхөн админ арга хэмжээ удирдах" on public.events
  for all using (public.is_admin());

drop policy if exists "Нийтээр зарлал харах" on public.announcements;
create policy "Нийтээр зарлал харах" on public.announcements
  for select using (true);

drop policy if exists "Зөвхөн админ зарлал удирдах" on public.announcements;
create policy "Зөвхөн админ зарлал удирдах" on public.announcements
  for all using (public.is_admin());
