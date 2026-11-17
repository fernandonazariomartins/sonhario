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

-- 4. Lembrete da manhã ("Sonhou? Registre.") --------------------------------
-- Uma linha por aparelho inscrito nas notificações.
create table if not exists public.lembretes (
  endpoint      text primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  assinatura    jsonb not null,                 -- PushSubscription.toJSON()
  hora          text not null default '06:30',  -- 'HH:MM', na hora local da pessoa
  fuso          text not null default 'America/Sao_Paulo',
  ativo         boolean not null default true,
  ultimo_envio  date,
  criado_em     timestamptz not null default now()
);

alter table public.lembretes enable row level security;

drop policy if exists "lembretes: os meus" on public.lembretes;
create policy "lembretes: os meus" on public.lembretes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Agendar a função do lembrete a cada 5 minutos ---------------------------
-- Rode este bloco DEPOIS de publicar a função "lembrete-manha" (veja o README).
-- Troque COLE_O_SEGREDO pelo mesmo valor do segredo LEMBRETE_SEGREDO.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('sonhario-lembrete', '*/5 * * * *', $$
--   select net.http_post(
--     url := 'https://sburmejkmlkmzijmrpqr.supabase.co/functions/v1/lembrete-manha',
--     headers := '{"Content-Type": "application/json", "x-segredo": "COLE_O_SEGREDO"}'::jsonb,
--     body := '{}'::jsonb
--   );
-- $$);

-- 6. Compartilhar com o terapeuta ou com amigos -----------------------------
-- A pessoa convida pelo e-mail. Quem foi convidado entra com Google usando esse
-- e-mail e vê os sonhos numa aba própria, só para leitura.
alter table public.sonhos add column if not exists compartilhado boolean not null default false;

create table if not exists public.compartilhamentos (
  id                uuid primary key default gen_random_uuid(),
  dono_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dono_nome         text not null default '',
  dono_email        text not null default '',
  convidado_email   text not null check (convidado_email = lower(convidado_email)),
  convidado_nome    text not null default '',
  papel             text not null default 'terapeuta' check (papel in ('terapeuta', 'amigo')),
  escopo            text not null default 'escolhidos' check (escopo in ('todos', 'escolhidos')),
  ver_amplificacoes boolean not null default false,
  criado_em         timestamptz not null default now(),
  unique (dono_id, convidado_email)
);

alter table public.compartilhamentos enable row level security;

-- Quem compartilha cria, muda e desfaz os próprios convites.
drop policy if exists "compartilhamentos: os meus" on public.compartilhamentos;
create policy "compartilhamentos: os meus" on public.compartilhamentos
  for all using (auth.uid() = dono_id) with check (auth.uid() = dono_id);

-- Quem foi convidado vê o convite e pode sair dele, mas não muda nada.
drop policy if exists "compartilhamentos: ver os comigo" on public.compartilhamentos;
create policy "compartilhamentos: ver os comigo" on public.compartilhamentos
  for select using (convidado_email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "compartilhamentos: sair" on public.compartilhamentos;
create policy "compartilhamentos: sair" on public.compartilhamentos
  for delete using (convidado_email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Os sonhos de alguém que compartilhou comigo. Só os que a pessoa liberou
-- (todos, ou os marcados como "compartilhado"), e as amplificações só se ela permitiu.
create or replace function public.sonhos_compartilhados(dono uuid)
returns table (
  id uuid, sonhado_em timestamptz, atualizado_em timestamptz, titulo text, texto text,
  temas text[], status text, cor text, conclusoes jsonb, levar_sessao boolean, audio jsonb
)
language sql stable security definer set search_path = public as $$
  select s.id, s.sonhado_em, s.atualizado_em, s.titulo, s.texto, s.temas, s.status, s.cor,
         case when c.ver_amplificacoes then s.conclusoes else '[]'::jsonb end,
         s.levar_sessao, s.audio
  from public.sonhos s
  join public.compartilhamentos c on c.dono_id = s.user_id
  where s.user_id = dono
    and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and (c.escopo = 'todos' or s.compartilhado)
  order by s.sonhado_em desc;
$$;
revoke all on function public.sonhos_compartilhados(uuid) from public, anon;
grant execute on function public.sonhos_compartilhados(uuid) to authenticated;

-- O áudio de um sonho compartilhado comigo.
create or replace function public.posso_ouvir(caminho text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sonhos s
    join public.compartilhamentos c on c.dono_id = s.user_id
    where s.audio ->> 'ref' = caminho
      and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (c.escopo = 'todos' or s.compartilhado)
  );
$$;
revoke all on function public.posso_ouvir(text) from public, anon;
grant execute on function public.posso_ouvir(text) to authenticated;

drop policy if exists "audios: ouvir os compartilhados" on storage.objects;
create policy "audios: ouvir os compartilhados" on storage.objects
  for select using (bucket_id = 'audios' and public.posso_ouvir(name));
