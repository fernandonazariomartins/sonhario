# Sonhário

Um caderno para lembrar, organizar e voltar aos seus sonhos. Mesmo padrão do Torvilo: React + Vite, login com Google pelo Supabase, publicado na Vercel e instalável no celular pelo próprio site (sem loja de aplicativos).

## O que já funciona

- **Abre gravando:** `/app` abre direto na tela de captura, com caixa de texto e gravador. Onde o navegador permite (Chrome no Android e no computador), a fala vira texto enquanto a pessoa fala.
- **Sem conta ou com Google:** a primeira vez pergunta se quer entrar com Google ou continuar sem conta. Sem conta, tudo fica no aparelho. Ao entrar depois, os sonhos (e os áudios) vão para a conta: "N sonhos levados para a sua conta", como no Torvilo.
- **Acervo:** mural (estilo Keep), lista (estilo Notion), calendário e temas, com uma linha do tempo por ano e mês no lugar dos números de página, com busca, filtro por tema e "só dar atenção".
- **Sonho aberto:** título, relato, áudio, temas, status (não aberto, aberto, dar atenção), cor no mural, "Amplificações" (com data e "sozinho" ou "na sessão") e "levar para a próxima sessão". Salva sozinho.
- **Importar:** .zip do Notion (reconhece o template Meu Sonhário), notas do Google Keep (o .zip do Takeout ou os .json, escolhendo os marcadores) e texto/Markdown (um sonho por título `##` ou por data). As imagens e os áudios das notas entram junto: no Keep pelos anexos do Takeout; no Notion e no Markdown pelos links do .md (ex.: um .zip com `Sonhos.md` e a pasta `anexos`). Vale a data de criação da nota. O áudio .3gp do Keep vira .wav quando o navegador consegue abrir; senão sobe como veio. Sonho que já tinha entrado sem os anexos é completado com eles. Precisa do bloco 10 do `supabase/schema.sql`.
- **Imagens no sonho:** miniaturas que abrem grandes, com "Adicionar imagem" e "tirar". Quem recebe o sonho compartilhado também vê.
- **Home** em `/`, com a assinatura "Um projeto de Fernando Martins" e o depoimento.
- **Captura para quem está meio dormindo:** um toque grava (o botão inteiro é a área de toque). Tocar de novo para e guarda. Guarda sozinho depois de 10 s de silêncio ou quando a tela bloqueia. Data editável ("mudar") e título opcional, sem título automático. Depois de guardar, tela de confirmação com "Ir para o acervo", "Registrar outro sonho" e "Dar título e temas".
- **Botão + flutuante** em todas as telas fora da captura.
- **Observações** (`/app/observacoes`): Circum-ambulação, Constelação, Latência, Complexo, Enantiodromia e Energia psíquica. Cada um desbloqueia quando há dados suficientes.
- **Contribuir com uma ideia** (menu ⋯, rodapé do app e da home): a mensagem vai para o e-mail do Fernando.
- **Compartilhar com terapeuta ou amigos:** sempre um sonho por vez, nunca o caderno inteiro. Botão "Compartilhar" no sonho (escolhe a pessoa, com nome e foto do Google) e menu ⋯ › Pessoas com acesso. Quem foi convidado entra com Google e ganha a aba Pacientes/Amigos, só leitura. Também gera o **link de um sonho**: pode ir para várias pessoas, e cada uma que abrir e entrar com Google vira um pedido para aprovar. Precisa dos blocos 6 e 7 do `supabase/schema.sql`.
- **Comentários** nos sonhos compartilhados: quem recebe comenta (só o dono vê) ou guarda uma nota privada (só quem escreveu vê). O dono vê a conversa de cada pessoa no sonho, responde, e o mural e a lista mostram o balão com o número (azul quando há comentário novo). Precisa do bloco 13 do `supabase/schema.sql`.
- **Convites para o Sonhário:** no primeiro acesso (fora da tela de gravação) o app pergunta se a pessoa só registra os sonhos ou também atende pacientes; dá para mudar no menu ⋯ › Atendo pacientes. Três convites, todos em `/terapeuta/:token`, que ligam as pessoas sem mostrar nenhum sonho: **Convidar meu paciente** (aba Pacientes, link fixo para todos; quem entra fica com quem convidou como terapeuta), **Convidar meu terapeuta** (Pessoas com acesso e no sonho, junto de "Levar para a próxima sessão"; vale uma vez, e quem entra vira o terapeuta) e **Convidar um amigo** (Pessoas com acesso e aba Compartilhados; os dois aparecem um para o outro). Antes de entrar, quem abre o convite pode ver os recursos num tour com sonhos de exemplo. Precisa do bloco 16 do `supabase/schema.sql`.
- **Lixeira** (menu ⋯ › Lixeira): apagar um sonho manda para a lixeira, com "Desfazer" na hora. Lá ele fica 7 dias e dá para restaurar; depois some de vez, com o áudio. Precisa do bloco 8 do `supabase/schema.sql`.
- **Lembrete da manhã** (menu ⋯): notificação "Sonhou? Registre." na hora em que a pessoa acorda.
- **Criptografia de ponta a ponta:** com conta, a pessoa cria uma frase-senha e recebe um código de recuperação. Título, relato, temas, amplificações, áudios, imagens e comentários saem do aparelho trancados (Web Crypto: RSA-OAEP para as chaves, AES-GCM para o conteúdo, PBKDF2 para a frase-senha); o banco guarda só texto embaralhado. Cada sonho tem a própria chave, embrulhada para o dono e para cada pessoa que recebe o sonho (a entrega acontece quando o dono abre o app). O link de um sonho leva a chave depois do `#`, que não chega ao servidor. Num aparelho novo, registrar funciona antes de digitar a frase-senha; para ler, pede uma vez. Sonhos de antes ficam legíveis até a pessoa tocar em "trancar" (com cópia de segurança antes). Temas por IA e transcrição no servidor ficam desligados até a pessoa ligar (menu ⋯ › Inteligência artificial). Precisa do bloco 14 do `supabase/schema.sql`. Código em `src/lib/cripto.js` e `src/lib/cofre.js`. **Níveis:** o básico (padrão) guarda uma cópia trancada do código de recuperação pela função `recuperacao` do Supabase, e quem esquece a frase-senha só cria outra; no avançado, só a pessoa guarda o código. Muda em ⋯ › Criptografia. Precisa do bloco 15 e da função `recuperacao` publicada.

