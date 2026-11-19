import { useState } from 'react';
import Contribuir from '../components/Contribuir.jsx';
import BotaoInstalar from '../components/BotaoInstalar.jsx';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { Mic, Tema, Mural, Caneta, Voltar, Avancar, Ok, Mensagem, Compartilhar, Importar, Cadeado } from '../components/Icones.jsx';
import { semViuvas as n } from '../lib/tipografia.js';

// Troque pelo seu ID do Associados Amazon (termina em -20) quando a conta estiver aprovada.
const AMAZON_TAG = 'SEU-ID-20';
const amazon = (asin) => `https://www.amazon.com.br/dp/${asin}/?tag=${AMAZON_TAG}`;

const CARTOES = [
  { n: '01', t: 'Gravar', d: 'o app abre pronto para falar', Ic: Mic, bg: '#0257AA', fg: '#FFFFFF' },
  { n: '02', t: 'Compartilhar', d: 'um sonho por vez, com quem você escolher', Ic: Compartilhar, bg: '#0257AA', fg: '#FFFFFF' },
  { n: '03', t: 'Organizar', d: 'temas e status em cada sonho', Ic: Tema, bg: '#0257AA', fg: '#FFFFFF' },
  { n: '04', t: 'Ver', d: 'mural, lista ou por tema', Ic: Mural, bg: '#0257AA', fg: '#FFFFFF' },
  { n: '05', t: 'Amplificar', d: 'imagens e associações, com data', Ic: Caneta, bg: '#0257AA', fg: '#FFFFFF' },
  { n: '06', t: 'Importar', d: 'traga os sonhos que você já anotou', Ic: Importar, bg: '#0257AA', fg: '#FFFFFF' },
];

const PASSOS = [
  ['Celular ao lado da cama', 'Ao acordar, antes de levantar, abra o Sonhário: ele já abre no gravador.'],
  ['Comece pela imagem', 'No começo parece que nada vem. Mas uma imagem, mesmo fraca, aparece. Toque em gravar e comece por ela.'],
  ['Deixe uma puxar a outra', 'Essa primeira lembrança puxa as outras. Fale o que vier, mesmo em frases soltas: o texto se forma sozinho.'],
  ['Uma semana depois', 'Os fragmentos viram relatos inteiros, às vezes com vários sonhos da mesma noite, todos guardados no seu acervo.'],
];

const ESTUDOS = [
  ['Lembrar mais', 'Manter um diário de sonhos é uma técnica clássica para aumentar a lembrança dos sonhos, principalmente em quem quase não se lembra deles.', 'Schredl (2002), citado no International Journal of Dream Research', 'https://journals.ub.uni-heidelberg.de/index.php/IJoDR/article/download/37498/pdf/136208'],
  ['Autoconhecimento', 'Grupos que conversaram sobre sonhos pelo método de Ullman relataram ganhos de compreensão pessoal comparáveis aos de um método conduzido por terapeuta.', 'Edwards et al. (2013), Frontiers in Psychology', 'https://doi.org/10.3389/fpsyg.2013.00979'],
  ['Criatividade', 'Quem lembra muitos sonhos teve notas mais altas de criatividade. É uma associação, não prova de causa.', 'Vallat, Türker, Nicolas e Ruby (2022), Nature and Science of Sleep', 'https://doi.org/10.2147/NSS.S342137'],
  ['Sono', 'Num diário de sonhos de cinco semanas com 149 pessoas, as noites com sonho lembrado tiveram sono mais longo e despertar mais descansado.', 'Clocks & Sleep (2020), estudo com diário', 'https://doi.org/10.3390/clockssleep2010007'],
  ['Empatia', 'Conversar sobre o sonho de alguém pelo método de Ullman aumentou a empatia de quem ouviu pela pessoa que contou o sonho.', 'Blagrove et al. (2019), Frontiers in Psychology', 'https://doi.org/10.3389/fpsyg.2019.01351'],
  ['Memória', 'Quem sonhou com uma tarefa de navegação durante um cochilo se saiu melhor nela depois. Pensar na tarefa acordado não teve o mesmo efeito.', 'Wamsley et al. (2010), Current Biology', 'https://doi.org/10.1016/j.cub.2010.03.027'],
  ['Pesadelos', 'Reescrever um pesadelo recorrente e ensaiar a nova versão acordado reduziu os pesadelos e melhorou o sono num ensaio clínico com 168 pessoas com estresse pós-traumático.', 'Krakow et al. (2001), JAMA', 'https://doi.org/10.1001/jama.286.5.537'],
  ['Por que uns lembram', 'Quem lembra muitos sonhos tem mais atividade em áreas do cérebro ligadas à atenção e desperta mais durante a noite, o que ajuda a guardar o sonho.', 'Eichenlaub et al. (2014), Neuropsychopharmacology', 'https://doi.org/10.1038/npp.2014.6'],
  ['Sonho lúcido', 'Pessoas em sonho lúcido entenderam perguntas feitas pelos pesquisadores e responderam com movimentos dos olhos, ainda dormindo.', 'Konkoly et al. (2021), Current Biology', 'https://doi.org/10.1016/j.cub.2021.01.026'],
  ['Cérebro', 'Com EEG de alta densidade, pesquisadores acharam uma região no fundo do córtex cuja atividade indica se a pessoa está sonhando. O resultado ainda é debatido.', 'Siclari et al. (2017), Nature Neuroscience', 'https://doi.org/10.1038/nn.4545'],
];

