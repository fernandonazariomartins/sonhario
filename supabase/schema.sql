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

-- Com quem cada sonho foi compartilhado (e-mails), para quem vê "só os escolhidos".
alter table public.sonhos add column if not exists compartilhado_com text[] not null default '{}';

-- Nome e foto da conta Google, para aparecerem na hora de escolher a pessoa.
create table if not exists public.perfis (
  id            uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email         text not null unique check (email = lower(email)),
  nome          text not null default '',
  foto          text not null default '',
  atualizado_em timestamptz not null default now()
);
alter table public.perfis enable row level security;
drop policy if exists "perfis: o meu" on public.perfis;
create policy "perfis: o meu" on public.perfis
  for all using (auth.uid() = id) with check (auth.uid() = id);

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

-- Nome e foto das pessoas ligadas a mim (convidei ou me convidaram).
create or replace function public.perfis_conectados()
returns table (email text, nome text, foto text)
language sql stable security definer set search_path = public as $$
  select p.email, p.nome, p.foto from public.perfis p
  where p.email in (select c.convidado_email from public.compartilhamentos c where c.dono_id = auth.uid())
     or p.id in (select c.dono_id from public.compartilhamentos c where c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.perfis_conectados() from public, anon;
grant execute on function public.perfis_conectados() to authenticated;

-- Ao digitar o e-mail exato de quem já usa o Sonhário, mostra o nome e a foto.
create or replace function public.perfil_por_email(procurado text)
returns table (email text, nome text, foto text)
language sql stable security definer set search_path = public as $$
  select p.email, p.nome, p.foto from public.perfis p where p.email = lower(trim(procurado)) limit 1;
$$;
revoke all on function public.perfil_por_email(text) from public, anon;
grant execute on function public.perfil_por_email(text) to authenticated;

-- Os sonhos de alguém que compartilhou comigo. Só os que a pessoa liberou
-- (todos, ou os escolhidos para mim), e as amplificações só se ela permitiu.
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
    and c.convidado_email = any (s.compartilhado_com)
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
      and c.convidado_email = any (s.compartilhado_com)
  );
$$;
revoke all on function public.posso_ouvir(text) from public, anon;
grant execute on function public.posso_ouvir(text) to authenticated;

drop policy if exists "audios: ouvir os compartilhados" on storage.objects;
create policy "audios: ouvir os compartilhados" on storage.objects
  for select using (bucket_id = 'audios' and public.posso_ouvir(name));

-- 7. Link de convite ---------------------------------------------------------
-- O compartilhamento é sempre de um sonho por vez: nunca do caderno inteiro.
-- A pessoa gera o link de um sonho e pode mandar para quantas pessoas quiser.
-- Quem abre entra com Google e vira um pedido: só vê depois que o dono aprova.
update public.compartilhamentos set escopo = 'escolhidos' where escopo = 'todos';
alter table public.compartilhamentos alter column escopo set default 'escolhidos';
alter table public.compartilhamentos add column if not exists pendente boolean not null default false;
alter table public.compartilhamentos add column if not exists sonhos_pedidos uuid[] not null default '{}';

create table if not exists public.convites (
  token             text primary key,
  dono_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dono_nome         text not null default '',
  dono_email        text not null default '',
  sonho_id          uuid not null references public.sonhos (id) on delete cascade,
  papel             text not null default 'amigo' check (papel in ('terapeuta', 'amigo')),
  ver_amplificacoes boolean not null default false,
  criado_em         timestamptz not null default now()
);
alter table public.convites enable row level security;
drop policy if exists "convites: os meus" on public.convites;
create policy "convites: os meus" on public.convites
  for all using (auth.uid() = dono_id) with check (auth.uid() = dono_id);

-- O que aparece antes de entrar: quem convidou.
create or replace function public.ver_convite(chave text)
returns table (dono_nome text, dono_foto text, de_um_sonho boolean)
language sql stable security definer set search_path = public as $$
  select c.dono_nome, coalesce(p.foto, ''), c.sonho_id is not null
  from public.convites c left join public.perfis p on p.id = c.dono_id
  where c.token = chave;
$$;
revoke all on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;