- **Demonstração** (`/demo`, ex.: `https://sonhario-flame.vercel.app/demo`): link para mostrar o app a quem não tem conta. Abre o sonho “O porão alagado” e libera tudo com dados inventados: 68 sonhos em 3 anos (todas as Observações destravadas), mural, lista, calendário, temas, amplificações, imagens, comentários de uma terapeuta e de um amigo, um pedido de link para aprovar e sonhos que uma amiga compartilhou. Dá para mexer em tudo, inclusive gravar e importar, mas nada é salvo: o banco é uma imitação na memória (`src/lib/demo.js`, dados em `src/lib/demoDados.js`), recarregar volta ao começo e a conta de quem abre não é tocada. Vale só para a aba aberta pelo link; “Começar o meu” ou ⋯ › Sair da demonstração voltam ao site normal. Lembrete da manhã e IA ficam desligados.

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
5. **Tirar o endereço do Supabase da tela do Google.** O app usa o botão oficial do Google, que faz o login aqui no site:
   - No cliente OAuth "Sonhario web", em **Origens JavaScript autorizadas**, adicione `https://sonhario-flame.vercel.app` e `http://localhost:5173`.
   - Na Vercel, adicione `VITE_GOOGLE_CLIENT_ID` com o Client ID desse cliente e faça um novo deploy.
   - Sem essa variável (ou no iPhone com o app instalado), o login volta a ser o antigo, por redirecionamento.
   - Em **Google Auth Platform › Branding**, preencha nome, logo, página inicial e política de privacidade (`/privacidade`) e peça a verificação da marca, para a tela mostrar "Sonhário" com o logo.

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

### 6b. Temas sugeridos por IA (opcional, ≈ 2 min)
Em "Temas automáticos", além dos seus temas e do dicionário de símbolos, uma IA propõe temas novos a partir do relato (custo de frações de centavo por sonho). Usa o mesmo `OPENAI_API_KEY` do item 6.
1. `supabase functions deploy sugerir-temas`

Sem essa função, a janela mostra só os seus temas e os símbolos do dicionário.

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
  pages/              Home, Entrar, Captura, Acervo, Sonho, Observações (Insights.jsx), Importar
supabase/schema.sql   tabelas, regras de acesso (RLS), bucket de áudios e lembretes
supabase/functions/   transcrever, lembrete-manha
public/               manifest, ícones e service worker (instalação pelo site)
```

## Observações

- A transcrição ao vivo usa o reconhecimento de voz do próprio navegador. No iPhone (Safari) ela pode não funcionar; o áudio é gravado do mesmo jeito.
- Os sonhos e áudios ficam protegidos por RLS: cada pessoa só acessa os próprios.
- A ilustração da escada (Charlotte Taylor) não entrou no app, porque usá-la num produto publicado exige autorização da artista.
