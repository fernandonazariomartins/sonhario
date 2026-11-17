# Sonhário

Um caderno para lembrar, organizar e voltar aos seus sonhos. Mesmo padrão do Torvilo: React + Vite, login com Google pelo Supabase, publicado na Vercel e instalável no celular pelo próprio site (sem loja de aplicativos).

## O que já funciona

- **Abre gravando:** `/app` abre direto na tela de captura, com caixa de texto e gravador. Onde o navegador permite (Chrome no Android e no computador), a fala vira texto enquanto a pessoa fala.
- **Sem conta ou com Google:** a primeira vez pergunta se quer entrar com Google ou continuar sem conta. Sem conta, tudo fica no aparelho. Ao entrar depois, os sonhos (e os áudios) vão para a conta: "N sonhos levados para a sua conta", como no Torvilo.
- **Acervo:** mural (estilo Keep), lista (estilo Notion) e temas, com busca, filtro por tema e "só dar atenção".
- **Sonho aberto:** título, relato, áudio, temas, status (não aberto, aberto, dar atenção), cor no mural, "Amplificações" (com data e "sozinho" ou "na sessão") e "levar para a próxima sessão". Salva sozinho.
- **Importar:** CSV do Notion (reconhece o template Meu Sonhário), notas do Google Keep (Takeout, .json, escolhendo os marcadores) e texto/Markdown com datas.
- **Home** em `/`, com a assinatura "Um projeto de Fernando Martins" e o depoimento.
- **Captura para quem está meio dormindo:** um toque grava (o botão inteiro é a área de toque). Tocar de novo para e guarda. Guarda sozinho depois de 10 s de silêncio ou quando a tela bloqueia. Data editável ("mudar") e título opcional, sem título automático. Depois de guardar, tela de confirmação com "Ir para o acervo", "Registrar outro sonho" e "Dar título e temas".
- **Botão + flutuante** em todas as telas fora da captura.
- **Insights** (`/app/insights`): Circum-ambulação, Constelação, Latência, Complexo, Enantiodromia e Energia psíquica. Cada um desbloqueia quando há dados suficientes.
- **Contribuir com uma ideia** (menu ⋯, rodapé do app e da home): a mensagem vai para o e-mail do Fernando.
- **Compartilhar com terapeuta ou amigos:** botão "Compartilhar" no sonho (escolhe a pessoa, com nome e foto do Google) e menu ⋯ para gerenciar quem tem acesso. Quem foi convidado entra com Google e ganha a aba Pacientes/Amigos, só leitura. Precisa do bloco 6 do `supabase/schema.sql`.
- **Lembrete da manhã** (menu ⋯): notificação "Sonhou? Registre." na hora em que a pessoa acorda.

## Rodar no computador

```bash
npm install
# o arquivo .env já aponta para o projeto "sonhario" no Supabase
npm run dev
```

Sem o `.env.local`, o app roda inteiro no modo sem conta.

## Colocar no ar: passo a passo

### 1. Criar o projeto no Supabase (≈ 3 min)
1. Em https://supabase.com/dashboard, clique em **New project** na mesma organização do Torvilo.
2. Nome: `sonhario`. Região: **South America (São Paulo)**. Gere uma senha do banco e guarde num gerenciador de senhas.
3. Espere o projeto ficar pronto.

> O plano gratuito permite 2 projetos ativos por organização: Torvilo + Sonhário cabem.

### 2. Criar as tabelas (≈ 1 min)
1. No projeto, abra **SQL Editor** › **New query**.
2. Cole todo o arquivo `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings › API**, copie a **Project URL** e a chave **anon public**. Elas vão no `.env.local` e na Vercel como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### 3. Login com Google (≈ 5 min)
O Sonhário tem projeto próprio no Google Cloud (**Sonhario**, ID `sonhario-515000`), separado do Torvilo.
1. Google Auth Platform: app "Sonhário", público Externo. Cliente OAuth Web "Sonhario web" com o redirecionamento `https://sburmejkmlkmzijmrpqr.supabase.co/auth/v1/callback`.
2. No Supabase: **Authentication › Sign In / Providers › Google** ativado com o Client ID e o Client Secret desse cliente.
3. Para qualquer pessoa entrar, publique o app em **Google Auth Platform › Público-alvo › Publicar app** (enquanto estiver em teste, só usuários de teste entram).
4. Ainda no Supabase: **Authentication › URL Configuration**:
   - **Site URL:** o endereço do Sonhário na Vercel (ex.: `https://sonhario.vercel.app`).
   - **Redirect URLs:** `https://sonhario.vercel.app/app` e `http://localhost:5173/app`.