-- Abrir o convite já com a conta. Quem já tem acesso aprovado ganha o sonho na hora;
-- quem é novo vira um pedido, com o sonho guardado para quando for aprovado.
create or replace function public.aceitar_convite(chave text)
returns table (dono uuid, sonho uuid, pendente boolean)
language plpgsql security definer set search_path = public as $$
declare
  cv public.convites;
  ja public.compartilhamentos;
  meu_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or meu_email = '' then raise exception 'Entre com Google para abrir o convite.'; end if;
  select * into cv from public.convites where token = chave;
  if not found then raise exception 'Esse link não existe mais. Peça um novo.'; end if;
  if cv.dono_id = auth.uid() then raise exception 'Esse link é seu. Mande para a pessoa com quem quer compartilhar.'; end if;

  select * into ja from public.compartilhamentos c where c.dono_id = cv.dono_id and c.convidado_email = meu_email;
  if found and not ja.pendente then
    if cv.sonho_id is not null then
      update public.sonhos set compartilhado_com = array_append(compartilhado_com, meu_email)
      where id = cv.sonho_id and user_id = cv.dono_id and not (meu_email = any (compartilhado_com));
    end if;
    return query select cv.dono_id, cv.sonho_id, false;
    return;
  end if;

  if found then
    update public.compartilhamentos c
       set sonhos_pedidos = case when cv.sonho_id is null or cv.sonho_id = any (c.sonhos_pedidos) then c.sonhos_pedidos else array_append(c.sonhos_pedidos, cv.sonho_id) end
     where c.id = ja.id;
  else
    insert into public.compartilhamentos (dono_id, dono_nome, dono_email, convidado_email, papel, escopo, ver_amplificacoes, pendente, sonhos_pedidos)
    values (cv.dono_id, cv.dono_nome, cv.dono_email, meu_email, cv.papel, 'escolhidos', cv.ver_amplificacoes, true,
            case when cv.sonho_id is null then '{}'::uuid[] else array[cv.sonho_id] end);
  end if;
  return query select cv.dono_id, cv.sonho_id, true;
end;
$$;
revoke all on function public.aceitar_convite(text) from public, anon;
grant execute on function public.aceitar_convite(text) to authenticated;

