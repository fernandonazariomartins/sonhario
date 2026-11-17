-- Sonhário · estrutura do banco no Supabase
-- Cole tudo no SQL Editor do projeto e clique em Run. Pode rodar de novo sem problema.

-- 1. Tabela dos sonhos ------------------------------------------------------
create table if not exists public.sonhos (
  id            uuid primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sonhado_em    timestamptz not null default now(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  titulo        text not null default '',
  texto         text not null default '',
  temas         text[] not null default '{}',
  status        text not null default 'nao_aberto' check (status in ('nao_aberto', 'aberto', 'dar_atencao')),
  cor           text not null default 'branco',
  conclusoes    jsonb not null default '[]'::jsonb,   -- [{ id, em, origem: 'sozinho'|'sessao', texto }]
  levar_sessao  boolean not null default false,
  audio         jsonb                                  -- { ref: 'user_id/id.webm', duracao: segundos }
);

create index if not exists sonhos_user_data on public.sonhos (user_id, sonhado_em desc);
create index if not exists sonhos_temas on public.sonhos using gin (temas);

-- 2. Cada pessoa só vê e mexe nos próprios sonhos (RLS) -------------------
alter table public.sonhos enable row level security;

drop policy if exists "sonhos: ler os meus" on public.sonhos;
create policy "sonhos: ler os meus" on public.sonhos
  for select using (auth.uid() = user_id);

drop policy if exists "sonhos: criar os meus" on public.sonhos;
create policy "sonhos: criar os meus" on public.sonhos
  for insert with check (auth.uid() = user_id);

drop policy if exists "sonhos: editar os meus" on public.sonhos;
create policy "sonhos: editar os meus" on public.sonhos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sonhos: apagar os meus" on public.sonhos;
create policy "sonhos: apagar os meus" on public.sonhos
  for delete using (auth.uid() = user_id);

-- 3. Áudios: bucket privado, uma pasta por pessoa ---------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audios', 'audios', false, 26214400, array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/x-m4a'])
on conflict (id) do nothing;

drop policy if exists "audios: ler os meus" on storage.objects;
create policy "audios: ler os meus" on storage.objects
  for select using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audios: enviar os meus" on storage.objects;
create policy "audios: enviar os meus" on storage.objects
  for insert with check (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audios: trocar os meus" on storage.objects;
create policy "audios: trocar os meus" on storage.objects
  for update using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "audios: apagar os meus" on storage.objects;
create policy "audios: apagar os meus" on storage.objects
  for delete using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);
