-- Ejecutar en Supabase SQL Editor. El anon key se puede publicar; nunca service_role.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (char_length(username) between 3 and 24),
 bio text not null default '' check (char_length(bio) <= 240),
 edition text not null default 'Java' check (edition in ('Java','Bedrock','Ambas')),
 created_at timestamptz not null default now()
);
create or replace function public.create_new_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id, username)
 values(new.id, 'jugador_' || substring(replace(new.id::text,'-',''),1,12))
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists auth_profile_created on auth.users;
create trigger auth_profile_created after insert on auth.users for each row execute function public.create_new_profile();

create table if not exists public.friend_requests(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','rejected')),
 created_at timestamptz not null default now(),
 check(sender_id <> receiver_id),
 unique(sender_id,receiver_id)
);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create table if not exists public.game_groups(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 3 and 60),
 description text not null default '' check(char_length(description) <= 300),
 created_at timestamptz not null default now()
);
create table if not exists public.group_members(
 group_id uuid not null references public.game_groups(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table if not exists public.direct_messages(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now(),
 check(sender_id <> receiver_id)
);
create index if not exists direct_messages_pair_idx on public.direct_messages(sender_id, receiver_id, created_at);
create table if not exists public.group_messages(
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.game_groups(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index if not exists group_messages_idx on public.group_messages(group_id,created_at);

create or replace function public.are_friends(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.friend_requests r where r.status='accepted'
 and ((r.sender_id=a and r.receiver_id=b) or (r.sender_id=b and r.receiver_id=a)));
$$;
revoke all on function public.are_friends(uuid,uuid) from public;
grant execute on function public.are_friends(uuid,uuid) to authenticated;
create or replace function public.is_group_member(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.group_members m where m.group_id=g and m.user_id=u);
$$;
revoke all on function public.is_group_member(uuid,uuid) from public;
grant execute on function public.is_group_member(uuid,uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.game_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.direct_messages enable row level security;
alter table public.group_messages enable row level security;
create policy "Perfiles visibles a usuarios" on public.profiles for select to authenticated using (true);
create policy "Editar perfil propio" on public.profiles for update to authenticated using (id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "Mis solicitudes" on public.friend_requests for select to authenticated using(sender_id=(select auth.uid()) or receiver_id=(select auth.uid()));
create policy "Enviar solicitud" on public.friend_requests for insert to authenticated with check(sender_id=(select auth.uid()) and status='pending');
create policy "Responder solicitud" on public.friend_requests for update to authenticated
 using(receiver_id=(select auth.uid()) and status='pending')
 with check(receiver_id=(select auth.uid()) and status in ('accepted','rejected'));
create policy "Grupos visibles" on public.game_groups for select to authenticated using(true);
create policy "Crear grupo" on public.game_groups for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Miembros visibles" on public.group_members for select to authenticated using(true);
create policy "Entrar a grupo" on public.group_members for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Salir de grupo" on public.group_members for delete to authenticated using(user_id=(select auth.uid()));
create policy "Leer mensajes privados" on public.direct_messages for select to authenticated
 using((sender_id=(select auth.uid()) or receiver_id=(select auth.uid())) and public.are_friends(sender_id,receiver_id));
create policy "Enviar a amistades" on public.direct_messages for insert to authenticated
 with check(sender_id=(select auth.uid()) and public.are_friends(sender_id,receiver_id));
create policy "Leer chat grupal" on public.group_messages for select to authenticated
 using(public.is_group_member(group_id,(select auth.uid())));
create policy "Escribir chat grupal" on public.group_messages for insert to authenticated
 with check(sender_id=(select auth.uid()) and public.is_group_member(group_id,(select auth.uid())));
-- Realtime requiere habilitar manualmente direct_messages y group_messages en
-- Database > Publications > supabase_realtime, si no, el cliente sondea cada 5s.