-- O dono aprova um pedido: a pessoa passa a ver, junto com os sonhos dos links que abriu.
create or replace function public.aprovar_pedido(pedido uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.compartilhamentos;
begin
  select * into c from public.compartilhamentos where id = pedido and dono_id = auth.uid();
  if not found then raise exception 'Pedido não encontrado.'; end if;
  update public.sonhos set compartilhado_com = array_append(compartilhado_com, c.convidado_email)
   where user_id = c.dono_id and id = any (c.sonhos_pedidos) and not (c.convidado_email = any (compartilhado_com));
  update public.compartilhamentos set pendente = false, sonhos_pedidos = '{}' where id = pedido;
end;
$$;
revoke all on function public.aprovar_pedido(uuid) from public, anon;
grant execute on function public.aprovar_pedido(uuid) to authenticated;

-- Pedido ainda não aprovado não vê nada.
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
  where s.user_id = dono and not c.pendente
    and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and c.convidado_email = any (s.compartilhado_com)
  order by s.sonhado_em desc;
$$;

create or replace function public.posso_ouvir(caminho text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sonhos s
    join public.compartilhamentos c on c.dono_id = s.user_id
    where s.audio ->> 'ref' = caminho and not c.pendente
      and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and c.convidado_email = any (s.compartilhado_com)
  );
$$;

-- 8. Lixeira -----------------------------------------------------------------
-- Apagar manda o sonho para a lixeira (apagado_em preenchido). Ele fica lá por
-- 7 dias e dá para restaurar; depois disso o próprio app apaga de vez.
-- Enquanto estiver na lixeira, ninguém com quem foi compartilhado vê o sonho.
alter table public.sonhos add column if not exists apagado_em timestamptz;
create index if not exists sonhos_lixeira on public.sonhos (user_id, apagado_em) where apagado_em is not null;

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
  where s.user_id = dono and not c.pendente and s.apagado_em is null
    and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and c.convidado_email = any (s.compartilhado_com)
  order by s.sonhado_em desc;
$$;

create or replace function public.posso_ouvir(caminho text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sonhos s
    join public.compartilhamentos c on c.dono_id = s.user_id
    where s.audio ->> 'ref' = caminho and not c.pendente and s.apagado_em is null
      and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and c.convidado_email = any (s.compartilhado_com)
  );
$$;

-- 8. Link sem aprovação ------------------------------------------------------
-- O link pode pedir aprovação (padrão) ou deixar entrar direto. Nos dois casos,
-- quem abre precisa entrar com Google, e vê só o sonho daquele link.
alter table public.convites add column if not exists aprovar boolean not null default true;

drop function if exists public.ver_convite(text);
create function public.ver_convite(chave text)
returns table (dono_nome text, dono_foto text, de_um_sonho boolean, aprovar boolean)
language sql stable security definer set search_path = public as $$
  select c.dono_nome, coalesce(p.foto, ''), c.sonho_id is not null, c.aprovar
  from public.convites c left join public.perfis p on p.id = c.dono_id
  where c.token = chave;
$$;
revoke all on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;

create or replace function public.aceitar_convite(chave text)
returns table (dono uuid, sonho uuid, pendente boolean)
language plpgsql security definer set search_path = public as $$
declare
  cv public.convites;
  ja public.compartilhamentos;
  meu_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or meu_email = '' then raise exception 'Entre com Google para abrir o convite.'; end if;
  select * into cv from public.convites where token = chave;
  if not found then raise exception 'Esse link não existe mais. Peça um novo.'; end if;
  if cv.dono_id = auth.uid() then raise exception 'Esse link é seu. Mande para a pessoa com quem quer compartilhar.'; end if;

  select * into ja from public.compartilhamentos c where c.dono_id = cv.dono_id and c.convidado_email = meu_email;

  -- Já aprovada antes, ou link que entra direto: ganha o sonho na hora.
  if (found and not ja.pendente) or not cv.aprovar then
    if not found then
      insert into public.compartilhamentos (dono_id, dono_nome, dono_email, convidado_email, papel, escopo, ver_amplificacoes, pendente)
      values (cv.dono_id, cv.dono_nome, cv.dono_email, meu_email, cv.papel, 'escolhidos', cv.ver_amplificacoes, false);
    elsif ja.pendente then
      -- Tinha um pedido de outro link: este sonho entra; os outros continuam esperando aprovação.
      update public.compartilhamentos c
         set pendente = false,
             sonhos_pedidos = array_remove(c.sonhos_pedidos, cv.sonho_id)
       where c.id = ja.id;
    end if;
    if cv.sonho_id is not null then
      update public.sonhos set compartilhado_com = array_append(compartilhado_com, meu_email)
      where id = cv.sonho_id and user_id = cv.dono_id and not (meu_email = any (compartilhado_com));
    end if;
    return query select cv.dono_id, cv.sonho_id, false;
    return;
  end if;

  if found then
    update public.compartilhamentos c
       set sonhos_pedidos = case when cv.sonho_id is null or cv.sonho_id = any (c.sonhos_pedidos) then c.sonhos_pedidos else array_append(c.sonhos_pedidos, cv.sonho_id) end
     where c.id = ja.id;
  else
    insert into public.compartilhamentos (dono_id, dono_nome, dono_email, convidado_email, papel, escopo, ver_amplificacoes, pendente, sonhos_pedidos)
    values (cv.dono_id, cv.dono_nome, cv.dono_email, meu_email, cv.papel, 'escolhidos', cv.ver_amplificacoes, true,
            case when cv.sonho_id is null then '{}'::uuid[] else array[cv.sonho_id] end);
  end if;
  return query select cv.dono_id, cv.sonho_id, true;
end;
$$;
revoke all on function public.aceitar_convite(text) from public, anon;
grant execute on function public.aceitar_convite(text) to authenticated;

-- 9. Favoritos ---------------------------------------------------------------
alter table public.sonhos add column if not exists favorito boolean not null default false;

-- 10. Imagens e áudios importados ---------------------------------------------
-- Notas do Keep e páginas do Notion trazem imagens e áudios. As imagens ficam num
-- bucket privado próprio, uma pasta por pessoa, como os áudios.
alter table public.sonhos add column if not exists imagens jsonb not null default '[]'::jsonb; -- [{ ref, largura, altura, nome }]

-- O áudio do Keep vem em .3gp; quando o navegador consegue, ele vira .wav antes de subir.
update storage.buckets
   set allowed_mime_types = array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/x-m4a',
                                  'audio/wav', 'audio/x-wav', 'audio/3gpp', 'audio/amr', 'audio/aac', 'audio/flac']
 where id = 'audios';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', false, 15728640, array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

drop policy if exists "imagens: ler as minhas" on storage.objects;
create policy "imagens: ler as minhas" on storage.objects
  for select using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "imagens: enviar as minhas" on storage.objects;
create policy "imagens: enviar as minhas" on storage.objects
  for insert with check (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "imagens: trocar as minhas" on storage.objects;
create policy "imagens: trocar as minhas" on storage.objects
  for update using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "imagens: apagar as minhas" on storage.objects;
create policy "imagens: apagar as minhas" on storage.objects
  for delete using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);

