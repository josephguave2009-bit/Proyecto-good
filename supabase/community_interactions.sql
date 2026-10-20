-- SPAWNLY: reacciones y conversaciones reales en publicaciones.
create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists community_post_likes_user on public.community_post_likes(user_id);
alter table public.community_post_likes enable row level security;
create policy "Todos pueden ver las reacciones" on public.community_post_likes
  for select to anon, authenticated using (true);
create policy "Cada usuario da su propio like" on public.community_post_likes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Cada usuario quita su propio like" on public.community_post_likes
  for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  constraint comment_identity_in_post unique(id, post_id),
  constraint comment_reply_same_post foreign key(parent_id, post_id)
    references public.community_post_comments(id, post_id) on delete cascade
);
create index if not exists community_post_comments_recent
  on public.community_post_comments(post_id, created_at desc);
create index if not exists community_post_comments_author
  on public.community_post_comments(author_id, created_at desc);
alter table public.community_post_comments enable row level security;
create policy "Todos pueden ver comentarios" on public.community_post_comments
  for select to anon, authenticated using (true);
create policy "Usuarios pueden comentar" on public.community_post_comments
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Solo el autor puede borrar su comentario" on public.community_post_comments
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Limitar ráfagas accidentales y abuso básico. Enforce authoritative timestamp.
create or replace function public.community_comment_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := now();
  if (select count(*) from public.community_post_comments
      where author_id = new.author_id
      and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'Espera un minuto antes de enviar mas comentarios';
  end if;
  return new;
end;
$$;
create trigger community_comment_check_rate
  before insert on public.community_post_comments
  for each row execute function public.community_comment_guard();

grant select on public.community_post_likes, public.community_post_comments to anon, authenticated;
grant insert, delete on public.community_post_likes, public.community_post_comments to authenticated;
