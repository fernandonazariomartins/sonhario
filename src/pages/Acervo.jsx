import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { STATUS, CORES, dataCurta, dataLonga, mesAno, duracao, contarTemas } from '../lib/sonhos.js';
import Janela from '../components/Janela.jsx';
import { Mural, Lista, Tema, Busca, Mic } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { interpretar, casar } from '../lib/busca.js';
import Realce from '../components/Realce.jsx';

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

export function Nota({ s, comTemas = true, para, achado }) {
  const estiloTema = useCorTema();
  const c = CORES[s.cor] || CORES.branco;
  const termos = achado?.termos;
  return (
    <Link to={para || '/app/sonho/' + s.id} className="nota" style={{ background: c.fundo }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(s.sonhado_em)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {achado?.ocorrencias > 0 && <span className="contagem-achados" title="Vezes que a busca aparece neste sonho">{achado.ocorrencias}×</span>}
          {s.audio && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c.rotulo }}><Mic size={12} w={2.4} />{duracao(s.audio.duracao)}</span>}
        </span>
      </div>
      {s.titulo?.trim() && <h3><Realce texto={s.titulo} termos={termos} /></h3>}
      {achado?.trecho
        ? <p>{achado.onde === 'amplificacoes' && <span className="rotulo-forte" style={{ display: 'block', color: c.rotulo, fontFamily: 'var(--sans, inherit)', fontStyle: 'normal' }}>Nas amplificações</span>}<Realce texto={achado.trecho} termos={termos} /></p>
        : s.texto ? <p><Realce texto={s.texto} termos={termos} /></p> : !s.titulo?.trim() && <p style={{ color: c.rotulo, fontStyle: 'italic' }}>{s.audio ? 'Só o áudio' : 'Sem título'}</p>}
      {comTemas && s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.temas.map((t) => <span key={t} className="chip" style={estiloTema(t)}><Realce texto={t} termos={termos} viuvas={false} /></span>)}</div>}
      <Status s={s.status} cor={c.rotulo} />
    </Link>
  );
}

