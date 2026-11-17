# Sonhário

Um caderno para lembrar, organizar e voltar aos seus sonhos. Mesmo padrão do Torvilo: React + Vite, login com Google pelo Supabase, publicado na Vercel e instalável no celular pelo próprio site (sem loja de aplicativos).

## O que já funciona

- **Abre gravando:** `/app` abre direto na tela de captura, com caixa de texto e gravador. Onde o navegador permite (Chrome no Android e no computador), a fala vira texto enquanto a pessoa fala.
- **Sem conta ou com Google:** a primeira vez pergunta se quer entrar com Google ou continuar sem conta. Sem conta, tudo fica no aparelho. Ao entrar depois, os sonhos (e os áudios) vão para a conta: "N sonhos levados para a sua conta", como no Torvilo.
- **Acervo:** mural (estilo Keep), lista (estilo Notion) e temas, com busca, filtro por tema e "só dar atenção".
- **Sonho aberto:** título, relato, áudio, temas, status (não aberto, aberto, dar atenção), cor no mural, "Amplificações" (com data e "sozinho" ou "na sessão") e "levar para a próxima sessão". Salva sozinho.
- **Importar:** CSV do Notion (reconhece o template Meu Sonhário), notas do Google Keep (Takeout, .json, escolhendo os marcadores) e texto/Markdown com datas.
- **Home** em `/`, com a assinatura "Um projeto de Fernando Martins".

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
Dá para reaproveitar a credencial OAuth que o Torvilo já usa no Google Cloud.
1. Em https://console.cloud.google.com › **APIs e serviços › Credenciais**, abra o **ID do cliente OAuth** do Torvilo.
2. Em **URIs de redirecionamento autorizados**, adicione: `https://SEU-PROJETO.supabase.co/auth/v1/callback` (a Project URL do passo 2 + `/auth/v1/callback`). Salve.
3. No Supabase do Sonhário: **Authentication › Sign In / Providers › Google** › ative, cole o **Client ID** e o **Client Secret** dessa credencial e salve.
4. Ainda no Supabase: **Authentication › URL Configuration**:
   - **Site URL:** o endereço do Sonhário na Vercel (ex.: `https://sonhario.vercel.app`).
   - **Redirect URLs:** `https://sonhario.vercel.app/app` e `http://localhost:5173/app`.

### 4. Publicar na Vercel (≈ 3 min)
1. Suba esta pasta para um repositório no GitHub (ex.: `sonhario`).
2. Na Vercel: **Add New › Project**, escolha o repositório. Framework: Vite (detecta sozinho).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. O `vercel.json` já cuida das rotas `/app`.

### 5. Links da Amazon
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
  lib/tipografia.js   sem viúvas nem palavras curtas no fim da linha
  pages/              Home, Entrar, Captura, Acervo, Sonho, Importar
supabase/schema.sql   tabelas, regras de acesso (RLS) e bucket de áudios
public/               manifest, ícones e service worker (instalação pelo site)
```

## Observações

- A transcrição ao vivo usa o reconhecimento de voz do próprio navegador. No iPhone (Safari) ela pode não funcionar; o áudio é gravado do mesmo jeito.
- Os sonhos e áudios ficam protegidos por RLS: cada pessoa só acessa os próprios.
- A ilustração da escada (Charlotte Taylor) não entrou no app, porque usá-la num produto publicado exige autorização da artista.