-- Quem recebeu o sonho vê as imagens dele.
drop function if exists public.sonhos_compartilhados(uuid);
create function public.sonhos_compartilhados(dono uuid)
returns table (
  id uuid, sonhado_em timestamptz, atualizado_em timestamptz, titulo text, texto text,
  temas text[], status text, cor text, conclusoes jsonb, levar_sessao boolean, audio jsonb, imagens jsonb
)
language sql stable security definer set search_path = public as $$
  select s.id, s.sonhado_em, s.atualizado_em, s.titulo, s.texto, s.temas, s.status, s.cor,
         case when c.ver_amplificacoes then s.conclusoes else '[]'::jsonb end,
         s.levar_sessao, s.audio, s.imagens
  from public.sonhos s
  join public.compartilhamentos c on c.dono_id = s.user_id
  where s.user_id = dono and not c.pendente and s.apagado_em is null
    and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and c.convidado_email = any (s.compartilhado_com)
  order by s.sonhado_em desc;
$$;
revoke all on function public.sonhos_compartilhados(uuid) from public, anon;
grant execute on function public.sonhos_compartilhados(uuid) to authenticated;

create or replace function public.posso_ver_imagem(caminho text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sonhos s
    join public.compartilhamentos c on c.dono_id = s.user_id
    where s.imagens @> jsonb_build_array(jsonb_build_object('ref', caminho))
      and not c.pendente and s.apagado_em is null
      and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and c.convidado_email = any (s.compartilhado_com)
  );
$$;
revoke all on function public.posso_ver_imagem(text) from public, anon;
grant execute on function public.posso_ver_imagem(text) to authenticated;

drop policy if exists "imagens: ver as compartilhadas" on storage.objects;
create policy "imagens: ver as compartilhadas" on storage.objects
  for select using (bucket_id = 'imagens' and public.posso_ver_imagem(name));

-- 11. Link de um sonho mostra o começo antes de entrar ------------------------
-- Só o título e os primeiros 400 caracteres saem do banco; a tela desfoca o fim.
create or replace function public.ver_trecho_convite(chave text)
returns table (sonho_titulo text, sonho_trecho text)
language sql stable security definer set search_path = public as $$
  select coalesce(s.titulo, ''), coalesce(left(s.texto, 400), '')
  from public.convites c
  join public.sonhos s on s.id = c.sonho_id and s.user_id = c.dono_id and s.apagado_em is null
  where c.token = chave;
$$;
revoke all on function public.ver_trecho_convite(text) from public;
grant execute on function public.ver_trecho_convite(text) to anon, authenticated;

-- 12. Terapeuta ---------------------------------------------------------------
-- Uma pessoa em "Pessoas com acesso" pode ser marcada como terapeuta. Marcar
-- "Levar para a próxima sessão" num sonho já compartilha o sonho com essa pessoa.
alter table public.compartilhamentos add column if not exists eh_terapeuta boolean not null default false;
create unique index if not exists compartilhamentos_um_terapeuta on public.compartilhamentos (dono_id) where eh_terapeuta;

-- 13. Comentários ---------------------------------------------------------------
-- Quem recebeu um sonho comenta nele. Cada pessoa tem a sua conversa com o dono
-- (leitor_email): o dono vê e responde; outra pessoa que vê o mesmo sonho não vê.
-- "privado": nota só para quem escreveu (o dono do sonho não vê).
create table if not exists public.comentarios (
  id            uuid primary key default gen_random_uuid(),
  sonho_id      uuid not null references public.sonhos (id) on delete cascade,
  dono_id       uuid not null references auth.users (id) on delete cascade,
  leitor_email  text not null check (leitor_email = lower(leitor_email)),
  autor_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  autor_nome    text not null default '',
  autor_foto    text not null default '',
  texto         text not null check (length(trim(texto)) > 0 and length(texto) <= 5000),
  privado       boolean not null default false,
  visto         boolean not null default false,  -- a outra ponta da conversa já viu
  criado_em     timestamptz not null default now(),
  editado_em    timestamptz
);
create index if not exists comentarios_sonho on public.comentarios (sonho_id, criado_em);
create index if not exists comentarios_dono on public.comentarios (dono_id) where not privado;
create index if not exists comentarios_leitor on public.comentarios (leitor_email);

-- Vejo este sonho porque foi compartilhado comigo (aprovado, fora da lixeira)?
create or replace function public.vejo_sonho(sonho uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sonhos s
    join public.compartilhamentos c on c.dono_id = s.user_id
    where s.id = sonho and not c.pendente and s.apagado_em is null
      and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and c.convidado_email = any (s.compartilhado_com)
  );
$$;
revoke all on function public.vejo_sonho(uuid) from public, anon;
grant execute on function public.vejo_sonho(uuid) to authenticated;

