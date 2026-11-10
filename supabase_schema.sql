-- 가족 전용 산행기록장: Supabase SQL Editor에서 전체 실행
-- 최초로 가입/로그인한 계정이 관리자(소유자)가 됩니다. 가족 계정은 관리자 등록 후에 가입/인증하세요.

create extension if not exists pgcrypto;

create table if not exists public.hike_owners (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.hike_family_access (
  owner_id uuid not null references public.hike_owners(owner_id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  member_email text not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  unique (member_id)
);

create table if not exists public.hike_records (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hike_owners enable row level security;
alter table public.hike_family_access enable row level security;
alter table public.hike_records enable row level security;

-- 관리자 등록: 소유자가 아직 없을 때만 최초 로그인 계정이 등록할 수 있습니다.
create or replace function public.claim_hike_owner()
returns boolean language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if not exists (select 1 from public.hike_owners) then
    insert into public.hike_owners(owner_id) values (auth.uid()) on conflict do nothing;
  end if;
  return exists (select 1 from public.hike_owners where owner_id = auth.uid());
end;
$$;

create or replace function public.get_my_hike_role()
returns text language sql stable security definer set search_path = public, auth
as $$
  select case
    when exists (select 1 from public.hike_owners where owner_id = auth.uid()) then 'owner'
    when exists (select 1 from public.hike_family_access where member_id = auth.uid()) then 'family'
    else 'pending'
  end;
$$;

-- 가족은 먼저 Supabase Auth에서 가입하고 이메일 인증까지 마쳐야 합니다.
create or replace function public.add_hike_family_member(member_email text)
returns void language plpgsql security definer set search_path = public, auth
as $$
declare v_member_id uuid; v_owner_id uuid;
begin
  v_owner_id := auth.uid();
  if v_owner_id is null or not exists (select 1 from public.hike_owners where owner_id = v_owner_id) then
    raise exception '관리자만 가족을 추가할 수 있습니다.';
  end if;
  select id into v_member_id from auth.users
    where lower(email) = lower(trim(member_email)) and email_confirmed_at is not null
    limit 1;
  if v_member_id is null then raise exception '해당 이메일의 가입 및 이메일 인증이 완료됐는지 확인해 주세요.'; end if;
  if v_member_id = v_owner_id then raise exception '관리자 본인은 가족으로 추가할 수 없습니다.'; end if;
  insert into public.hike_family_access(owner_id, member_id, member_email)
    values (v_owner_id, v_member_id, lower(trim(member_email)))
    on conflict (owner_id, member_id) do update set member_email = excluded.member_email;
exception when unique_violation then
  raise exception '이 계정은 이미 다른 산행기록장의 가족으로 등록되어 있습니다.';
end;
$$;

create or replace function public.remove_hike_family_member(member_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.hike_owners where owner_id = auth.uid()) then
    raise exception '관리자만 가족 접근 권한을 해제할 수 있습니다.';
  end if;
  delete from public.hike_family_access where owner_id = auth.uid() and member_id = member_user_id;
end;
$$;

-- 기존 정책을 제거한 뒤 관리자/가족 권한으로 다시 설정
 drop policy if exists "Owners can view their hike records" on public.hike_records;
 drop policy if exists "Owners can create their hike records" on public.hike_records;
 drop policy if exists "Owners can update their hike records" on public.hike_records;
 drop policy if exists "Owners can delete their hike records" on public.hike_records;
 drop policy if exists "Hike owner or family can read records" on public.hike_records;
 drop policy if exists "Only hike owner can insert records" on public.hike_records;
 drop policy if exists "Only hike owner can update records" on public.hike_records;
 drop policy if exists "Only hike owner can delete records" on public.hike_records;

create policy "Hike owner or family can read records" on public.hike_records
  for select to authenticated using (
    exists (select 1 from public.hike_owners o where o.owner_id = hike_records.owner_id and o.owner_id = auth.uid())
    or exists (select 1 from public.hike_family_access f where f.owner_id = hike_records.owner_id and f.member_id = auth.uid())
  );
create policy "Only hike owner can insert records" on public.hike_records
  for insert to authenticated with check (exists (select 1 from public.hike_owners o where o.owner_id = hike_records.owner_id and o.owner_id = auth.uid()));
create policy "Only hike owner can update records" on public.hike_records
  for update to authenticated using (exists (select 1 from public.hike_owners o where o.owner_id = hike_records.owner_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.hike_owners o where o.owner_id = hike_records.owner_id and o.owner_id = auth.uid()));
create policy "Only hike owner can delete records" on public.hike_records
  for delete to authenticated using (exists (select 1 from public.hike_owners o where o.owner_id = hike_records.owner_id and o.owner_id = auth.uid()));

-- 소유자와 해당 가족만 가족 명단을 조회할 수 있습니다. 변경은 보안 함수만 허용합니다.
drop policy if exists "Owner or member can read family access" on public.hike_family_access;
create policy "Owner or member can read family access" on public.hike_family_access
  for select to authenticated using (owner_id = auth.uid() or member_id = auth.uid());

-- 비공개 사진 저장소: 관리자와 초대된 가족은 사진 읽기, 업로드/삭제는 관리자만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hike-photos', 'hike-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880;

drop policy if exists "Owners can read their hike photos" on storage.objects;
drop policy if exists "Owners can upload their hike photos" on storage.objects;
drop policy if exists "Owners can update their hike photos" on storage.objects;
drop policy if exists "Owners can delete their hike photos" on storage.objects;
drop policy if exists "Hike owner or family can read photos" on storage.objects;
drop policy if exists "Only hike owner can upload photos" on storage.objects;
drop policy if exists "Only hike owner can update photos" on storage.objects;
drop policy if exists "Only hike owner can delete photos" on storage.objects;

create policy "Hike owner or family can read photos" on storage.objects
  for select to authenticated using (
    bucket_id = 'hike-photos' and (
      exists (select 1 from public.hike_owners o where o.owner_id::text = (storage.foldername(name))[1] and o.owner_id = auth.uid())
      or exists (select 1 from public.hike_family_access f where f.owner_id::text = (storage.foldername(name))[1] and f.member_id = auth.uid())
    )
  );
create policy "Only hike owner can upload photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'hike-photos' and exists (select 1 from public.hike_owners o where o.owner_id::text = (storage.foldername(name))[1] and o.owner_id = auth.uid())
  );
create policy "Only hike owner can update photos" on storage.objects
  for update to authenticated using (
    bucket_id = 'hike-photos' and exists (select 1 from public.hike_owners o where o.owner_id::text = (storage.foldername(name))[1] and o.owner_id = auth.uid())
  ) with check (
    bucket_id = 'hike-photos' and exists (select 1 from public.hike_owners o where o.owner_id::text = (storage.foldername(name))[1] and o.owner_id = auth.uid())
  );
create policy "Only hike owner can delete photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'hike-photos' and exists (select 1 from public.hike_owners o where o.owner_id::text = (storage.foldername(name))[1] and o.owner_id = auth.uid())
  );

grant usage on schema public to authenticated;
grant select on public.hike_family_access to authenticated;
grant select, insert, update, delete on public.hike_records to authenticated;
grant usage on schema public to authenticated;
grant select on public.hike_family_access to authenticated;
grant select, insert, update, delete on public.hike_records to authenticated;
grant execute on function public.claim_hike_owner() to authenticated;
grant execute on function public.get_my_hike_role() to authenticated;
grant execute on function public.add_hike_family_member(text) to authenticated;
grant execute on function public.remove_hike_family_member(uuid) to authenticated;

-- 다른 기기에서 기록이 바뀌면 열린 페이지에도 변경을 전달합니다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hike_records'
  ) then
    alter publication supabase_realtime add table public.hike_records;
  end if;
end $$;