### 4. Publicar na Vercel (≈ 3 min)
1. Suba esta pasta para um repositório no GitHub (ex.: `sonhario`).
2. Na Vercel: **Add New › Project**, escolha o repositório. Framework: Vite (detecta sozinho).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. O `vercel.json` já cuida das rotas `/app`.

### 5. Contribuir com uma ideia (≈ 1 min)
1. Em https://web3forms.com, informe `fernandonazariomartins@outlook.com` e copie a **Access Key** que chega no e-mail.
2. Na Vercel, adicione `VITE_WEB3FORMS_KEY` com essa chave e faça um novo deploy.

Sem a chave, o botão abre o app de e-mail da pessoa com a mensagem pronta.

### 6. Transcrever depois de gravar (opcional, ≈ 5 min)
No Chrome (Android e computador) a fala vira texto ao vivo, de graça. No iPhone isso nem sempre funciona; a função `transcrever` resolve, usando a OpenAI (cerca de US$ 0,003 por minuto de áudio).
1. Instale a CLI: `npm i -g supabase` e rode `supabase login` e `supabase link --project-ref sburmejkmlkmzijmrpqr`.
2. `supabase secrets set OPENAI_API_KEY=sk-...`
3. `supabase functions deploy transcrever`
4. Na Vercel, adicione `VITE_TRANSCRICAO=1` e faça um novo deploy.

Funciona para quem entrou com Google. Aparece também o botão "Transformar o áudio em texto" no sonho.

### 7. Lembrete da manhã (≈ 10 min)
1. Gere as chaves: `npx web-push generate-vapid-keys`.
2. `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... LEMBRETE_SEGREDO=uma-senha-qualquer`
3. `supabase functions deploy lembrete-manha --no-verify-jwt`
4. Rode de novo o `supabase/schema.sql` (cria a tabela `lembretes`). Depois, no SQL Editor, rode o bloco comentado do item 5 do arquivo, trocando `COLE_O_SEGREDO`.
5. Na Vercel, adicione `VITE_VAPID_PUBLIC_KEY` (a chave pública) e faça um novo deploy.

No iPhone, notificações só funcionam com o Sonhário instalado na tela inicial (iOS 16.4 ou mais novo).

### 8. Links da Amazon
Quando a conta do Associados Amazon for aprovada, troque `SEU-ID-20` pelo seu ID em `src/pages/Home.jsx` (constante `AMAZON_TAG`).

## Estrutura

```
src/
  main.jsx            rotas: / (home), /app (captura), /app/acervo, /app/sonho/:id, /app/importar
  lib/supabase.js     cliente e login com Google
  lib/estado.jsx      sessão, modo sem conta e migração para a conta
  lib/armazem.js      onde os sonhos moram (aparelho ou Supabase)
  lib/gravador.js     gravação de áudio e transcrição ao vivo
  lib/importar.js     Notion (CSV), Keep (JSON), texto/Markdown
  lib/insights.js     padrões do acervo (desbloqueiam com dados)
  lib/transcrever.js  transcrição no servidor depois de gravar
  lib/lembrete.js     inscrição no push do lembrete da manhã
  lib/contribuir.js   envio de ideias por e-mail
  lib/tipografia.js   sem viúvas nem palavras curtas no fim da linha
  pages/              Home, Entrar, Captura, Acervo, Sonho, Insights, Importar
supabase/schema.sql   tabelas, regras de acesso (RLS), bucket de áudios e lembretes
supabase/functions/   transcrever, lembrete-manha
public/               manifest, ícones e service worker (instalação pelo site)
```

## Observações

- A transcrição ao vivo usa o reconhecimento de voz do próprio navegador. No iPhone (Safari) ela pode não funcionar; o áudio é gravado do mesmo jeito.
- Os sonhos e áudios ficam protegidos por RLS: cada pessoa só acessa os próprios.
- A ilustração da escada (Charlotte Taylor) não entrou no app, porque usá-la num produto publicado exige autorização da artista.
