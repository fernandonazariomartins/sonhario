import { Fragment, useState } from 'react';
import Contribuir from '../components/Contribuir.jsx';
import BotaoInstalar from '../components/BotaoInstalar.jsx';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { Mic, Voltar, Avancar, Ok, Mensagem, Compartilhar, Cadeado, Pessoas, Play, Pausa } from '../components/Icones.jsx';
import { semViuvas as n } from '../lib/tipografia.js';
import './home.css';
import { tr, ingles, trocarIdioma } from '../lib/i18n.js';

// Troque pelo seu ID do Associados Amazon (termina em -20) quando a conta estiver aprovada.
const AMAZON_TAG = 'SEU-ID-20';
// Em inglês, o link de afiliado da Amazon Brasil não vale: busca a edição em inglês na amazon.com.
const amazon = (l) => (ingles ? 'https://www.amazon.com/s?k=' + encodeURIComponent(l.t + ' ' + l.a) : `https://www.amazon.com.br/dp/${l.asin}/?tag=${AMAZON_TAG}`);

const PASSOS = [
  [tr("Celular ao lado da cama"), tr("Ao acordar, antes de levantar, abra o Sonhário: ele já abre no gravador.")],
  [tr("Comece pela imagem"), tr("No começo parece que nada vem. Mas uma imagem, mesmo fraca, aparece. Toque em gravar e comece por ela.")],
  [tr("Deixe uma puxar a outra"), tr("Essa primeira lembrança puxa as outras. Fale o que vier, mesmo em frases soltas: o texto se forma sozinho.")],
  [tr("Uma semana depois"), tr("Os fragmentos viram relatos inteiros, às vezes com vários sonhos da mesma noite, todos guardados no seu acervo.")],
];

const ESTUDOS = [
  [tr("Lembrar mais"), tr("Manter um diário de sonhos é uma técnica clássica para aumentar a lembrança dos sonhos, principalmente em quem quase não se lembra deles."), tr("Schredl (2002), citado no International Journal of Dream Research"), 'https://journals.ub.uni-heidelberg.de/index.php/IJoDR/article/download/37498/pdf/136208'],
  [tr("Autoconhecimento"), tr("Grupos que conversaram sobre sonhos pelo método de Ullman relataram ganhos de compreensão pessoal comparáveis aos de um método conduzido por terapeuta."), tr("Edwards et al. (2013), Frontiers in Psychology"), 'https://doi.org/10.3389/fpsyg.2013.00979'],
  [tr("Criatividade"), tr("Quem lembra muitos sonhos teve notas mais altas de criatividade. É uma associação, não prova de causa."), tr("Vallat, Türker, Nicolas e Ruby (2022), Nature and Science of Sleep"), 'https://doi.org/10.2147/NSS.S342137'],
  [tr("Sono"), tr("Num diário de sonhos de cinco semanas com 149 pessoas, as noites com sonho lembrado tiveram sono mais longo e despertar mais descansado."), tr("Clocks & Sleep (2020), estudo com diário"), 'https://doi.org/10.3390/clockssleep2010007'],
  [tr("Empatia"), tr("Conversar sobre o sonho de alguém pelo método de Ullman aumentou a empatia de quem ouviu pela pessoa que contou o sonho."), tr("Blagrove et al. (2019), Frontiers in Psychology"), 'https://doi.org/10.3389/fpsyg.2019.01351'],
  [tr("Memória"), tr("Quem sonhou com uma tarefa de navegação durante um cochilo se saiu melhor nela depois. Pensar na tarefa acordado não teve o mesmo efeito."), tr("Wamsley et al. (2010), Current Biology"), 'https://doi.org/10.1016/j.cub.2010.03.027'],
  [tr("Pesadelos"), tr("Reescrever um pesadelo recorrente e ensaiar a nova versão acordado reduziu os pesadelos e melhorou o sono num ensaio clínico com 168 pessoas com estresse pós-traumático."), tr("Krakow et al. (2001), JAMA"), 'https://doi.org/10.1001/jama.286.5.537'],
  [tr("Por que uns lembram"), tr("Quem lembra muitos sonhos tem mais atividade em áreas do cérebro ligadas à atenção e desperta mais durante a noite, o que ajuda a guardar o sonho."), tr("Eichenlaub et al. (2014), Neuropsychopharmacology"), 'https://doi.org/10.1038/npp.2014.6'],
  [tr("Sonho lúcido"), tr("Pessoas em sonho lúcido entenderam perguntas feitas pelos pesquisadores e responderam com movimentos dos olhos, ainda dormindo."), tr("Konkoly et al. (2021), Current Biology"), 'https://doi.org/10.1016/j.cub.2021.01.026'],
  [tr("Cérebro"), tr("Com EEG de alta densidade, pesquisadores acharam uma região no fundo do córtex cuja atividade indica se a pessoa está sonhando. O resultado ainda é debatido."), tr("Siclari et al. (2017), Nature Neuroscience"), 'https://doi.org/10.1038/nn.4545'],
];