-- Quem escreve, o dono e o nome/foto vêm do banco, não do aparelho.
create or replace function public.comentarios_preencher()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p public.perfis;
begin
  new.autor_id := auth.uid();
  select user_id into new.dono_id from public.sonhos where id = new.sonho_id;
  if new.dono_id is null then raise exception 'Sonho não encontrado.'; end if;
  if new.autor_id <> new.dono_id then
    new.leitor_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  else
    new.privado := false; -- o dono anota nas amplificações
  end if;
  select * into p from public.perfis where id = auth.uid();
  new.autor_nome := coalesce(p.nome, '');
  new.autor_foto := coalesce(p.foto, '');
  new.visto := false;
  new.criado_em := now();
  return new;
end;
$$;
drop trigger if exists comentarios_preencher on public.comentarios;
create trigger comentarios_preencher before insert on public.comentarios
  for each row execute function public.comentarios_preencher();

-- Ao editar, só o texto e o "privado" mudam; quem lê volta a ver como novo.
create or replace function public.comentarios_editar()
returns trigger
language plpgsql set search_path = public as $$
begin
  new.sonho_id := old.sonho_id; new.dono_id := old.dono_id; new.leitor_email := old.leitor_email;
  new.autor_id := old.autor_id; new.autor_nome := old.autor_nome; new.autor_foto := old.autor_foto;
  new.criado_em := old.criado_em;
  if old.autor_id = new.dono_id then new.privado := false; end if;
  if auth.uid() = old.autor_id then
    if new.texto is distinct from old.texto then new.editado_em := now(); new.visto := false;
    else new.visto := old.visto; new.editado_em := old.editado_em; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists comentarios_editar on public.comentarios;
create trigger comentarios_editar before update on public.comentarios
  for each row execute function public.comentarios_editar();

alter table public.comentarios enable row level security;

drop policy if exists "comentarios: ler" on public.comentarios;
create policy "comentarios: ler" on public.comentarios
  for select using (
    autor_id = auth.uid()
    or (not privado and dono_id = auth.uid())
    or (not privado and leitor_email = lower(coalesce(auth.jwt() ->> 'email', '')) and public.vejo_sonho(sonho_id))
  );

-- Quem recebeu comenta (ou anota só para si); o dono responde na conversa de cada pessoa.
drop policy if exists "comentarios: escrever" on public.comentarios;
create policy "comentarios: escrever" on public.comentarios
  for insert with check (
    autor_id = auth.uid() and (
      (dono_id <> auth.uid() and public.vejo_sonho(sonho_id))
      or (dono_id = auth.uid() and not privado and exists (
            select 1 from public.comentarios o
            where o.sonho_id = comentarios.sonho_id and o.leitor_email = comentarios.leitor_email and not o.privado))
    )
  );

drop policy if exists "comentarios: editar o meu" on public.comentarios;
create policy "comentarios: editar o meu" on public.comentarios
  for update using (autor_id = auth.uid()) with check (autor_id = auth.uid());

-- Apaga quem escreveu; o dono também pode tirar comentários do próprio sonho.
drop policy if exists "comentarios: apagar" on public.comentarios;
create policy "comentarios: apagar" on public.comentarios
  for delete using (autor_id = auth.uid() or (not privado and dono_id = auth.uid()));

-- Marca como vistos os comentários da outra ponta, ao abrir o sonho.
create or replace function public.ver_comentarios(sonho uuid)
returns void
language sql security definer set search_path = public as $$
  update public.comentarios c set visto = true
   where c.sonho_id = sonho and not c.visto and not c.privado and c.autor_id <> auth.uid()
     and (c.dono_id = auth.uid()
          or (c.leitor_email = lower(coalesce(auth.jwt() ->> 'email', '')) and public.vejo_sonho(sonho)));
$$;
revoke all on function public.ver_comentarios(uuid) from public, anon;
grant execute on function public.ver_comentarios(uuid) to authenticated;

-- 14. Criptografia de ponta a ponta --------------------------------------------
-- Cada pessoa tem um par de chaves. A chave privada só chega ao banco trancada pela
-- frase-senha (e, à parte, pelo código de recuperação): o banco nunca vê a frase-senha.
-- Cada sonho tem a própria chave, guardada embrulhada para o dono (sonhos.chave_dono) e para
-- cada pessoa que recebeu o sonho (chaves_sonhos). Título, relato, temas e amplificações
-- ficam em "cifrado" e "cifrado_amp"; as colunas antigas ficam vazias nos sonhos trancados.
-- Rode antes de publicar a versão do app com a frase-senha. Pode rodar de novo.
create table if not exists public.chaves (
  user_id              uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  email                text not null unique check (email = lower(email)),
  publica              text not null,
  privada_senha        jsonb not null,
  privada_recuperacao  jsonb not null,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);
