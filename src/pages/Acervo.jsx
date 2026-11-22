import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { STATUS, CORES, dataCurta, dataLonga, mesAno, duracao, contarTemas } from '../lib/sonhos.js';
import Janela from '../components/Janela.jsx';
import { Mural, Lista, Tema, Titulo, Busca, Mic, Estrela, Fechar, Imagem, Mensagem, Calendario as IconeCalendario } from '../components/Icones.jsx';
import { LinhaDoTempo, Calendario, contarPorAno, noPeriodo } from '../components/Tempo.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { interpretar, casar } from '../lib/busca.js';
import { ehSenha } from '../lib/laboratorio.js';
import Realce from '../components/Realce.jsx';
import { RetratoTema } from '../components/Laboratorio.jsx';
import { retratoDoTema } from '../lib/insights.js';

export function Status({ s, cor }) {
  const st = STATUS[s] || STATUS.nao_aberto;
  return <span className="status" style={{ color: cor }}><span className="ponto" style={{ background: st.cor }} />{st.rotulo}</span>;
}

// Mural em colunas, mas lido por linhas: o mais recente fica no topo à esquerda,
// o segundo ao lado, e assim por diante (no column-width do CSS a ordem descia coluna abaixo).
export function MuralEmLinhas({ children, largura = 250, vao = 16 }) {
  const caixa = useRef(null);
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => setCols(Math.max(1, Math.floor((el.clientWidth + vao) / (largura + vao))));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [largura, vao]);
  const itens = Array.isArray(children) ? children.filter(Boolean) : [children];
  const colunas = Array.from({ length: cols }, () => []);
  itens.forEach((it, i) => colunas[i % cols].push(it));
  return (
    <div ref={caixa} className="mural-linhas" style={{ gap: vao }}>
      {colunas.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
}

// Botão de favoritar: fica dentro do card (que é um link), então não deixa o clique abrir o sonho.
export function BotaoFavorito({ s, size = 18, style, aoMudar }) {
  const { salvar } = useEstado();
  const fav = !!s.favorito;
  return (
    <button type="button" className={'btn-favorito' + (fav ? ' ligado' : '')} aria-pressed={fav}
      aria-label={fav ? 'Tirar dos favoritos' : 'Favoritar este sonho'} title={fav ? 'Tirar dos favoritos' : 'Favoritar'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (aoMudar) aoMudar(!fav); else salvar({ ...s, favorito: !fav }); }} style={style}>
      <Estrela size={size} cheia={fav} />
    </button>
  );
}

// Balão de comentários: número, e azul cheio quando há comentário novo.
export function SinalComentarios({ r, cor = 'var(--muted)' }) {
  if (!r?.total) return null;
  const novo = r.novos > 0;
  const titulo = novo ? (r.novos === 1 ? '1 comentário novo' : r.novos + ' comentários novos') : (r.total === 1 ? '1 comentário' : r.total + ' comentários');
  return (
    <span title={titulo} aria-label={titulo} className={'sinal-coment' + (novo ? ' novo' : '')} style={novo ? undefined : { color: cor }}>
      <Mensagem size={12} w={2.4} />{novo ? r.novos : r.total}
    </span>
  );
}

// Sem "para" é sonho meu: dá para favoritar. Com "para" (compartilhado comigo), só mostra.
export function Nota({ s, comTemas = true, para, achado, coment }) {
  const estiloTema = useCorTema();
  const { comentarios } = useEstado();
  const rc = coment !== undefined ? coment : !para ? comentarios?.[s.id] : null;
  const c = CORES[s.cor] || CORES.branco;
  const termos = achado?.termos;
  return (
    <Link to={para || '/app/sonho/' + s.id} className="nota" style={{ background: c.fundo }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(s.sonhado_em)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {achado?.ocorrencias > 0 && <span className="contagem-achados" title="Vezes que a busca aparece neste sonho">{achado.ocorrencias}×</span>}
          <SinalComentarios r={rc} cor={c.rotulo} />
          {s.audio && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c.rotulo }}><Mic size={12} w={2.4} />{duracao(s.audio.duracao)}</span>}
          {(s.imagens || []).length > 0 && <span title={s.imagens.length === 1 ? '1 imagem' : s.imagens.length + ' imagens'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: c.rotulo }}><Imagem size={12} w={2.4} />{s.imagens.length > 1 && s.imagens.length}</span>}
          {!para ? <BotaoFavorito s={s} size={16} style={{ margin: '-6px -6px -6px 0' }} /> : s.favorito && <span className="btn-favorito ligado" aria-label="Favorito"><Estrela size={16} cheia /></span>}
        </span>
      </div>
      {s.titulo?.trim() && <h3><Realce texto={s.titulo} termos={termos} /></h3>}
      {achado?.trecho
        ? <p>{achado.onde === 'amplificacoes' && <span className="rotulo-forte" style={{ display: 'block', color: c.rotulo, fontFamily: 'var(--sans, inherit)', fontStyle: 'normal' }}>Nas amplificações</span>}<Realce texto={achado.trecho} termos={termos} /></p>
        : s.texto ? <p><Realce texto={s.texto} termos={termos} /></p> : !s.titulo?.trim() && <p style={{ color: c.rotulo, fontStyle: 'italic' }}>{s.audio ? 'Só o áudio' : (s.imagens || []).length ? 'Só a imagem' : 'Sem título'}</p>}
      {comTemas && s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.temas.map((t) => <span key={t} className="chip" style={estiloTema(t)}><Realce texto={t} termos={termos} viuvas={false} /></span>)}</div>}
      <Status s={s.status} cor={c.rotulo} />
    </Link>
  );
}