const LIVROS = [
  { t: 'O oráculo da noite', a: 'Sidarta Ribeiro', p: 'A história e a ciência do sonho, do xamanismo à neurociência.', asin: '8535932178', capa: 'oraculo-da-noite.jpg', cor: '#ACBECE', tinta: '#1A1A1A' },
  { t: 'O homem e seus símbolos', a: 'C. G. Jung e colaboradores', p: 'A porta de entrada para a leitura junguiana dos sonhos e dos símbolos.', asin: '8569809638', capa: 'homem-e-seus-simbolos.jpg', cor: '#DED1C1', tinta: '#1A1A1A' },
  { t: 'Memórias, sonhos, reflexões', a: 'C. G. Jung', p: 'A autobiografia de Jung, em que os próprios sonhos guiam a narrativa de uma vida.', asin: '6556400130', capa: 'memorias-sonhos-reflexoes.jpg', cor: '#1A1A1A', tinta: '#FFFFFF' },
  { t: 'O caminho dos sonhos', a: 'Marie-Louise von Franz', p: 'A principal colaboradora de Jung mostra, em conversas, como trabalhar com os sonhos.', asin: '8531600405', capa: 'caminho-dos-sonhos.jpg', cor: '#0257AA', tinta: '#FFFFFF' },
];