alter table public.chaves enable row level security;
drop policy if exists "chaves: a minha" on public.chaves;
create policy "chaves: a minha" on public.chaves
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id and email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Das outras pessoas, só a chave pública (para embrulhar a chave de um sonho para elas).
create or replace function public.chaves_publicas(emails text[])
returns table (email text, publica text)
language sql stable security definer set search_path = public as $$
  select k.email, k.publica from public.chaves k where k.email = any (emails);
$$;
revoke all on function public.chaves_publicas(text[]) from public, anon;
grant execute on function public.chaves_publicas(text[]) to authenticated;

alter table public.sonhos add column if not exists cifrado     text;
alter table public.sonhos add column if not exists cifrado_amp text;
alter table public.sonhos add column if not exists chave_dono  text; -- não "chave": as funções do convite já têm um parâmetro com esse nome

create table if not exists public.chaves_sonhos (
  sonho_id   uuid not null references public.sonhos (id) on delete cascade,
  email      text not null check (email = lower(email)),
  chave      text not null,
  criado_em  timestamptz not null default now(),
  primary key (sonho_id, email)
);
alter table public.chaves_sonhos enable row level security;
-- O dono entrega e tira as chaves dos próprios sonhos.
drop policy if exists "chaves_sonhos: dono" on public.chaves_sonhos;
create policy "chaves_sonhos: dono" on public.chaves_sonhos
  for all using (exists (select 1 from public.sonhos s where s.id = sonho_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sonhos s where s.id = sonho_id and s.user_id = auth.uid()));