const LIVROS = [
  { t: tr("O oráculo da noite"), a: tr("Sidarta Ribeiro"), p: tr("A história e a ciência do sonho, do xamanismo à neurociência."), asin: '8535932178', capa: 'oraculo-da-noite.jpg' },
  { t: tr("O homem e seus símbolos"), a: tr("C. G. Jung e colaboradores"), p: tr("A porta de entrada para a leitura junguiana dos sonhos e dos símbolos."), asin: '8569809638', capa: 'homem-e-seus-simbolos.jpg' },
  { t: tr("Memórias, sonhos, reflexões"), a: tr("C. G. Jung"), p: tr("A autobiografia de Jung, em que os próprios sonhos guiam a narrativa de uma vida."), asin: '6556400130', capa: 'memorias-sonhos-reflexoes.jpg' },
  { t: tr("O caminho dos sonhos"), a: tr("Marie-Louise von Franz"), p: tr("A principal colaboradora de Jung mostra, em conversas, como trabalhar com os sonhos."), asin: '8531600405', capa: 'caminho-dos-sonhos.jpg' },
];

const OkLista = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>;

export default function Home() {
  const [livro, setLivro] = useState(0);
  const [ideia, setIdeia] = useState(false);
  const { pronto, usuario, temLogin, entrar } = useEstado();
  const { state } = useLocation();
  // Já logado e chegando pelo endereço do site: vai direto para o app.
  if (pronto && usuario && !state?.ficar) return <Navigate to="/app" replace />;
  // Sem login: os botões de entrar chamam o Google direto (na demo, sem login, abrem o app).
  const Entrar = ({ children, ...p }) => (temLogin && !usuario
    ? <button type="button" onClick={entrar} {...p}>{children}</button>
    : <Link to="/app" {...p}>{children}</Link>);
  return (
    <div className="home">
      <header className="h-topo">
        <div className="h-topo-miolo">
          <Logo />
          <nav aria-label={tr("Seções")} className="h-nav esconde-celular">
            <a href="#ao-acordar">{tr("Como funciona")}</a>
            <a href="#terapeutas">{tr("Para quem atende")}</a>
            <a href="#pratica">{tr("A prática")}</a>
          </nav>
          <div className="h-topo-acoes">
            <button type="button" className="h-link-topo" onClick={() => trocarIdioma(ingles ? 'pt' : 'en')} lang={ingles ? 'pt-BR' : 'en'} aria-label={ingles ? 'Ver em português' : 'View in English'} title={ingles ? 'Ver em português' : 'View in English'}>{ingles ? 'PT' : 'EN'}</button>
            <Entrar className="h-link-topo">{usuario ? tr("Abrir o app") : tr("Entrar")}</Entrar>
            <BotaoInstalar style={{ minHeight: 40 }} />
          </div>
        </div>
      </header>

      {/* TOPO */}
      <section className="h-hero">
        <div className="h-hero-miolo">
          <div className="rotulo">{tr("Diário de sonhos para a análise")}</div>
          <h1 className="h-h1">{tr("Do travesseiro ao consultório.")}</h1>
          <p className="h-sub">{n(tr("Grave o sonho ao acordar e leve à sessão o que você quiser trabalhar. O sentido fica com você e com quem acompanha você."))}</p>
          <div className="h-cta">
            <BotaoInstalar className="btn btn-azul" size={18}>{tr("Instalar no celular, grátis")}</BotaoInstalar>
            <p>{tr("Prefere o computador? ")}<Entrar className="h-link">{usuario ? tr("Abrir o Sonhário") : tr("Entrar e usar no navegador")}</Entrar></p>
            {/* <a> e não <Link>: a demonstração só liga quando a página carrega já em /demo (lib/demo.js). */}
            <a href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>{n(tr("Ver o app por dentro, sem cadastro"))} <Avancar size={15} /></a>
          </div>
        </div>
        <VideoTopo />
        <p className="h-porta">{n(tr("Ainda não faz análise? Comece a guardar seus sonhos agora. Se um dia você começar, eles já estarão lá."))}</p>
      </section>

      {/* DEPOIMENTO */}
      <section className="h-bloco" style={{ paddingTop: 104 }}>
        <figure className="depoimento">
          <Retrato />
          <div>
            <blockquote style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', lineHeight: 1.45, color: 'var(--preto)' }}>“{n(tr("Esse é o método que me ajudou a registrar mais de 1.000 sonhos nos últimos 5 anos."))}”</blockquote>
            <figcaption><strong>{tr("Fernando Martins")}</strong>{tr(", criador do Sonhário")}</figcaption>
          </div>
        </figure>
      </section>

      {/* GRAVAR */}
      <section id="ao-acordar" className="h-bloco">
        <div className="h-largo h-dupla">
          <div className="h-col-texto">
            <div className="h-rotulo">{tr("Gravar")}</div>
            <h2 className="h-titulo">{n(tr("Abriu, gravou. Pode voltar a dormir."))}</h2>
            <p className="h-texto">{n(tr("O app abre direto no gravador, sem menu e sem procurar botão. Fale com a voz de quem acabou de acordar: o áudio fica guardado e vira texto enquanto você fala."))}</p>
            <BotaoInstalar className="btn btn-azul h-botao" />
          </div>
          <div className="h-col-tela" style={{ background: '#F3F5F7', display: 'flex', justifyContent: 'center' }}><MiniCelular /></div>
        </div>
      </section>

      {/* AMPLIFICAR */}
      <section id="amplificacoes" className="h-bloco">
        <div className="h-largo h-dupla inverte">
          <div className="h-col-tela" style={{ background: '#F3EEE7' }}>
            <div className="h-quadro">
              <div style={{ fontSize: 11, fontWeight: 700, color: '#183347' }}>{tr("20 nov · mar, animais")}</div>
              <div style={{ marginTop: 6, fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>{tr("A baleia ao lado do barco")}</div>
              <p className="leitura" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.65 }}>{n(tr("Uma baleia passava devagar ao lado do barco, tão perto que eu via o olho dela. Ela parecia me reconhecer."))}</p>
              <div className="h-mini-rotulo" style={{ marginTop: 20 }}>{tr("Amplificações")}</div>
              <div className="h-amp"><span>{tr("21 nov")}</span><span>{n(tr("Moby Dick, que li aos quinze anos. A baleia como algo que se persegue."))}</span></div>
              <div className="h-amp" style={{ marginTop: 8 }}><span>{tr("24 nov")}</span><span>{n(tr("No sonho, ela passa ao lado e eu fico. Só seguimos juntos."))}</span></div>
              <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="h-pilula" style={{ background: 'var(--azul)', borderColor: 'var(--azul)', color: '#fff' }}>{tr("Levar à sessão")}</span>
                <span className="h-pilula" style={{ color: 'var(--muted)' }}>{tr("+ Amplificação")}</span>
              </div>
            </div>
          </div>
          <div className="h-col-texto">
            <div className="h-rotulo">{tr("Amplificar")}</div>
            <h2 className="h-titulo">{n(tr("Um caderno, não um intérprete."))}</h2>
            <p className="h-texto">{n(tr("Outros apps entregam um significado pronto, gerado por inteligência artificial. O Sonhário guarda o que você sonhou e as imagens e associações que você foi juntando, para levar à sessão."))}</p>
            <p className="h-nota-ia">{n(tr("As amplificações são repertório, não resposta. A inteligência artificial vem desligada; se você ligar, ela só transcreve o áudio e sugere temas. Ela nunca interpreta."))}</p>
          </div>
        </div>
      </section>

      {/* COMPARTILHAR */}
      <section id="sessao" className="h-bloco">
        <div className="h-largo h-dupla">
          <div className="h-col-texto">
            <div className="h-rotulo">{tr("Compartilhar")}</div>
            <h2 className="h-titulo">{n(tr("Leve um sonho para a sessão. Só aquele."))}</h2>
            <p className="h-texto">{n(tr("Escolha um sonho e mande para quem acompanha você, ou para alguém de confiança. A pessoa entra com a própria conta e encontra o sonho com o seu nome e a sua foto. O resto do caderno continua só seu."))}</p>
            <Entrar className="btn btn-azul h-botao">{tr("Começar agora")}</Entrar>
          </div>
          <div className="h-col-tela" style={{ background: 'var(--azul-claro)' }}><MiniCompartilhar /></div>
        </div>
      </section>

      {/* FECHAMENTO */}
      <section id="instalar" className="h-bloco">
        <div className="h-largo h-fecho">
          <h2 className="h-titulo" style={{ marginTop: 0, textAlign: 'center', fontSize: 'clamp(32px, 4.4vw, 52px)' }}>{n(tr("Seus sonhos, guardados para a sessão."))}</h2>
          <p style={{ margin: '16px auto 0', maxWidth: 560, textAlign: 'center', fontSize: 17, lineHeight: 1.55, color: '#C9D0D7' }}>{n(tr("Sem loja de aplicativos: o Sonhário se instala direto pelo site. Amanhã, grave antes de levantar."))}</p>
          <div className="h-fecho-cols">
            <div className="h-fecho-col"><strong>{tr("No celular")}</strong><span>{n(tr("Abra o site, instale com dois toques e deixe perto da cama."))}</span><BotaoInstalar className="btn btn-azul" /></div>
            <div className="h-fecho-col"><strong>{tr("No computador")}</strong><span>{n(tr("Organize com calma, no mural, na lista ou por tema."))}</span><Entrar className="btn" style={{ background: '#fff', color: 'var(--preto)' }}>{usuario ? tr("Abrir o Sonhário") : tr("Usar no navegador")}</Entrar></div>
            <div className="h-fecho-col"><strong>{tr("Antes de criar conta")}</strong><span>{n(tr("Veja o app por dentro, com sonhos de exemplo."))}</span><a href="/demo" className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid #5B6570' }}>{tr("Ver a demonstração")}</a></div>
          </div>
          <p style={{ margin: '28px 0 0', textAlign: 'center', fontSize: 14, color: '#C9D0D7' }}>{n(tr("Já anota seus sonhos em outro lugar? Traga do Notion, do Google Keep ou de arquivos de texto."))}</p>
          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 13.5, color: '#C9D0D7', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><Cadeado size={14} /> {n(tr("Seus sonhos ficam trancados com uma frase-senha. Há também um nível avançado de criptografia."))}</p>
        </div>
      </section>

      {/* PARA QUEM ATENDE */}
      <section id="terapeutas" className="h-faixa-azul">
        <div className="h-largo h-dupla">
          <div className="h-col-texto">
            <div className="h-rotulo">{tr("Também para quem atende")}</div>
            <h2 className="h-titulo">{n(tr("Você é terapeuta ou analista? Leve seus pacientes junto."))}</h2>
            <p className="h-texto">{n(tr("Convide seus pacientes por um link. Eles registram os sonhos durante a semana e escolhem o que levar. Você recebe um resumo antes da sessão, e o sentido continua sendo construído no consultório."))}</p>
            <ul className="h-lista-ok">
              <li><OkLista />{n(tr("Você só vê o que o paciente escolhe mostrar"))}</li>
              <li><OkLista />{n(tr("O app não interpreta, então não compete com o seu trabalho"))}</li>
            </ul>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
              <Entrar className="btn h-botao" style={{ marginTop: 0, background: '#fff', color: 'var(--azul)', fontWeight: 800 }}><Pessoas size={18} />{tr(" Convidar meus pacientes")}</Entrar>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: '#E6EEF7', maxWidth: 300 }}>{n(tr("Ao entrar, escolha “Registrar os meus sonhos e atender pacientes”."))}</span>
            </div>
          </div>
          <div className="h-col-tela" style={{ padding: 24, background: '#fff', color: 'var(--ink)', boxShadow: '0 24px 60px rgba(0,20,50,.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><strong style={{ fontSize: 16 }}>{tr("Antes da sessão")}</strong><span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{tr("terça, 24 nov")}</span></div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['M', tr("Marina"), '14h', tr("3 sonhos para levar · temas: mar, casa"), '#DED1C1'], ['R', tr("Rafael"), '16h', tr("1 sonho para levar · tema: trabalho"), '#DBEDDB'], ['C', tr("Clara"), '18h', tr("nenhum sonho marcado nesta semana"), '#E8DEEE']].map(([i, nome, h, d, cor]) => (
                <div key={nome} className="h-paciente"><span className="h-avatar" style={{ background: cor }}>{i}</span><span><strong>{nome}</strong> · {h}<br /><span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{d}</span></span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CIÊNCIA */}
      <section id="ciencia" className="h-ciencia">
        <div className="h-largo">
          <div style={{ maxWidth: 680 }}>
            <div className="h-rotulo">{tr("Pesquisas")}</div>
            <h2 className="h-titulo" style={{ fontSize: 'clamp(32px, 4.4vw, 52px)' }}>{tr("O que diz a ciência")}</h2>
            <p className="h-texto" style={{ fontSize: 17 }}>{n(tr("Alguns estudos sobre lembrar, registrar e conversar sobre os sonhos. Cada um mostra uma parte, e a ciência dos sonhos ainda está em construção."))}</p>
          </div>
          <div className="esteira">
            <div className="esteira-trilho">
              {[...ESTUDOS, ...ESTUDOS].map(([tag, txt, ref, url], i) => (
                <article key={tag + i} className="estudo" aria-hidden={i >= ESTUDOS.length || undefined}>
                  <span className="rotulo-forte" style={{ color: 'var(--azul-escuro)' }}>{tag}</span>
                  <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>{n(txt)}</p>
                  <span style={{ marginTop: 'auto', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{ref}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" tabIndex={i >= ESTUDOS.length ? -1 : undefined} style={{ fontSize: 13, fontWeight: 700 }}>{tr("Ler o artigo")}</a>
                </article>
              ))}
            </div>
          </div>
          <p style={{ margin: '32px 0 0', maxWidth: 720, fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{n(tr("Um aviso honesto: um levantamento com quase 5 mil pessoas no Reino Unido lembra que ainda faltam estudos sobre os benefícios de manter um diário de sonhos fora da terapia. O Sonhário apoia a prática, e os resultados vêm dela."))} <a href="https://journals.ub.uni-heidelberg.de/index.php/IJoDR/article/view/77247" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>{tr("Schredl (2021)")}</a></p>
        </div>
      </section>

      {/* A PRÁTICA (como fazer + leituras) */}
      <section id="pratica" className="h-bloco">
        <div className="h-largo h-dupla" style={{ alignItems: 'stretch' }}>
          <div className="h-col-texto" style={{ flexBasis: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="h-rotulo">{tr("A prática")}</div>
              <h2 className="h-titulo">{tr("Como fazer um sonhário")}</h2>
              <p className="h-texto" style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7 }}>{n(tr("Anotar sonhos é um hábito antigo: na Antiguidade, Macróbio já defendia registrá-los com fidelidade. O neurocientista Sidarta Ribeiro retoma a ideia e descreve um caminho simples, que trouxemos para o Sonhário."))}</p>
            </div>
            <ol className="cartoes-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {PASSOS.map(([t, d], i) => (
                <li key={t} className="passo">
                  <span className="passo-n">{i + 1}</span>
                  <span style={{ fontSize: 16, fontWeight: 800 }}>{t}</span>
                  <span className="passo-d">{n(d)}</span>
                </li>
              ))}
            </ol>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{tr("Adaptado de ")}<em>{tr("O oráculo da noite")}</em>{tr(", de Sidarta Ribeiro.")}</p>
          </div>
          <figure style={{ flex: '1 1 320px', margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img src="https://images.unsplash.com/photo-1725711028475-99a333268847?fm=jpg&q=70&w=1000&auto=format&fit=crop" alt={tr("Gravura antiga: uma pessoa num balanço se lança em direção a um castelo nas nuvens")} loading="lazy" style={{ width: '100%', flex: 1, minHeight: 360, objectFit: 'cover', borderRadius: 20, display: 'block' }} />
            <figcaption style={{ fontSize: 12, color: 'var(--muted)' }}>{tr("Imagem: ")}<a href="https://unsplash.com/pt-br/fotografias/uma-pessoa-balanca-em-direcao-a-um-castelo-nas-nuvens-h1ItA7ncIjk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', fontWeight: 700 }}>{tr("The New York Public Library")}</a>{tr(", via Unsplash")}</figcaption>
          </figure>
        </div>
              <div id="leituras" className="h-largo" style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 88 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ marginRight: 'auto', maxWidth: 680 }}>
              <div className="h-rotulo">{tr("Leituras")}</div>
              <h2 className="h-titulo">{tr("Para ir mais fundo")}</h2>
              <p className="h-texto" style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7 }}>{n(tr("Quatro livros para quem quer entender melhor os próprios sonhos, da neurociência à psicologia analítica."))}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icone" onClick={() => setLivro(Math.max(0, livro - 1))} aria-label={tr("Livro anterior")}><Voltar /></button>
              <button className="btn-icone" style={{ background: 'var(--preto)', color: '#fff', border: 0 }} onClick={() => setLivro(Math.min(LIVROS.length - 1, livro + 1))} aria-label={tr("Próximo livro")}><Avancar /></button>
            </div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 20, transition: 'transform .4s ease', transform: `translateX(-${livro * 320}px)` }}>
              {LIVROS.map((l) => (
                <article key={l.asin} style={{ flex: '0 0 300px', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div role="img" aria-label={tr("Capa de ") + l.t} style={{ height: 240, borderRadius: 10, background: '#F3F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={import.meta.env.BASE_URL + 'capas/' + l.capa} alt="" loading="lazy" style={{ width: 150, height: 216, objectFit: 'cover', borderRadius: '2px 6px 6px 2px', boxShadow: '0 8px 18px rgba(20,30,40,0.18)', display: 'block' }} />
                  </div>
                  <span style={{ fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{l.t}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{l.a}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{n(l.p)}</span>
                  <a href={amazon(l)} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-preto" style={{ marginTop: 'auto' }}>{tr("Ver na Amazon")}</a>
                </article>
              ))}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{n(tr("Alguns links são de afiliado: se você comprar por eles, o Sonhário recebe uma pequena comissão, sem custo extra para você."))}</p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="h-rodape">
        <div className="h-largo">
          <div className="h-rodape-cols">
            <div><Logo /><span>{tr("Diário de sonhos para a análise.")}</span></div>
            <div><strong>{tr("O app")}</strong><a href="#ao-acordar">{tr("Como funciona")}</a><a href="/demo">{tr("Demonstração")}</a><a href="#instalar">{tr("Instalar")}</a></div>
            <div><strong>{tr("A prática")}</strong><a href="#pratica">{tr("Como fazer um sonhário")}</a><a href="#ciencia">{tr("O que diz a ciência")}</a><a href="#leituras">{tr("Leituras")}</a></div>
            <div><strong>{tr("Projeto colaborativo")}</strong><span>{n(tr("Sua ideia pode virar a próxima função do app."))}</span><button type="button" className="btn btn-linha" onClick={() => setIdeia(true)}><Mensagem size={16} />{tr(" Contribuir com uma ideia")}</button></div>
          </div>
          <div className="h-rodape-cta">
            <strong>{n(tr("Pronto para guardar o próximo sonho?"))}</strong>
            <BotaoInstalar className="btn btn-azul" />
          </div>
          <div className="h-rodape-fim">
            <Assinatura />
            <Link to="/privacidade" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{tr("Privacidade e termos")}</Link>
            <button type="button" onClick={() => trocarIdioma(ingles ? 'pt' : 'en')} lang={ingles ? 'pt-BR' : 'en'} style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>{ingles ? 'Ver em português' : 'View in English'}</button>
          </div>
        </div>
      </footer>
      {ideia && <Contribuir aoFechar={() => setIdeia(false)} />}
    </div>
  );
}

// Palavras do relato que aparecem uma a uma no vídeo (cada uma tem a sua animação hv-wN no home.css).
const RELATO = tr("Eu estava num barco pequeno, à noite. Uma baleia passava devagar ao lado, tão perto que eu via o olho dela. Ela parecia me reconhecer, e eu não tinha medo.").split(' ');
// O texto em inglês (src/lib/en.js) tem as mesmas 30 palavras, para casar com as animações do home.css.
const REALCE = [15, 20]; // "que eu via o olho dela." (em inglês, "close I could see its eye.") ganha o realce da Helena
const CURTAS = new Set(['eu', 'num', 'à', 'ao', 'que', 'o', 'me', 'e', 'não', 'uma', 'i', 'a', 'in', 'at', 'so', 'to', 'and', 'its']);

function Relato() {
  const palavra = (w, i) => {
    const prende = i < RELATO.length - 1 && (CURTAS.has(w.toLowerCase()) || i >= RELATO.length - 2);
    return <Fragment key={i}><span className={'hv-w' + i}>{w}</span>{i < RELATO.length - 1 ? (prende ? ' ' : ' ') : null}</Fragment>;
  };
  return (
    <>
      {RELATO.slice(0, REALCE[0]).map((w, i) => palavra(w, i))}
      <span className="hv-realce">{RELATO.slice(REALCE[0], REALCE[1] + 1).map((w, j) => palavra(w, REALCE[0] + j))}</span>
      {RELATO.slice(REALCE[1] + 1).map((w, j) => palavra(w, REALCE[1] + 1 + j))}
    </>
  );
}

function VideoTopo() {
  const [pausado, setPausado] = useState(false);
  return (
    <div className={'h-video' + (pausado ? ' h-pausado' : '')}>
      <div className="h-palco" role="img" aria-label={tr("Animação do app: o sonho é gravado ao acordar, organizado por tema, ganha amplificações e é levado à sessão")}>
        <div className="h-pagina" aria-hidden="true">
          <div className="h-pagina-barra">
            <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--preto)', flex: 'none' }} />
            <span>{tr("Sonhos / ")}<strong>{tr("A baleia ao lado do barco")}</strong></span>
            <span className="h-pilula hv-ativa" style={{ marginLeft: 'auto' }}>{tr("Levar à sessão")}</span>
            <span className="h-pilula" style={{ background: 'var(--preto)', borderColor: 'var(--preto)', color: '#fff' }}>{tr("Compartilhar")}</span>
          </div>
          <div className="h-pagina-corpo">
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>{tr("sexta, 20 de novembro · 06:52")}</div>
            <div className="hv-titulo" style={{ marginTop: 8, fontSize: 26, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--preto)' }}>{tr("A baleia ao lado do barco")}</div>
            <div style={{ marginTop: 10, height: 24, display: 'flex', gap: 6 }}>
              <span className="h-chip hv-c1" style={{ background: '#D3E5EF', color: '#183347' }}>{tr("mar")}</span>
              <span className="h-chip hv-c2" style={{ background: '#DBEDDB', color: '#1C3829' }}>{tr("animais")}</span>
            </div>
            <p className="h-relato"><Relato /><span className="h-cursor hv-cursor"><span /><span>{tr("Helena")}</span></span></p>
            <div className="h-mini-rotulo hv-amp" style={{ marginTop: 22 }}>{tr("Amplificações")}</div>
            <div className="h-amp hv-a1"><span>{tr("21 nov")}</span><span>{tr("Moby Dick, que li aos quinze anos.")}</span></div>
            <div className="h-amp hv-a2" style={{ marginTop: 8 }}><span>{tr("24 nov")}</span><span>{tr("Ela passa ao lado, e eu fico.")}</span></div>
          </div>
        </div>

        <div className="h-flutua h-fica-celular hv-gravador" style={{ left: '2%', top: '12%', width: '19%' }} aria-hidden="true">
          <div style={{ position: 'relative', height: 18 }}>
            <div className="hv-grav" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--azul)' }}><span className="hv-pisca" style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--azul)' }} />{tr("Gravando · 0:14")}</div>
            <div className="hv-transc" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#1C3829' }}><Ok size={12} />{tr("Áudio guardado e transcrito")}</div>
          </div>
          <div className="hv-onda" style={{ marginTop: 12 }}>{[12, 24, 16, 30, 14, 26, 18, 28, 12, 22, 16, 26, 14, 20].map((h, i) => <span key={i} style={{ height: h }} />)}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 999, background: 'var(--azul)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={14} /></span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{tr("o app abre no gravador")}</span>
          </div>
        </div>

        <div className="h-flutua h-esconde-medio hv-temas" style={{ left: '3%', top: '52%', width: '18.5%', padding: 12 }} aria-hidden="true">
          <div className="h-mini-rotulo" style={{ padding: '2px 6px 8px' }}>{tr("Temas")}</div>
          <div className="h-tema hv-tema-ativo"><span>{tr("mar")}</span><span>13</span></div>
          <div className="h-tema"><span>{tr("casa")}</span><span>8</span></div>
          <div className="h-tema"><span>{tr("animais")}</span><span>6</span></div>
          <div className="h-tema"><span>{tr("família")}</span><span>4</span></div>
        </div>

        <div className="h-flutua h-esconde-medio hv-sessao" style={{ right: '1.5%', top: '20%', width: '21%' }} aria-hidden="true">
          <div className="h-mini-rotulo">{tr("Próxima sessão")}</div>
          <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800 }}>{tr("terça, 24 nov · 14h")}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, fontWeight: 600 }}><span className="h-caixa hv-tique"><Ok size={11} /></span>{tr("A baleia ao lado do barco")}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}><span className="h-caixa" style={{ background: 'var(--azul)', borderColor: 'var(--azul)', color: '#fff' }}><Ok size={11} /></span>{tr("A biblioteca do avô")}</div>
        </div>

        <div className="h-flutua h-esconde-medio hv-pessoa" style={{ right: '2%', top: '58%', width: '21%' }} aria-hidden="true">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="h-avatar" style={{ width: 32, height: 32, fontSize: 13, background: 'var(--areia)' }}>H</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.35 }}><strong>{tr("Helena Prado")}</strong><br /><span style={{ color: 'var(--muted)' }}>{tr("vê só este sonho")}</span></span>
          </div>
          <div className="hv-balao" style={{ marginTop: 12, padding: '10px 12px', borderRadius: '12px 12px 12px 4px', background: '#F3EEE7', fontSize: 12.5, lineHeight: 1.45 }}>{tr("Vamos começar por este na terça?")}</div>
        </div>
      </div>
      <div className="h-controles">
        <button type="button" className="h-pausa" onClick={() => setPausado(!pausado)} aria-label={pausado ? tr("Tocar a animação") : tr("Pausar a animação")}>{pausado ? <Play size={16} /> : <Pausa size={16} />}</button>
        <div className="h-passos-video" aria-hidden="true">
          {[tr("1. Grave ao acordar"), tr("2. Organize por tema"), tr("3. Amplifique com calma"), tr("4. Leve à sessão")].map((t, i) => (
            <div key={t}><div className="h-barra"><span className={'hv-p' + i} /></div>{n(t)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Retrato() {
  const [erro, setErro] = useState(false);
  if (erro) return <span className="depoimento-foto" aria-hidden="true">{'FM'}</span>;
  return <img className="depoimento-foto" src={import.meta.env.BASE_URL + 'fernando-2026.jpg'} alt={tr("Fernando Martins")} loading="lazy" onError={() => setErro(true)} />;
}

function MiniCelular() {
  return (
    <figure aria-label={tr("Tela do app ao abrir")} style={{ margin: 0, width: 260, aspectRatio: '9 / 18.5', background: 'var(--preto)', borderRadius: 36, padding: 8, boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(20,30,40,.18)', flex: 'none' }}>
      <div style={{ height: '100%', background: '#fff', borderRadius: 29, padding: '34px 18px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>06:52</span>
        <span style={{ marginTop: 8, fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{tr("O que você sonhou?")}</span>
        <div style={{ marginTop: 16, alignSelf: 'stretch', minHeight: 120, border: '1px solid var(--line-strong)', borderRadius: 12, padding: '10px 12px', fontFamily: 'var(--serif)', fontSize: 12, lineHeight: 1.6, color: 'var(--subtle)' }}>{tr("Ou escreva aqui…")}</div>
        <span style={{ marginTop: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{tr("Toque para gravar")}</span>
        <span style={{ marginTop: 10, width: 72, height: 72, borderRadius: 999, background: 'var(--azul)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={28} /></span>
      </div>
    </figure>
  );
}

function MiniCompartilhar() {
  return (
    <figure aria-label={tr("Exemplo de compartilhamento de um sonho")} className="h-quadro" style={{ margin: 0, padding: 22, boxShadow: 'var(--shadow-pop)' }}>
      <strong style={{ fontSize: 16 }}>{n(tr("Compartilhar “A baleia ao lado do barco”"))}</strong>
      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>{n(tr("Só este sonho. O resto do caderno continua fechado."))}</div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '2px solid var(--azul)' }}>
          <span className="h-avatar" style={{ width: 34, height: 34, background: 'var(--areia)' }}>H</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{tr("Helena Prado")}<br /><span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>{tr("analista")}</span></span>
          <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--azul)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ok size={12} /></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)' }}>
          <span className="h-avatar" style={{ width: 34, height: 34, background: '#DBEDDB' }}>T</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{tr("Tomás")}<br /><span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>{tr("amigo")}</span></span>
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}><span className="h-caixa" style={{ background: 'var(--azul)', borderColor: 'var(--azul)', color: '#fff' }}><Ok size={11} /></span>{tr("Enviar com as amplificações")}</div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}><span style={{ minHeight: 44, padding: '0 18px', borderRadius: 10, background: 'var(--azul)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Compartilhar size={16} />{tr(" Compartilhar")}</span></div>
    </figure>
  );
}