const Rotulo = ({ cor = 'var(--azul)', children }) => <span className="rotulo" style={{ color: cor }}>{children}</span>;
const Checks = ({ itens, bg, fg, cor }) => (
  <ul className="checks">{itens.map((i) => <li key={i} style={{ color: cor }}><span className="check" style={{ background: bg, color: fg }}><Ok size={12} /></span>{n(i)}</li>)}</ul>
);

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
      <header className="topo">
        <div className="topo-miolo">
        <Logo />
        <nav aria-label="Seções" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, fontSize: 14, fontWeight: 600 }}>
          <a href="#recursos" className="esconde-celular" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Recursos</a>
          <a href="#pratica" className="esconde-celular" style={{ color: 'var(--ink)', textDecoration: 'none' }}>Como fazer</a>
          <Entrar style={{ color: 'var(--ink)', textDecoration: 'none', background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }}>{usuario ? 'Abrir o app' : 'Entrar'}</Entrar>
          <BotaoInstalar style={{ minHeight: 40 }} />
        </nav>
        </div>
      </header>

      <section className="secao" style={{ backgroundColor: '#fff', backgroundImage: 'linear-gradient(#EEEEEE 1px, transparent 1px), linear-gradient(90deg, #EEEEEE 1px, transparent 1px)', backgroundSize: '40px 40px', paddingBottom: 72 }}>
        <div className="miolo" style={{ paddingTop: 24 }}>
          <h1 className="titulo-xl">Um lugar para<br />os seus sonhos.</h1>
          <div className="rotulo" style={{ color: 'var(--preto)', marginTop: 22 }}>Caderno de sonhos</div>
          <p style={{ margin: '28px 0 0', maxWidth: 560, fontSize: 18, lineHeight: 1.6, color: '#3A3F45' }}>{n('Um caderno para lembrar o que você sonhou, organizar com calma e voltar aos sonhos quando quiser entendê-los. Um apoio ao seu processo de individuação, no seu tempo.')}</p>
          <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <BotaoInstalar className="btn btn-azul btn-grande" size={18} />
            <Entrar className="btn btn-grande" style={{ border: '1.5px solid var(--preto)', color: 'var(--preto)', background: 'transparent' }}>{usuario ? 'Abrir o Sonhário' : 'Entrar e usar no navegador'}</Entrar>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--muted)' }}>{n('Registre seus sonhos em qualquer dispositivo. Sem loja de aplicativos: o Sonhário se instala direto pelo site.')}</p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}><Cadeado size={14} /> {n('Seus sonhos ficam trancados com uma frase-senha. Há também um nível avançado de criptografia.')}</p>

          <div id="recursos" className="cartoes-3" style={{ marginTop: 64 }}>
            {CARTOES.map(({ n: num, t, d, Ic, bg, fg }) => (
              <div key={num} className="cartao-azul" style={{ '--hov-bg': bg, '--hov-fg': fg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(127,127,127,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={20} /></span>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.7 }}>{num}</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 800 }}>{t}</span>
                <span style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.82 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="secao" style={{ background: 'var(--azul)', color: '#fff' }}>
        <div className="miolo grade">
          <div className="c-8 cabeca">
            <Rotulo cor="var(--azul-cinza)">01 — Ao acordar</Rotulo>
            <h2 className="titulo-l">{n('Abriu, gravou. Pode voltar a dormir.')}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#E6EDF5' }}>{n('O app abre direto no gravador, sem menu e sem procurar botão. Fale com a voz de quem acabou de acordar: o áudio fica guardado e vira texto enquanto você fala.')}</p>
            <Checks itens={['Abre direto no gravador, sem tela de entrada', 'Grave e escreva no mesmo sonho', 'O áudio original fica guardado']} bg="#fff" fg="var(--azul)" cor="#fff" />
          </div>
          <div className="c-4 fim"><MiniCelular /></div>
        </div>
      </section>

      <section id="compartilhar" className="secao">
        <div className="miolo grade">
          <div className="c-8 cabeca">
            <Rotulo>02 — Compartilhar</Rotulo>
            <h2 className="titulo-l">{n('Leve um sonho para a sessão. Só aquele.')}</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>{n('Escolha um sonho e mande para o seu analista ou para alguém de confiança. A pessoa entra com a própria conta e encontra o sonho numa aba separada, com o seu nome e a sua foto. O resto do caderno continua só seu.')}</p>
            <Checks itens={['Sempre um sonho por vez, nunca o caderno inteiro', 'Você decide se as amplificações vão junto', 'Convite por link, e você aprova cada pessoa', 'Pare de compartilhar quando quiser', 'O sonho vai trancado: só abre para quem você escolheu']} bg="var(--azul)" fg="#fff" />
          </div>
          <div className="c-4"><MiniCompartilhar /></div>
        </div>
      </section>

      <section className="secao" style={{ background: 'var(--cinza)' }}>
        <div className="miolo grade" style={{ alignItems: 'end' }}>
          <div className="c-8 cabeca">
          <Rotulo cor="var(--ink)">03 — Acervo</Rotulo>
          <h2 className="titulo-l">{n('Mural, lista ou por tema. Do jeito que você procura.')}</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>{n('No computador, seus sonhos aparecem como um mural de notas. Quer algo mais de tabela? Troque para a lista. Quer ver o que se repete? Agrupe por tema.')}</p>
          </div>
          <div className="c-4">
          <Checks itens={['Mural de notas coloridas, como no Keep', 'Lista em tabela, como no Notion', 'Temas com a frequência de cada um']} bg="var(--preto)" fg="#fff" />
          </div>
        </div>
      </section>

      <section className="secao" style={{ backgroundColor: 'var(--preto)', backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '40px 40px', color: '#fff' }}>
        <div className="miolo grade" style={{ alignItems: 'end' }}>
          <div className="c-8 cabeca">
          <Rotulo cor="var(--azul-cinza)">04 — Amplificações</Rotulo>
          <h2 className="titulo-l">{n('Um caderno, não um intérprete. Quem amplia o sonho é você.')}</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--areia)' }}>{n('O Sonhário não diz o que o seu sonho significa. Ele guarda o que você sonhou e o que você foi ampliando, para acompanhar seu processo de individuação ao longo do tempo.')}</p>
          </div>
          <div className="c-4 cabeca">
          <Checks itens={['Amplificações com data, feitas quando você quiser', 'Marque o que levar para a próxima sessão', 'Nenhuma interpretação automática']} bg="rgba(255,255,255,0.16)" fg="#fff" cor="#fff" />
          <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '14px 16px' }}>{n('É um apoio para o seu trabalho com os sonhos, nunca um substituto da sua análise ou do seu terapeuta.')}</p>
          </div>
        </div>
      </section>

      <section id="pratica" className="secao">
        <div className="miolo grade" style={{ alignItems: 'stretch' }}>
          <div className="c-8" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="cabeca">
            <Rotulo>05 — A prática</Rotulo>
            <h2 className="titulo-l">Como fazer um sonhário</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>{n('Anotar sonhos é um hábito antigo: na Antiguidade, Macróbio já defendia registrá-los com fidelidade. O neurocientista Sidarta Ribeiro retoma a ideia e descreve um caminho simples, que trouxemos para o Sonhário.')}</p>
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
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Adaptado de <em>O oráculo da noite</em>, de Sidarta&nbsp;Ribeiro.</p>
          </div>
          <figure className="c-4" style={{ margin: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img src="https://images.unsplash.com/photo-1725711028475-99a333268847?fm=jpg&q=70&w=1000&auto=format&fit=crop" alt="Gravura antiga: uma pessoa num balanço se lança em direção a um castelo nas nuvens" loading="lazy" style={{ width: '100%', flex: 1, minHeight: 360, objectFit: 'cover', borderRadius: 20, display: 'block' }} />
            <figcaption style={{ fontSize: 12, color: 'var(--muted)' }}>Imagem: <a href="https://unsplash.com/pt-br/fotografias/uma-pessoa-balanca-em-direcao-a-um-castelo-nas-nuvens-h1ItA7ncIjk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', fontWeight: 700 }}>The New York Public Library</a>, via&nbsp;Unsplash</figcaption>
          </figure>
        </div>
      </section>

      <section className="secao" style={{ background: 'var(--cinza)' }}>
        <div className="miolo grade">
          <figure className="depoimento c-12">
            <Retrato />
            <div>
              <blockquote>“{n('Esse é o método que me ajudou a registrar mais de 1.000 sonhos nos últimos 6 anos.')}”</blockquote>
              <figcaption><strong>Fernando Martins</strong>, criador do&nbsp;Sonhário</figcaption>
            </div>
          </figure>
        </div>
      </section>

      <section className="secao" style={{ background: 'var(--azul)', color: '#fff' }}>
        <div className="miolo" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="cabeca cabeca-larga">
            <Rotulo cor="var(--azul-cinza)">06 — Pesquisas</Rotulo>
            <h2 className="titulo-l">O que diz a ciência</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#E6EDF5' }}>{n('Alguns estudos sobre lembrar, registrar e conversar sobre os sonhos. Sem exagero: cada um mostra uma parte, e a ciência dos sonhos ainda está em construção.')}</p>
          </div>
          <div className="esteira">
            <div className="esteira-trilho">
              {[...ESTUDOS, ...ESTUDOS].map(([tag, txt, ref, url], i) => (
                <article key={tag + i} className="estudo" aria-hidden={i >= ESTUDOS.length || undefined}>
                  <span className="rotulo-forte" style={{ color: 'var(--azul-escuro)' }}>{tag}</span>
                  <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>{n(txt)}</p>
                  <span style={{ marginTop: 'auto', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{ref}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" tabIndex={i >= ESTUDOS.length ? -1 : undefined} style={{ fontSize: 13, fontWeight: 700 }}>Ler o artigo</a>
                </article>
              ))}
            </div>
          </div>
          <p className="cabeca-larga" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#E6EDF5' }}>{n('Um aviso honesto: um levantamento com quase 5 mil pessoas no Reino Unido lembra que ainda faltam estudos sobre os benefícios de manter um diário de sonhos fora da terapia. O Sonhário não promete resultados; ele ajuda você a manter a prática.')} <a href="https://journals.ub.uni-heidelberg.de/index.php/IJoDR/article/view/77247" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 700 }}>Schredl (2021)</a></p>
        </div>
      </section>

      <section className="secao">
        <div className="miolo" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
            <div className="cabeca cabeca-larga" style={{ marginRight: 'auto' }}>
              <Rotulo>07 — Leituras</Rotulo>
              <h2 className="titulo-l">Para ir mais fundo</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>{n('Quatro livros para quem quer entender melhor os próprios sonhos, da neurociência à psicologia analítica.')}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icone" onClick={() => setLivro(Math.max(0, livro - 1))} aria-label="Livro anterior"><Voltar /></button>
              <button className="btn-icone" style={{ background: 'var(--preto)', color: '#fff', border: 0 }} onClick={() => setLivro(Math.min(LIVROS.length - 1, livro + 1))} aria-label="Próximo livro"><Avancar /></button>
            </div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 20, transition: 'transform .4s ease', transform: `translateX(-${livro * 320}px)` }}>
              {LIVROS.map((l) => (
                <article key={l.asin} style={{ flex: '0 0 300px', border: '1px solid var(--line)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div role="img" aria-label={'Capa de ' + l.t} style={{ height: 240, borderRadius: 8, background: '#F2F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={import.meta.env.BASE_URL + 'capas/' + l.capa} alt="" loading="lazy" style={{ width: 150, height: 216, objectFit: 'cover', borderRadius: '2px 6px 6px 2px', boxShadow: '0 8px 18px rgba(20,30,40,0.18)', display: 'block' }} />
                  </div>
                  <span style={{ fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{l.t}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{l.a}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{n(l.p)}</span>
                  <a href={amazon(l.asin)} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-preto" style={{ marginTop: 'auto' }}>Ver na Amazon</a>
                </article>
              ))}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{n('Alguns links são de afiliado: se você comprar por eles, o Sonhário recebe uma pequena comissão, sem custo extra para você.')}</p>
        </div>
      </section>

      <section className="secao" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="miolo" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="cabeca cabeca-larga">
            <Rotulo>08 — Seu acervo vem junto</Rotulo>
            <h2 className="titulo-l">{n('Traga os sonhos que você já anotou.')}</h2>
          </div>
          <div className="cartoes-3">
            {[['Notion', 'Exporte a tabela de sonhos em CSV e envie. Data, temas, status e observações vêm para os campos certos.'], ['Google Keep', 'Baixe suas notas pelo Google Takeout e envie. Os marcadores viram temas e as cores são mantidas.'], ['Outros arquivos', 'Texto ou Markdown. Se cada sonho começa com uma data, o Sonhário separa um por um.']].map(([t, d]) => (
              <article key={t} className="painel" style={{ borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{t}</span>
                <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{n(d)}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 20px' }}>
        <div id="instalar" className="miolo" style={{ background: 'var(--azul)', color: '#fff', borderRadius: 16, padding: '72px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <h2 className="titulo-l">{n('Acesse seu caderno digital de sonhos.')}</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#E6EDF5' }}>{n('Abra o site no celular, instale com dois toques e deixe perto da cama. Amanhã, abra antes de levantar.')}</p>
          <div style={{ marginTop: 10, width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '18px 20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="rotulo" style={{ color: 'var(--azul-cinza)' }}>Sem loja de aplicativos</span>
            <span style={{ fontSize: 15, lineHeight: 1.5 }}>Abra o Sonhário no navegador do celular e toque em <strong>Instalar no&nbsp;celular</strong>. Ele passa a funcionar como um aplicativo, sem precisar registrar nenhum sonho&nbsp;antes.</span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <BotaoInstalar className="btn btn-grande" size={18} style={{ background: '#fff', color: 'var(--azul)', border: 0 }} />
            <Entrar className="btn btn-grande" style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)' }}>{usuario ? 'Abrir o Sonhário' : 'Usar no navegador'}</Entrar>
          </div>
        </div>
      </section>

      <footer style={{ padding: '40px 20px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Logo />
        <Assinatura />
        <button type="button" className="btn btn-linha" style={{ marginTop: 10 }} onClick={() => setIdeia(true)}><Mensagem size={16} /> Contribuir com uma ideia</button>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', textAlign: 'center', maxWidth: 360 }}>{n('Um projeto colaborativo: sua ideia pode virar a próxima função do app.')}</p>
        <Link to="/privacidade" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Privacidade e termos</Link>
      </footer>
      {ideia && <Contribuir aoFechar={() => setIdeia(false)} />}
    </div>
  );
}

function Retrato() {
  const [erro, setErro] = useState(false);
  if (erro) return <span className="depoimento-foto" aria-hidden="true">FM</span>;
  return <img className="depoimento-foto" src={import.meta.env.BASE_URL + 'fernando.jpg'} alt="Fernando Martins" loading="lazy" onError={() => setErro(true)} />;
}

function MiniCelular() {
  return (
    <figure aria-label="Tela do app ao abrir" style={{ margin: '0 auto', width: 300, height: 580, border: '10px solid var(--preto)', borderRadius: 44, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: 'var(--ink)', flex: 'none' }}>
      <div style={{ height: 52, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--azul)' }} /><span style={{ fontSize: 14, fontWeight: 800 }}>Sonhário</span>
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>Segunda · 06:42</span>
        <span style={{ fontSize: 22, letterSpacing: '-0.03em' }}>O que você sonhou?</span>
        <div style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 10, padding: 12, fontFamily: 'var(--serif)', fontSize: 13.5, lineHeight: 1.6 }}>Eu estava num ônibus que passava direto pelo meu ponto…</div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 56, height: 56, flex: 'none', borderRadius: 999, background: 'var(--azul)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={22} /></span>
          <span style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}><strong style={{ color: 'var(--ink)' }}>Toque e fale.</strong> Vira texto sozinho.</span>
        </div>
        <span style={{ height: 40, borderRadius: 10, background: 'var(--azul)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Guardar no sonhário</span>
      </div>
    </figure>
  );
}

function MiniCompartilhar() {
  const Pessoa = ({ ini, nome, papel, cor }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 38, height: 38, borderRadius: 999, background: cor, color: '#fff', fontSize: 14, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{ini}</span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <strong style={{ fontSize: 14 }}>{nome}</strong>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{papel}</span>
      </div>
    </div>
  );
  return (
    <figure aria-label="Exemplo de compartilhamento de um sonho" className="painel" style={{ margin: '0 auto', width: '100%', maxWidth: 360, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 30px rgba(20,30,40,0.10)', flex: 'none' }}>
      <span className="rotulo" style={{ color: 'var(--muted)' }}>Compartilhar sonho</span>
      <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Ok size={14} /></span>
        <span style={{ fontSize: 13.5, lineHeight: 1.5 }}><strong>Só este sonho:</strong> “O ônibus que passava direto pelo&nbsp;ponto”.<br /><span style={{ color: 'var(--muted)' }}>Seus outros sonhos continuam só&nbsp;seus.</span></span>
      </div>
      <Pessoa ini="A" nome="Ana Souza" papel="terapeuta · vê as amplificações" cor="var(--azul)" />
      <Pessoa ini="L" nome="Lucas Prado" papel="amigo · só o relato" cor="var(--preto)" />
      <span style={{ height: 40, borderRadius: 10, background: 'var(--azul)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Compartilhar size={16} /> Enviar convite</span>
    </figure>
  );
}