-- Quem recebeu vê a própria chave e, se abriu um link com a chave, guarda ela para si.
-- A chave sozinha não mostra nada: o sonho trancado só sai do banco para quem tem acesso.
drop policy if exists "chaves_sonhos: a minha" on public.chaves_sonhos;
create policy "chaves_sonhos: a minha" on public.chaves_sonhos
  for all using (email = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Quem já tem frase-senha e ainda não recebeu a chave de um sonho meu compartilhado com ela.
create or replace function public.chaves_faltando()
returns table (sonho_id uuid, email text, publica text, chave_dono text)
language sql stable security definer set search_path = public as $$
  select s.id, e.email, k.publica, s.chave_dono
  from public.sonhos s
  cross join lateral unnest(s.compartilhado_com) as e(email)
  join public.chaves k on k.email = e.email
  where s.user_id = auth.uid() and s.cifrado is not null and s.chave_dono is not null and s.apagado_em is null
    and not exists (select 1 from public.chaves_sonhos cs where cs.sonho_id = s.id and cs.email = e.email);
$$;
revoke all on function public.chaves_faltando() from public, anon;
grant execute on function public.chaves_faltando() to authenticated;

-- Sonhos compartilhados comigo agora vêm trancados, com a minha chave.
-- As amplificações trancadas só saem se o dono deixou ver, como antes.
drop function if exists public.sonhos_compartilhados(uuid);
create function public.sonhos_compartilhados(dono uuid)
returns table (
  id uuid, sonhado_em timestamptz, atualizado_em timestamptz, titulo text, texto text,
  temas text[], status text, cor text, conclusoes jsonb, levar_sessao boolean, audio jsonb, imagens jsonb,
  cifrado text, cifrado_amp text, chave text
)
language sql stable security definer set search_path = public as $$
  select s.id, s.sonhado_em, s.atualizado_em, s.titulo, s.texto, s.temas, s.status, s.cor,
         case when c.ver_amplificacoes then s.conclusoes else '[]'::jsonb end,
         s.levar_sessao, s.audio, s.imagens,
         s.cifrado,
         case when c.ver_amplificacoes then s.cifrado_amp else null end,
         cs.chave
  from public.sonhos s
  join public.compartilhamentos c on c.dono_id = s.user_id
  left join public.chaves_sonhos cs on cs.sonho_id = s.id and cs.email = c.convidado_email
  where s.user_id = dono and not c.pendente and s.apagado_em is null
    and c.convidado_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and c.convidado_email = any (s.compartilhado_com)
  order by s.sonhado_em desc;
$$;
revoke all on function public.sonhos_compartilhados(uuid) from public, anon;
grant execute on function public.sonhos_compartilhados(uuid) to authenticated;

-- O começo do sonho no link: de um sonho trancado, o banco não tem o que mostrar.
-- O app guarda no convite uma prévia trancada, que só abre com a chave que vai no "#" do link.
create or replace function public.ver_trecho_convite(chave text)
returns table (sonho_titulo text, sonho_trecho text)
language sql stable security definer set search_path = public as $$
  select coalesce(s.titulo, ''), coalesce(left(s.texto, 400), '')
  from public.convites c
  join public.sonhos s on s.id = c.sonho_id and s.user_id = c.dono_id and s.apagado_em is null
  where c.token = $1 and s.cifrado is null;
$$;

alter table public.convites add column if not exists previa text;
create or replace function public.ver_previa_convite(chave text)
returns text
language sql stable security definer set search_path = public as $$
  select c.previa
  from public.convites c
  join public.sonhos s on s.id = c.sonho_id and s.user_id = c.dono_id and s.apagado_em is null
  where c.token = $1;
$$;
revoke all on function public.ver_previa_convite(text) from public;
grant execute on function public.ver_previa_convite(text) to anon, authenticated;

-- Comentários trancados ficam maiores que o texto original.
alter table public.comentarios drop constraint if exists comentarios_texto_check;
alter table public.comentarios add constraint comentarios_texto_check
  check (length(trim(texto)) > 0 and length(texto) <= 12000);

-- 15. Nível de criptografia: básica (padrão) ou avançada ----------------------
-- Básica: a pessoa só cria a frase-senha. O código de recuperação é guardado pela
-- função "recuperacao", trancado com uma chave do servidor, e devolvido só para a
-- própria conta quando ela esquece a frase-senha.
-- Avançada: só a pessoa guarda o código; o servidor não tem cópia.
alter table public.chaves add column if not exists modo text not null default 'avancado' -- o app sempre manda o modo
  check (modo in ('basico', 'avancado'));

create table if not exists public.recuperacoes (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  codigo      text not null,               -- trancado pela função "recuperacao"
  criado_em   timestamptz not null default now()
);
-- Sem nenhuma regra de acesso: só a função (com a chave de serviço) lê e grava.
alter table public.recuperacoes enable row level security;

-- 16. Convites para o Sonhário: de terapeuta, de paciente e de amigo -----------
-- Nenhum convite mostra sonho: só liga as pessoas. Cada um continua escolhendo,
-- um sonho por vez, o que mostrar. Todos abrem em /terapeuta/:token.
--   terapeuta: link fixo de quem atende. Quem entra fica com essa pessoa como terapeuta.
--   paciente:  link de quem registra, para o próprio terapeuta. Vale uma vez.
--   amigo:     link fixo. Quem entra e quem convidou aparecem um para o outro.
-- Usa a marcação eh_terapeuta do bloco 12. Pode rodar de novo.

-- null: ainda não respondeu; true: também atende pacientes; false: só registra os sonhos.
alter table public.perfis add column if not exists atende boolean;

create table if not exists public.convites_terapeuta (
  token      text primary key,
  tipo       text not null default 'terapeuta' check (tipo in ('terapeuta', 'paciente', 'amigo')),
  dono_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dono_nome  text not null default '',
  dono_email text not null default '',
  criado_em  timestamptz not null default now(),
  unique (dono_id, tipo)
);
alter table public.convites_terapeuta enable row level security;
drop policy if exists "convites_terapeuta: o meu" on public.convites_terapeuta;
create policy "convites_terapeuta: o meu" on public.convites_terapeuta
  for all using (auth.uid() = dono_id) with check (auth.uid() = dono_id);

-- O que aparece antes de entrar: quem convidou e o tipo de convite.
drop function if exists public.ver_convite_terapeuta(text);
create function public.ver_convite_terapeuta(chave text)
returns table (dono_nome text, dono_foto text, tipo text)
language sql stable security definer set search_path = public as $$
  select c.dono_nome, coalesce(p.foto, ''), c.tipo
  from public.convites_terapeuta c left join public.perfis p on p.id = c.dono_id
  where c.token = chave;
$$;
revoke all on function public.ver_convite_terapeuta(text) from public;
grant execute on function public.ver_convite_terapeuta(text) to anon, authenticated;

-- Liga "de" a "para" em Pessoas com acesso, sem nenhum sonho. terapeuta: marca "para" como
-- o terapeuta de "de" (só um por vez: quem era antes deixa de ser). Devolve se já estavam ligados.
create or replace function public.ligar_pessoas(de uuid, de_nome text, de_email text, para_email text, para_nome text, terapeuta boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  ja public.compartilhamentos;
begin
  if terapeuta then
    update public.compartilhamentos set eh_terapeuta = false
     where dono_id = de and eh_terapeuta and convidado_email <> para_email;
  end if;
  select * into ja from public.compartilhamentos where dono_id = de and convidado_email = para_email;
  if found then
    update public.compartilhamentos
       set pendente = false, eh_terapeuta = eh_terapeuta or terapeuta
     where id = ja.id;
    return case when terapeuta then ja.eh_terapeuta and not ja.pendente else not ja.pendente end;
  end if;
  insert into public.compartilhamentos (dono_id, dono_nome, dono_email, convidado_email, convidado_nome, papel, escopo, ver_amplificacoes, pendente, eh_terapeuta)
  values (de, de_nome, de_email, para_email, para_nome, case when terapeuta then 'terapeuta' else 'amigo' end, 'escolhidos', false, false, terapeuta);
  return false;
end;
$$;
revoke all on function public.ligar_pessoas(uuid, text, text, text, text, boolean) from public, anon, authenticated;

drop function if exists public.aceitar_convite_terapeuta(text);
create function public.aceitar_convite_terapeuta(chave text)
returns table (dono_nome text, tipo text, ja_estava boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  cv public.convites_terapeuta;
  meu_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  meta jsonb := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  meu_nome text;
  estava boolean := false;
  estava2 boolean;
begin
  if auth.uid() is null or meu_email = '' then raise exception 'Entre com Google para aceitar o convite.'; end if;
  select * into cv from public.convites_terapeuta c where c.token = chave;
  if not found then raise exception 'Esse link não existe mais. Peça um novo.'; end if;
  if cv.dono_id = auth.uid() then raise exception 'Esse link é seu. Mande para quem você quer convidar.'; end if;

  meu_nome := coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), split_part(meu_email, '@', 1));
  insert into public.perfis (id, email, nome, foto)
  values (auth.uid(), meu_email, meu_nome, coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''))
  on conflict (id) do nothing;

  if cv.tipo = 'terapeuta' then
    -- Quem entra é paciente: quem convidou vira o seu terapeuta.
    update public.perfis set atende = coalesce(atende, false) where id = auth.uid();
    estava := public.ligar_pessoas(auth.uid(), meu_nome, meu_email, lower(cv.dono_email), cv.dono_nome, true);
  elsif cv.tipo = 'paciente' then
    -- Quem entra é o terapeuta de quem convidou. O link vale uma vez.
    update public.perfis set atende = true where id = auth.uid();
    estava := public.ligar_pessoas(cv.dono_id, cv.dono_nome, lower(cv.dono_email), meu_email, meu_nome, true);
    delete from public.convites_terapeuta c where c.token = chave;
  else
    -- Amigo: os dois aparecem um para o outro.
    update public.perfis set atende = coalesce(atende, false) where id = auth.uid();
    estava := public.ligar_pessoas(cv.dono_id, cv.dono_nome, lower(cv.dono_email), meu_email, meu_nome, false);
    estava2 := public.ligar_pessoas(auth.uid(), meu_nome, meu_email, lower(cv.dono_email), cv.dono_nome, false);
    estava := estava and estava2;
  end if;
  return query select cv.dono_nome, cv.tipo, estava;
