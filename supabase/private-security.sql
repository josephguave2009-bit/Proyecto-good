-- Security functions moved to unexposed private schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.are_friends(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
select (select auth.uid()) in (a,b) and exists (
select 1 from public.friend_requests r where r.status='accepted'
and ((r.sender_id=a and r.receiver_id=b) or (r.sender_id=b and r.receiver_id=a)));
$$;
revoke all on function private.are_friends(uuid,uuid) from public,anon;
grant execute on function private.are_friends(uuid,uuid) to authenticated;
create or replace function private.is_group_member(g uuid,u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
select u=(select auth.uid()) and exists(select 1 from public.group_members m where m.group_id=g and m.user_id=u);
$$;
revoke all on function private.is_group_member(uuid,uuid) from public,anon;
grant execute on function private.is_group_member(uuid,uuid) to authenticated;
drop policy if exists "Leer mensajes privados" on public.direct_messages;
create policy "Leer mensajes privados" on public.direct_messages for select to authenticated
using ((sender_id=(select auth.uid()) or receiver_id=(select auth.uid())) and private.are_friends(sender_id,receiver_id));
drop policy if exists "Enviar a amistades" on public.direct_messages;
create policy "Enviar a amistades" on public.direct_messages for insert to authenticated
with check (sender_id=(select auth.uid()) and private.are_friends(sender_id,receiver_id));
drop policy if exists "Leer chat grupal" on public.group_messages;
create policy "Leer chat grupal" on public.group_messages for select to authenticated
using(private.is_group_member(group_id,(select auth.uid())));
drop policy if exists "Escribir chat grupal" on public.group_messages;
create policy "Escribir chat grupal" on public.group_messages for insert to authenticated
with check(sender_id=(select auth.uid()) and private.is_group_member(group_id,(select auth.uid())));
drop function if exists public.are_friends(uuid,uuid);
drop function if exists public.is_group_member(uuid,uuid);