// Sonho de exemplo: tracejado, com selo, e abre só para leitura (não existe no banco).
function NotaExemplo({ s, aoAbrir }) {
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
      <p className="leitura" style={{ margin: 0 }}>{semViuvas(s.texto)}</p>
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

export default function Acervo() {
  const { sonhos, exemplos, esconderExemplos } = useEstado();
  const [exemploAberto, setExemploAberto] = useState(null);
  const [params, setParams] = useSearchParams();
  const vista = params.get('v') || 'mural';
  const [busca, setBuscaLocal] = useState(() => params.get('q') || '');
  const campoBusca = useRef(null);
  const setBusca = (q) => {
    setBuscaLocal(q);
    const novo = new URLSearchParams(params);
    if (q) novo.set('q', q); else novo.delete('q');
    novo.delete('p');
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
  const [soAtencao, setSoAtencao] = useState(false);
  const [soSemTitulo, setSoSemTitulo] = useState(false);
  const semTitulo = useMemo(() => sonhos.filter((s) => !s.titulo?.trim()).length, [sonhos]);
  const POR_PAGINA = 100;
  const paginaUrl = Math.max(1, parseInt(params.get('p'), 10) || 1);
  const irPara = (n) => {
    const novo = new URLSearchParams(params);
    if (n <= 1) novo.delete('p'); else novo.set('p', String(n));
    setParams(novo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const voltarPrimeira = () => { if (params.get('p')) { const novo = new URLSearchParams(params); novo.delete('p'); setParams(novo, { replace: true }); } };

  const temas = useMemo(() => contarTemas(sonhos), [sonhos]);
  const consulta = useMemo(() => interpretar(busca), [busca]);
  const { filtrados, achados, totalOcorrencias } = useMemo(() => {
    const achados = new Map();
    let totalOcorrencias = 0;
    const filtrados = sonhos.filter((s) => {
      if (vista !== 'temas' && soAtencao && s.status !== 'dar_atencao') return false;
      if (vista !== 'temas' && soSemTitulo && s.titulo?.trim()) return false;
      if (consulta.vazia) return true;
      const r = casar(s, consulta);
      if (!r) return false;
      totalOcorrencias += r.ocorrencias;
      achados.set(s.id, { ...r, termos: consulta.termos });
      return true;
    });
    return { filtrados, achados, totalOcorrencias };
  }, [sonhos, consulta, soAtencao, soSemTitulo, vista]);

  const comFiltro = !!busca.trim() || soAtencao || soSemTitulo;
  const mostrarExemplos = exemplos.length > 0 && !comFiltro && (pagina0(params) || sonhos.length === 0);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pagina = Math.min(paginaUrl, totalPaginas);
  const daPagina = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const mudar = (v) => {
    const novo = {};
    if (v !== 'mural') novo.v = v;
    if (busca) novo.q = busca;
    setParams(novo);
  };
  const aba = (v, Icone, nome) => (
    <button type="button" className={'aba' + (vista === v ? ' ativa' : '')} aria-pressed={vista === v} onClick={() => mudar(v)}><Icone size={16} />{nome}</button>
  );

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <h1 className="titulo-m" style={{ marginRight: 'auto' }}>{sonhos.length === 0 ? 'Seu acervo' : sonhos.length === 1 ? '1 sonho' : sonhos.length + ' sonhos'}</h1>
        <label className="busca"><Busca size={18} /><span className="sr">Buscar nos sonhos</span>
          <input ref={campoBusca} type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setBusca(''); e.currentTarget.blur(); } }}
            placeholder="Buscar: palavra, pessoa, lugar" enterKeyHint="search" autoComplete="off" spellCheck={false} />
          {busca ? <button type="button" className="busca-limpar" onClick={() => { setBusca(''); campoBusca.current?.focus(); }} aria-label="Limpar busca">×</button>
            : <kbd className="busca-atalho" aria-hidden="true">/</kbd>}
        </label>
        <div className="abas" role="group" aria-label="Visualização">{aba('mural', Mural, 'Mural')}{aba('lista', Lista, 'Lista')}{aba('temas', Tema, 'Temas')}</div>
      </div>

      {sonhos.length === 0 ? (!mostrarExemplos && <Vazio />) : (
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
          {vista !== 'temas' && (semTitulo > 0 || sonhos.some((x) => x.status === 'dar_atencao')) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
              {semTitulo > 0 && (
                <button type="button" className="btn btn-linha" onClick={() => { setSoSemTitulo(!soSemTitulo); voltarPrimeira(); }} aria-pressed={soSemTitulo} style={{ minHeight: 36, background: soSemTitulo ? 'var(--cinza)' : '#fff' }}>
                  sem título · {semTitulo}
                </button>
              )}
              {sonhos.some((x) => x.status === 'dar_atencao') && <button type="button" className="btn btn-linha" onClick={() => { setSoAtencao(!soAtencao); voltarPrimeira(); }} aria-pressed={soAtencao} style={{ minHeight: 36, background: soAtencao ? 'var(--warn-bg)' : '#fff' }}>
                <span className="ponto" style={{ background: STATUS.dar_atencao.cor }} />só “dar atenção”
              </button>}
            </div>
          )}

          {vista === 'mural' && <MuralEmLinhas>{daPagina.map((s) => <Nota key={s.id} s={s} achado={achados.get(s.id)} />)}</MuralEmLinhas>}
          {vista === 'lista' && <ListaSonhos sonhos={daPagina} achados={achados} />}
          {vista !== 'temas' && totalPaginas > 1 && (
            <Paginacao pagina={pagina} total={totalPaginas} irPara={irPara}
              legenda={`${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, filtrados.length)} de ${filtrados.length}`} />
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

const pagina0 = (params) => !params.get('p') || params.get('p') === '1';

function numerosDePagina(atual, total) {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  const nums = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 4) [2, 3, 4, 5].forEach((n) => nums.add(n));
  if (atual >= total - 3) [total - 4, total - 3, total - 2, total - 1].forEach((n) => nums.add(n));
  const ordenados = [...nums].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const saida = [];
  ordenados.forEach((n, i) => {
    if (i > 0 && n - ordenados[i - 1] > 1) saida.push('…' + n);
    saida.push(n);
  });
  return saida;
}

function Paginacao({ pagina, total, irPara, legenda }) {
  const base = { minWidth: 44, minHeight: 44, padding: '0 10px' };
  return (
    <nav aria-label="Páginas" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 16px' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <button type="button" className="btn btn-linha" style={base} disabled={pagina === 1} onClick={() => irPara(pagina - 1)} aria-label="Página anterior">‹</button>
        {numerosDePagina(pagina, total).map((n) => typeof n === 'string'
          ? <span key={n} style={{ minWidth: 24, textAlign: 'center', color: 'var(--muted)' }}>…</span>
          : <button key={n} type="button" className={'btn ' + (n === pagina ? 'btn-azul' : 'btn-linha')} style={base}
              aria-current={n === pagina ? 'page' : undefined} onClick={() => n !== pagina && irPara(n)}>{n}</button>)}
        <button type="button" className="btn btn-linha" style={base} disabled={pagina === total} onClick={() => irPara(pagina + 1)} aria-label="Próxima página">›</button>
      </div>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{legenda}</span>
    </nav>
  );
}

function ListaSonhos({ sonhos, achados }) {
  const estiloTema = useCorTema();
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
                  <Link to={'/app/sonho/' + s.id} style={{ color: 'var(--ink)', fontWeight: 800, textDecoration: 'none' }}>{s.titulo?.trim() ? <Realce texto={s.titulo} termos={termos} viuvas={false} /> : <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Sem título</span>}</Link>
                  {a?.ocorrencias > 0 && <span className="contagem-achados" style={{ marginLeft: 8 }}>{a.ocorrencias}×</span>}
                  {(a?.trecho || s.texto) && <div style={{ fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, maxWidth: 520, ...(a?.trecho ? { lineHeight: 1.5 } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>
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

function PorTema({ sonhos, temas, achados }) {
  const estiloTema = useCorTema();
  const [params] = useSearchParams();
  const alvo = params.get('t');
  useEffect(() => {
    if (alvo) setTimeout(() => document.getElementById('tema-' + encodeURIComponent(alvo))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [alvo]);
  const semTema = sonhos.filter((s) => !s.temas?.length);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <aside className="painel" style={{ flex: '1 1 220px', maxWidth: 280, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="rotulo" style={{ margin: '0 8px 8px' }}>Temas por frequência</span>
        {temas.map((t) => <a key={t.nome} href={'#tema-' + encodeURIComponent(t.nome)} onClick={(e) => { e.preventDefault(); document.getElementById('tema-' + encodeURIComponent(t.nome))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} style={{ minHeight: 40, padding: '0 10px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}><span className="chip" style={estiloTema(t.nome)}>{t.nome}</span><span style={{ color: 'var(--muted)', fontSize: 13 }}>{t.n}</span></a>)}
        {semTema.length > 0 && <div className="aviso" style={{ margin: '10px 8px 0' }}><strong>{semTema.length} sem tema.</strong> Abra o sonho para etiquetar.</div>}
      </aside>
      <div style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {temas.map((t) => {
          const lista = sonhos.filter((s) => s.temas?.includes(t.nome));
          if (!lista.length) return null;
          const desde = lista[lista.length - 1].sonhado_em;
          return (
            <section key={t.nome} id={'tema-' + encodeURIComponent(t.nome)} className="painel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 84 }}>
              <div>
                <h2 className="titulo-m" style={{ fontSize: 32 }}><span style={{ ...estiloTema(t.nome), padding: '0 10px', borderRadius: 6 }}>{t.nome}</span></h2>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{lista.length === 1 ? '1 sonho' : lista.length + ' sonhos'} · desde {mesAno(desde).toLowerCase()} · o último em {dataCurta(lista[0].sonhado_em)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {lista.slice(0, achados?.size ? 24 : 8).map((s) => <Nota key={s.id} s={s} comTemas achado={achados?.get(s.id)} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