// Sonho de exemplo: tracejado, com selo, e abre só para leitura (não existe no banco).
export function NotaExemplo({ s, aoAbrir }) {
  const estiloTema = useCorTema();
  const c = CORES[s.cor] || CORES.branco;
  return (
    <button type="button" className="nota exemplo" style={{ background: c.fundo }} onClick={() => aoAbrir(s)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(s.sonhado_em)}</span>
        <span className="selo-exemplo">exemplo</span>
      </div>
      {s.titulo?.trim() && <h3>{semViuvas(s.titulo)}</h3>}
      <p>{semViuvas(s.texto)}</p>
      {s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.temas.map((t) => <span key={t} className="chip" style={estiloTema(t)}>{t}</span>)}</div>}
      <Status s={s.status} cor={c.rotulo} />
    </button>
  );
}

function SonhoExemplo({ s, aoFechar }) {
  const estiloTema = useCorTema();
  return (
    <Janela titulo={s.titulo?.trim() || 'Sem título'} aoFechar={aoFechar}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span className="selo-exemplo">exemplo</span>
        <span className="rotulo">{dataLonga(s.sonhado_em)}</span>
      </div>
      {s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.temas.map((t) => <span key={t} className="chip" style={estiloTema(t)}>{t}</span>)}</div>}
      <p className="leitura sigilo" style={{ margin: 0 }}>{semViuvas(s.texto)}</p>
      {s.conclusoes?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="rotulo">Amplificações</span>
          {s.conclusoes.map((c) => (
            <div key={c.id} style={{ background: 'var(--cinza)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(c.em || s.sonhado_em)}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>{semViuvas(c.texto)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="aviso" style={{ background: 'var(--cinza)', color: 'var(--ink)' }}>{semViuvas('Este sonho é um exemplo. Ele não está salvo no seu acervo e some sozinho conforme você registra os seus.')}</div>
      <Link className="btn btn-azul" to="/app">Registrar um sonho meu</Link>
    </Janela>
  );
}

function FaixaExemplos({ n, semSonhos, aoEsconder }) {
  const faltam = n === 1 ? 'mais 1 sonho seu' : 'mais ' + n + ' sonhos seus';
  return (
    <div className="faixa-exemplos">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 320px', minWidth: 0 }}>
        <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{semSonhos ? 'Seu acervo ainda está vazio' : (n === 1 ? 'Resta 1 exemplo' : 'Restam ' + n + ' exemplos')}</span>
        <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          {semViuvas(semSonhos ? `Estes ${n} sonhos são exemplos, não são seus` : 'Os exemplos estão saindo para dar lugar aos seus sonhos')}
        </h2>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 620 }}>
          {semViuvas(`Eles servem para mostrar como o acervo fica. Não estão salvos na sua conta e saem um a um: a cada sonho que você registra, um exemplo some. Com ${faltam}, não sobra nenhum.`)}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Link className="btn btn-azul" to="/app">Registrar um sonho</Link>
        {semSonhos && <Link className="btn btn-linha" to="/app/importar">Importar do Notion ou do Keep</Link>}
        <button type="button" className="btn" onClick={aoEsconder} style={{ background: 'transparent', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: 3, padding: '0 8px' }}>Esconder exemplos</button>
      </div>
    </div>
  );
}

// Enquanto o acervo chega: cartões cinza no lugar dos sonhos, nunca a tela de acervo vazio.
function Carregando() {
  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p className="carregando-resto"><span className="girando" aria-hidden="true" />{semViuvas('Abrindo seus sonhos…')}</p>
      <div className="esqueleto" aria-hidden="true">
        {[150, 220, 120, 190, 170, 130, 210, 160].map((h, i) => <div key={i} className="esqueleto-nota" style={{ height: h }} />)}
      </div>
    </div>
  );
}

function Vazio() {
  return (
    <div className="painel" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <h2 className="titulo-m">Seu primeiro sonho começa amanhã cedo</h2>
      <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 420, lineHeight: 1.6 }}>{semViuvas('Deixe o celular perto da cama. Ao acordar, abra o Sonhário e fale o que lembrar. Já anota em outro lugar? Traga os seus sonhos.')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn btn-azul" to="/app">Registrar um sonho</Link>
        <Link className="btn btn-linha" to="/app/importar">Importar do Notion ou do Keep</Link>
      </div>
    </div>
  );
}

const CHAVE_ACERVO = 'sonhario:acervo';
function guardarEnderecoAcervo(busca) {
  try { sessionStorage.setItem(CHAVE_ACERVO, busca); } catch { /* sem armazenamento: volta ao acervo limpo */ }
}
// Endereço do acervo como estava da última vez (com os filtros marcados).
export function enderecoAcervo() {
  let busca = '';
  try { busca = sessionStorage.getItem(CHAVE_ACERVO) || ''; } catch { /* idem */ }
  return '/app/acervo' + (busca ? '?' + busca : '');
}

export default function Acervo() {
  const { sonhos, exemplos, esconderExemplos, carregado, laboratorio, mudarLaboratorio, avisar } = useEstado();
  const navigate = useNavigate();
  const estiloTema = useCorTema();
  const [exemploAberto, setExemploAberto] = useState(null);
  const [params, setParams] = useSearchParams();
  const vista = params.get('v') || 'mural';
  const [busca, setBuscaLocal] = useState(() => params.get('q') || '');
  const campoBusca = useRef(null);
  const setBusca = (q) => {
    // A senha do laboratório não vira busca: abre as observações extras.
    if (ehSenha(q)) {
      setBuscaLocal('');
      if (!laboratorio) mudarLaboratorio(true);
      avisar(laboratorio ? 'O laboratório já está aberto.' : 'Laboratório onírico aberto.');
      navigate('/app/observacoes#laboratorio');
      return;
    }
    setBuscaLocal(q);
    const novo = new URLSearchParams(params);
    if (q) novo.set('q', q); else novo.delete('q');
    // Buscar procura em todos os anos; apagar a busca volta para o ano mais recente.
    novo.delete('ano'); novo.delete('mes');
    setParams(novo, { replace: true });
  };
  useEffect(() => {
    const tecla = (e) => {
      const alvo = e.target;
      const digitando = alvo instanceof HTMLElement && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName));
      if (e.key === '/' && !digitando && !e.metaKey && !e.ctrlKey) { e.preventDefault(); campoBusca.current?.focus(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);
  // Os filtros ficam no endereço (?at, ?f, ?sti, ?st): assim, ao abrir um sonho e voltar, continuam marcados.
  const filtroUrl = (chave) => params.get(chave) === '1';
  const ligarFiltro = (chave, ligar) => {
    const novo = new URLSearchParams(params);
    if (ligar) novo.set(chave, '1'); else novo.delete(chave);
    setParams(novo, { replace: true });
  };
  const soAtencao = filtroUrl('at');
  const setSoAtencao = (v) => ligarFiltro('at', v);
  const soFavoritos = filtroUrl('f');
  const setSoFavoritos = (v) => ligarFiltro('f', v);
  const nFavoritos = useMemo(() => sonhos.filter((s) => s.favorito).length, [sonhos]);
  // ?tema=X: só os sonhos com esse tema (é para onde vão as tags das Observações).
  const temaFiltro = params.get('tema') || '';
  const tirarTema = () => { const novo = new URLSearchParams(params); novo.delete('tema'); novo.delete('ano'); novo.delete('mes'); setParams(novo); };
  const soSemTitulo = filtroUrl('sti');
  const setSoSemTitulo = (v) => ligarFiltro('sti', v);
  const semTitulo = useMemo(() => sonhos.filter((s) => !s.titulo?.trim()).length, [sonhos]);
  // ?st=1: só os sonhos sem nenhum tema (também vem do aviso da aba Temas).
  const soSemTema = filtroUrl('st');
  const setSoSemTema = (v) => ligarFiltro('st', v);
  const semTema = useMemo(() => sonhos.filter((s) => !s.temas?.length).length, [sonhos]);
  // Guarda o endereço atual do acervo (filtros, busca, vista, ano) para o "voltar" do sonho.
  useEffect(() => { guardarEnderecoAcervo(params.toString()); }, [params]);
  // Até 100 sonhos de uma vez; "Mostrar mais" vai somando.
  const POR_VEZ = 100;
  const [limite, setLimite] = useState(POR_VEZ);
  const voltarPrimeira = () => setLimite(POR_VEZ);

  const temas = useMemo(() => contarTemas(sonhos), [sonhos]);
  const consulta = useMemo(() => interpretar(busca), [busca]);
  const { filtrados, achados, totalOcorrencias } = useMemo(() => {
    const achados = new Map();
    let totalOcorrencias = 0;
    const filtrados = sonhos.filter((s) => {
      if (temaFiltro && !s.temas?.includes(temaFiltro)) return false;
      if (vista !== 'temas' && soFavoritos && !s.favorito) return false;
      if (vista !== 'temas' && soAtencao && s.status !== 'dar_atencao') return false;
      if (vista !== 'temas' && soSemTitulo && s.titulo?.trim()) return false;
      if (vista !== 'temas' && soSemTema && s.temas?.length) return false;
      if (consulta.vazia) return true;
      const r = casar(s, consulta);
      if (!r) return false;
      totalOcorrencias += r.ocorrencias;
      achados.set(s.id, { ...r, termos: consulta.termos });
      return true;
    });
    return { filtrados, achados, totalOcorrencias };
  }, [sonhos, consulta, soAtencao, soSemTitulo, soSemTema, soFavoritos, temaFiltro, vista]);

  const comFiltro = !!busca.trim() || soAtencao || soSemTitulo || soSemTema || soFavoritos || !!temaFiltro;

  // Linha do tempo: com busca ou filtro, abre em "Todos"; sem, no ano mais recente.
  const contagem = useMemo(() => contarPorAno(filtrados), [filtrados]);
  const anos = Object.keys(contagem).map(Number).sort((a, b) => b - a);
  const anoUrl = params.get('ano');
  const mesUrl = parseInt(params.get('mes'), 10) || 0;
  const ano = anoUrl === 'todos' ? 'todos' : anos.includes(Number(anoUrl)) ? Number(anoUrl) : (comFiltro && vista !== 'calendario' ? 'todos' : anos[0] ?? 'todos');
  const mes = ano !== 'todos' && contagem[ano]?.meses[mesUrl - 1] ? mesUrl : 0;
  const escolherPeriodo = (a, m) => {
    const novo = new URLSearchParams(params);
    novo.set('ano', String(a));
    if (m) novo.set('mes', String(m)); else novo.delete('mes');
    setParams(novo);
    setLimite(POR_VEZ);
  };
  const doPeriodo = useMemo(() => noPeriodo(filtrados, ano, mes), [filtrados, ano, mes]);
  const visiveis = doPeriodo.slice(0, limite);
  const mostrarExemplos = exemplos.length > 0 && !comFiltro && (!anoUrl || anoUrl === String(anos[0]) || sonhos.length === 0);

  // Calendário: o mês da URL (mesmo vazio) ou o mês do sonho mais recente.
  const ultimoMes = (a) => (contagem[a]?.meses.findLastIndex((n) => n > 0) ?? -1) + 1 || 1;
  const recente = filtrados[0] ? new Date(filtrados[0].sonhado_em) : new Date();
  const calAno = Number(anoUrl) || recente.getFullYear();
  const calMes = mesUrl || (Number(anoUrl) ? ultimoMes(calAno) : recente.getMonth() + 1);
  const mudarMes = (a, m) => { const novo = new URLSearchParams(params); novo.set('ano', String(a)); novo.set('mes', String(m)); setParams(novo); };

  const mudar = (v) => {
    const novo = {};
    if (v !== 'mural') novo.v = v;
    if (busca) novo.q = busca;
    if (params.get('ano')) novo.ano = params.get('ano');
    if (params.get('mes')) novo.mes = params.get('mes');
    if (temaFiltro && v !== 'temas') novo.tema = temaFiltro;
    if (v === 'temas' && params.get('r')) novo.r = params.get('r');
    setParams(novo);
  };
  const aba = (v, Icone, nome) => (
    <button type="button" className={'vista' + (vista === v ? ' ativa' : '')} aria-pressed={vista === v} onClick={() => mudar(v)}><Icone size={15} />{nome}</button>
  );

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <h1 className="titulo-m" style={{ marginRight: 'auto' }}>{sonhos.length === 0 || !carregado ? 'Seu acervo' : sonhos.length === 1 ? '1 sonho' : sonhos.length + ' sonhos'}</h1>
        <label className="busca"><Busca size={18} /><span className="sr">Buscar nos sonhos</span>
          <input ref={campoBusca} type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setBusca(''); e.currentTarget.blur(); } }}
            placeholder="Buscar: palavra, pessoa, lugar" enterKeyHint="search" autoComplete="off" spellCheck={false} />
          {busca ? <button type="button" className="busca-limpar" onClick={() => { setBusca(''); campoBusca.current?.focus(); }} aria-label="Limpar busca">×</button>
            : <kbd className="busca-atalho" aria-hidden="true">/</kbd>}
        </label>
        <div className="vistas" role="group" aria-label="Visualização">{aba('mural', Mural, 'Mural')}{aba('lista', Lista, 'Lista')}{aba('calendario', IconeCalendario, 'Calendário')}{aba('temas', Tema, 'Temas')}</div>
      </div>

      {!carregado && sonhos.length === 0 ? <Carregando /> : sonhos.length === 0 ? (!mostrarExemplos && <Vazio />) : (
        <>
          {!consulta.vazia && (
            <div className="busca-resumo" role="status">
              <span>
                <strong>{filtrados.length === 1 ? '1 sonho' : filtrados.length + ' sonhos'}</strong>
                {consulta.termos.length > 0 && <> com {consulta.termos.map((t, i) => <span key={t}>{i > 0 && (i === consulta.termos.length - 1 ? ' e ' : ', ')}<mark className="achado">{t}</mark></span>)}</>}
                {consulta.excluir.length > 0 && <> sem {consulta.excluir.join(', ')}</>}
                {totalOcorrencias > 0 && <span style={{ color: 'var(--muted)' }}> · {totalOcorrencias === 1 ? '1 ocorrência' : totalOcorrencias + ' ocorrências'}</span>}
              </span>
              <span className="busca-dica">{semViuvas('"entre aspas" acha a expressão exata; -palavra tira da busca')}</span>
            </div>
          )}
          {temaFiltro && vista !== 'temas' && (
            <div className="busca-resumo" role="status">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{filtrados.length === 1 ? '1 sonho' : filtrados.length + ' sonhos'}</strong> com o tema
                <span className="chip" style={{ ...estiloTema(temaFiltro), height: 28, fontSize: 14 }}>{temaFiltro}</span>
              </span>
              <button type="button" className="btn btn-linha" style={{ minHeight: 34 }} onClick={tirarTema}><Fechar size={12} /> Ver todos</button>
            </div>
          )}

          {!carregado && <p className="carregando-resto" role="status"><span className="girando" aria-hidden="true" />{semViuvas('Abrindo o resto do acervo…')}</p>}
          {/* Linha do tempo à esquerda e filtros à direita, numa linha só quando cabe. */}
          {carregado && <div className="barra-periodo">
          {(vista === 'mural' || vista === 'lista') && filtrados.length > 0 && (anos.length > 1 || filtrados.length > POR_VEZ) && (
            <LinhaDoTempo contagem={contagem} ano={ano} mes={mes} aoEscolher={escolherPeriodo} comTodos={comFiltro || anos.length > 1} />
          )}
          {vista === 'calendario' && filtrados.length > 0 && (
            <LinhaDoTempo contagem={contagem} ano={calAno} mes={calMes} aoEscolher={(a, m) => mudarMes(a, m || ultimoMes(a))} comMeses mesObrigatorio semTotal />
          )}
          {vista !== 'temas' && (semTitulo > 0 || semTema > 0 || nFavoritos > 0 || sonhos.some((x) => x.status === 'dar_atencao')) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' }}>
              {nFavoritos > 0 && (
                <button type="button" className="btn btn-linha filtro" onClick={() => { setSoFavoritos(!soFavoritos); voltarPrimeira(); }} aria-pressed={soFavoritos} style={{ minHeight: 36, background: soFavoritos ? '#FFF4D6' : '#fff' }}>
                  <span style={{ color: '#C98A00', display: 'inline-flex' }}><Estrela size={15} cheia /></span>favoritos · {nFavoritos}
                </button>
              )}
              {semTitulo > 0 && (
                <button type="button" className="btn btn-linha filtro" onClick={() => { setSoSemTitulo(!soSemTitulo); voltarPrimeira(); }} aria-pressed={soSemTitulo} style={{ minHeight: 36, background: soSemTitulo ? 'var(--cinza)' : '#fff' }}>
                  <span className="filtro-icone"><Titulo size={14} /></span>sem título · {semTitulo}
                </button>
              )}
              {semTema > 0 && (
                <button type="button" className="btn btn-linha filtro" onClick={() => { setSoSemTema(!soSemTema); voltarPrimeira(); }} aria-pressed={soSemTema} style={{ minHeight: 36, background: soSemTema ? 'var(--cinza)' : '#fff' }}>
                  <span className="filtro-icone"><Tema size={14} /></span>sem tema · {semTema}
                </button>
              )}
              {sonhos.some((x) => x.status === 'dar_atencao') && <button type="button" className="btn btn-linha filtro" onClick={() => { setSoAtencao(!soAtencao); voltarPrimeira(); }} aria-pressed={soAtencao} style={{ minHeight: 36, background: soAtencao ? 'var(--warn-bg)' : '#fff' }}>
                <span className="ponto" style={{ background: STATUS.dar_atencao.cor }} />só “dar atenção”
              </button>}
            </div>
          )}
          </div>}
          {vista === 'mural' && <MuralEmLinhas>{visiveis.map((s) => <Nota key={s.id} s={s} achado={achados.get(s.id)} />)}</MuralEmLinhas>}
          {vista === 'lista' && <ListaSonhos sonhos={visiveis} achados={achados} />}
          {vista === 'calendario' && <Calendario sonhos={filtrados} ano={calAno} mes={calMes} aoMudarMes={mudarMes}
            renderSonhos={(l) => <MuralEmLinhas>{l.map((s) => <Nota key={s.id} s={s} achado={achados.get(s.id)} />)}</MuralEmLinhas>} />}
          {(vista === 'mural' || vista === 'lista') && doPeriodo.length > limite && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0 8px' }}>
              <button type="button" className="btn btn-linha" onClick={() => setLimite((n) => n + POR_VEZ)}>Mostrar mais {Math.min(POR_VEZ, doPeriodo.length - limite)}</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{limite} de {doPeriodo.length}</span>
            </div>
          )}
          {vista === 'temas' && <PorTema sonhos={filtrados} temas={temas} achados={achados} />}
          {filtrados.length === 0 && <p style={{ color: 'var(--muted)' }}>{consulta.vazia ? 'Nenhum sonho com esse filtro.' : semViuvas('Nenhum sonho com essa busca. Tente o começo da palavra ou menos palavras.')}</p>}
        </>
      )}

      {mostrarExemplos && (
        <section aria-label="Sonhos de exemplo" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: sonhos.length ? 12 : 0 }}>
          <FaixaExemplos n={exemplos.length} semSonhos={sonhos.length === 0} aoEsconder={esconderExemplos} />
          <MuralEmLinhas>{exemplos.map((s) => <NotaExemplo key={s.id} s={s} aoAbrir={setExemploAberto} />)}</MuralEmLinhas>
        </section>
      )}
      {exemploAberto && <SonhoExemplo s={exemploAberto} aoFechar={() => setExemploAberto(null)} />}
    </div>
  );
}