end;
$$;
revoke all on function public.aceitar_convite_terapeuta(text) from public, anon;
grant execute on function public.aceitar_convite_terapeuta(text) to authenticated;

-- 17. Laboratório onírico -------------------------------------------------------
-- Quem digitou a senha na busca vê as observações extras (só as do próprio acervo).
alter table public.perfis add column if not exists laboratorio boolean;

-- 18. Comentários sobre um tema ------------------------------------------------
-- Na página de um tema (/app/acervo?tema=X), a pessoa escreve o que pensa sobre aquele tema.
-- Só quem escreveu vê. Com a frase-senha, o tema e o texto vão trancados em "cifrado"
-- (com a chave da nota embrulhada para a dona em "chave_dono"); "tema" e "texto" ficam vazios.
-- Pode rodar de novo.
create table if not exists public.notas_tema (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tema          text not null default '',
  texto         text not null default '' check (length(texto) <= 5000),
  cifrado       text,
  chave_dono    text,
  criado_em     timestamptz not null default now(),
  editado_em    timestamptz
);
create index if not exists notas_tema_user on public.notas_tema (user_id, criado_em);
alter table public.notas_tema enable row level security;
drop policy if exists "notas_tema: só a dona" on public.notas_tema;
create policy "notas_tema: só a dona" on public.notas_tema
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
