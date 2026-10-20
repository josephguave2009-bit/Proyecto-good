-- Harden helper routines after applying schema.sql
revoke execute on function public.create_new_profile() from public, anon, authenticated;
revoke execute on function public.are_friends(uuid,uuid) from public, anon;
revoke execute on function public.is_group_member(uuid,uuid) from public, anon;
create or replace function public.are_friends(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select (select auth.uid()) in (a,b) and exists(
 select 1 from public.friend_requests r where r.status='accepted'
 and ((r.sender_id=a and r.receiver_id=b) or (r.sender_id=b and r.receiver_id=a)));
$$;
create or replace function public.is_group_member(g uuid,u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select u=(select auth.uid()) and exists(
 select 1 from public.group_members m where m.group_id=g and m.user_id=u);
$$;
create index if not exists direct_messages_receiver_idx on public.direct_messages(receiver_id);
create index if not exists game_groups_owner_idx on public.game_groups(owner_id);
create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists group_messages_sender_idx on public.group_messages(sender_id);