function ListaSonhos({ sonhos, achados }) {
  const estiloTema = useCorTema();
  const { comentarios } = useEstado();
  const navegar = useNavigate();
  let mesAtual = '';
  return (
    <div className="painel" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['Data', 'Sonho', 'Temas', 'Status', 'Áudio'].map((h) => <th key={h} className="rotulo" style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: '#F7F8FA' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {sonhos.map((s) => {
            const m = mesAno(s.sonhado_em);
            const cab = m !== mesAtual ? (mesAtual = m) : null;
            const a = achados?.get(s.id);
            const termos = a?.termos;
            return [
              cab && <tr key={'m' + m}><td colSpan={5} className="rotulo" style={{ padding: '16px 14px 8px' }}>{m}</td></tr>,
              <tr key={s.id} className="linha-clicavel" onClick={(e) => { if (!e.target.closest('a')) navegar('/app/sonho/' + s.id); }} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>{new Date(s.sonhado_em).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 14px' }}>
                  {s.favorito && <span style={{ color: '#C98A00', marginRight: 6, verticalAlign: '-2px', display: 'inline-flex' }} aria-label="Favorito"><Estrela size={15} cheia /></span>}
                  <Link to={'/app/sonho/' + s.id} className="sigilo" style={{ color: 'var(--ink)', fontWeight: 800, textDecoration: 'none' }}>{s.titulo?.trim() ? <Realce texto={s.titulo} termos={termos} viuvas={false} /> : <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Sem título</span>}</Link>
                  {a?.ocorrencias > 0 && <span className="contagem-achados" style={{ marginLeft: 8 }}>{a.ocorrencias}×</span>}
                  {comentarios?.[s.id] && <span style={{ marginLeft: 8, verticalAlign: '1px' }}><SinalComentarios r={comentarios[s.id]} /></span>}
                  {(a?.trecho || s.texto) && <div className="sigilo" style={{ fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, maxWidth: 520, ...(a?.trecho ? { lineHeight: 1.5 } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>
                    {a?.onde === 'amplificacoes' && <strong style={{ fontFamily: 'inherit' }}>Nas amplificações: </strong>}
                    <Realce texto={a?.trecho || s.texto} termos={termos} viuvas={false} />
                  </div>}
                </td>
                <td style={{ padding: '12px 14px' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260 }}>{(s.temas || []).map((t) => <span key={t} className="chip" style={estiloTema(t)}><Realce texto={t} termos={termos} viuvas={false} /></span>)}</div></td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Status s={s.status} cor="var(--ink)" /></td>
                <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: 13 }}>{s.audio ? duracao(s.audio.duracao) : '—'}</td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

// Juntar temas: troca os temas marcados por um só, em todos os sonhos de uma vez.
// Com um tema marcado, serve para renomear.
function JuntarTemas({ temas, aoFechar }) {
  const { sonhos, salvarVarios, avisar } = useEstado();
  const estiloTema = useCorTema();
  const [marcados, setMarcados] = useState([]);
  const [nome, setNome] = useState('');
  const [filtro, setFiltro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const alternar = (t) => setMarcados((m) => {
    const prox = m.includes(t) ? m.filter((x) => x !== t) : [...m, t];
    // O nome sugerido é o do tema mais usado entre os marcados.
    if (!nome.trim() || m.includes(nome.trim())) setNome(temas.find((x) => prox.includes(x.nome))?.nome || '');
    return prox;
  });
  const final = nome.trim();
  const afetados = sonhos.filter((s) => s.temas?.some((t) => marcados.includes(t)));
  const visiveis = temas.filter((t) => !filtro.trim() || t.nome.toLowerCase().includes(filtro.trim().toLowerCase()));
  const pode = final && marcados.length && !(marcados.length === 1 && marcados[0] === final);

  async function juntar() {
    if (!pode) return;
    const msg = marcados.length === 1 ? `Renomear “${marcados[0]}” para “${final}” em ${afetados.length === 1 ? '1 sonho' : afetados.length + ' sonhos'}?`
      : `Juntar ${marcados.length} temas em “${final}”? Muda ${afetados.length === 1 ? '1 sonho' : afetados.length + ' sonhos'}.`;
    if (!confirm(msg)) return;
    setOcupado(true);
    const novos = afetados.map((s) => ({ ...s, temas: [...new Set(s.temas.map((t) => (marcados.includes(t) ? final : t)))] }));
    await salvarVarios(novos);
    setOcupado(false);
    avisar(marcados.length === 1 ? 'Tema renomeado' : marcados.length + ' temas viraram “' + final + '”');
    aoFechar();
  }

  return (
    <Janela titulo="Juntar ou renomear temas" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Marque os temas que são a mesma coisa (ex.: “mãe” e “minha mãe”) e escolha o nome que fica. Para renomear, marque só um.')}</p>
      {temas.length > 12 && <input className="campo" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Procurar tema" style={{ fontSize: 16 }} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 280, overflowY: 'auto', padding: 2 }}>
        {visiveis.map((t) => { const on = marcados.includes(t.nome); return (
          <button key={t.nome} type="button" aria-pressed={on} onClick={() => alternar(t.nome)}
            style={{ ...estiloTema(t.nome), height: 34, padding: '0 12px 0 8px', borderRadius: 6, border: 0, fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: on ? 1 : 0.6 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{on && '✓'}</span>
            {t.nome} <span style={{ opacity: 0.7, fontWeight: 500 }}>{t.n}</span>
          </button>); })}
      </div>
      {marcados.length > 0 && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
          {marcados.length === 1 ? 'Novo nome' : 'Nome do tema que fica'}
          <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} list="temas-juntar" style={{ fontWeight: 400, fontSize: 16 }} />
          <datalist id="temas-juntar">{marcados.map((t) => <option key={t} value={t} />)}</datalist>
        </label>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-linha" onClick={aoFechar}>Cancelar</button>
        <button type="button" className="btn btn-azul" onClick={juntar} disabled={!pode || ocupado}>
          {ocupado ? 'Salvando…' : marcados.length > 1 ? `Juntar ${marcados.length} temas` : 'Renomear'}
        </button>
      </div>
    </Janela>
  );
}

function PorTema({ sonhos, temas, achados }) {
  const estiloTema = useCorTema();
  const { sonhos: todos, laboratorio } = useEstado();
  const [juntando, setJuntando] = useState(false);
  const [params, setParams] = useSearchParams();
  const alvo = params.get('t');
  // Com o laboratório aberto, tocar num tema abre o retrato dele (?r=tema, para voltar do sonho e continuar aberto).
  const retrato = laboratorio ? params.get('r') || '' : '';
  const r = useMemo(() => (retrato ? retratoDoTema(todos, retrato) : null), [retrato, todos]);
  const irPara = (nome) => setTimeout(() => document.getElementById('tema-' + encodeURIComponent(nome))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  const abrirRetrato = (nome, fechar) => {
    const novo = new URLSearchParams(params);
    if (fechar) novo.delete('r'); else novo.set('r', nome);
    setParams(novo, { replace: true });
    irPara(nome);
  };
  useEffect(() => {
    if (alvo) irPara(alvo);
  }, [alvo]);
  useEffect(() => {
    if (retrato) irPara(retrato);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const semTema = sonhos.filter((s) => !s.temas?.length);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <aside className="painel" style={{ flex: '1 1 220px', maxWidth: 280, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="rotulo" style={{ margin: '0 8px 8px' }}>Temas por frequência</span>
        {laboratorio && <span style={{ margin: '-4px 8px 10px', fontSize: 12.5, lineHeight: 1.45, color: 'var(--azul)' }}>{semViuvas('Laboratório aberto: toque num tema para ver o retrato dele.')}</span>}
        {temas.length > 1 && <button type="button" className="btn btn-tracejado" style={{ margin: '0 8px 10px', minHeight: 36, fontSize: 13 }} onClick={() => setJuntando(true)}>Juntar ou renomear temas</button>}
        {temas.map((t) => <a key={t.nome} href={'#tema-' + encodeURIComponent(t.nome)} aria-current={retrato === t.nome ? 'true' : undefined} onClick={(e) => { e.preventDefault(); if (laboratorio) abrirRetrato(t.nome); else irPara(t.nome); }} style={{ minHeight: 40, padding: '0 10px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ink)', textDecoration: 'none', fontWeight: 600, background: retrato === t.nome ? 'var(--azul-claro)' : undefined }}><span className="chip" style={estiloTema(t.nome)}>{t.nome}</span><span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.n}</span></a>)}
        {semTema.length > 0 && <div className="aviso" style={{ margin: '10px 8px 0' }}><strong>{semTema.length} sem tema.</strong> <Link to="/app/acervo?st=1" style={{ color: 'inherit' }}>Ver só esses</Link> e abrir cada um para etiquetar.</div>}
      </aside>
      {juntando && <JuntarTemas temas={temas} aoFechar={() => setJuntando(false)} />}
      <div style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {temas.map((t) => {
          const lista = sonhos.filter((s) => s.temas?.includes(t.nome));
          if (!lista.length) return null;
          const desde = lista[lista.length - 1].sonhado_em;
          const aberto = retrato === t.nome;
          const nome = <span className="sigilo-tag" style={{ ...estiloTema(t.nome), padding: '0 10px', borderRadius: 6 }}>{t.nome}</span>;
          return (
            <section key={t.nome} id={'tema-' + encodeURIComponent(t.nome)} className="painel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 84 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                  <h2 className="titulo-m" style={{ fontSize: 32 }}>
                    {laboratorio
                      ? <button type="button" className="tema-clicavel" aria-expanded={aberto} title={aberto ? 'Fechar o retrato' : 'Ver o retrato deste tema'} onClick={() => abrirRetrato(t.nome, aberto)}>{nome}</button>
                      : nome}
                  </h2>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{lista.length === 1 ? '1 sonho' : lista.length + ' sonhos'} · desde {mesAno(desde).toLowerCase()} · o último em {dataCurta(lista[0].sonhado_em)}</span>
                </div>
                {laboratorio && !aberto && <button type="button" className="btn btn-linha" style={{ minHeight: 34, color: 'var(--azul)' }} onClick={() => abrirRetrato(t.nome)}>Ver o retrato</button>}
              </div>
              {aberto && <RetratoTema r={r} aoFechar={() => abrirRetrato(t.nome, true)} />}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {lista.slice(0, achados?.size ? 24 : 8).map((s) => <Nota key={s.id} s={s} comTemas achado={achados?.get(s.id)} />)}
              </div>
              {lista.length > (achados?.size ? 24 : 8) && <Link className="btn btn-linha" style={{ alignSelf: 'flex-start' }} to={'/app/acervo?tema=' + encodeURIComponent(t.nome)}>Ver os {lista.length} sonhos</Link>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
