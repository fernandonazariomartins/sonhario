import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { STATUS, CORES, dataCurta, mesAno, duracao, contarTemas } from '../lib/sonhos.js';
import { Mural, Lista, Tema, Busca, Mic } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

function Status({ s, cor }) {
  const st = STATUS[s] || STATUS.nao_aberto;
  return <span className="status" style={{ color: cor }}><span className="ponto" style={{ background: st.cor }} />{st.rotulo}</span>;
}

function Nota({ s, comTemas = false }) {
  const estiloTema = useCorTema();
  const c = CORES[s.cor] || CORES.branco;
  return (
    <Link to={'/app/sonho/' + s.id} className="nota" style={{ background: c.fundo }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(s.sonhado_em)}</span>
        {s.audio && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c.rotulo }}><Mic size={12} w={2.4} />{duracao(s.audio.duracao)}</span>}
      </div>
      {s.titulo?.trim() && <h3>{semViuvas(s.titulo)}</h3>}
      {s.texto ? <p>{semViuvas(s.texto)}</p> : !s.titulo?.trim() && <p style={{ color: c.rotulo, fontStyle: 'italic' }}>{s.audio ? 'Só o áudio' : 'Sem título'}</p>}
      {comTemas && s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{s.temas.map((t) => <span key={t} className="chip" style={estiloTema(t)}>{t}</span>)}</div>}
      <Status s={s.status} cor={c.rotulo} />
    </Link>
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
  const { sonhos } = useEstado();
  const [params, setParams] = useSearchParams();
  const vista = params.get('v') || 'mural';
  const [busca, setBusca] = useState('');
  const [soAtencao, setSoAtencao] = useState(false);
  const POR_PAGINA = 50;
  const [limite, setLimite] = useState(POR_PAGINA);
  useEffect(() => { setLimite(POR_PAGINA); }, [busca, soAtencao, vista]);

  const temas = useMemo(() => contarTemas(sonhos), [sonhos]);
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return sonhos.filter((s) =>
      (vista === 'temas' || !soAtencao || s.status === 'dar_atencao') &&
      (!q || [s.titulo, s.texto, ...(s.temas || []), ...(s.conclusoes || []).map((c) => c.texto)].join(' ').toLowerCase().includes(q)));
  }, [sonhos, busca, soAtencao, vista]);

  const mudar = (v) => setParams(v === 'mural' ? {} : { v });
  const aba = (v, Icone, nome) => (
    <button type="button" className={'aba' + (vista === v ? ' ativa' : '')} aria-pressed={vista === v} onClick={() => mudar(v)}><Icone size={16} />{nome}</button>
  );

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <h1 className="titulo-m" style={{ marginRight: 'auto' }}>{sonhos.length === 1 ? '1 sonho' : sonhos.length + ' sonhos'}</h1>
        <label className="busca"><Busca size={18} /><span className="sr">Buscar nos sonhos</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar: palavra, pessoa, lugar" />
        </label>
        <div className="abas" role="group" aria-label="Visualização">{aba('mural', Mural, 'Mural')}{aba('lista', Lista, 'Lista')}{aba('temas', Tema, 'Temas')}</div>
      </div>

      {sonhos.length === 0 ? <Vazio /> : (
        <>
          {vista !== 'temas' && sonhos.some((x) => x.status === 'dar_atencao') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-linha" onClick={() => setSoAtencao(!soAtencao)} aria-pressed={soAtencao} style={{ minHeight: 36, background: soAtencao ? 'var(--warn-bg)' : '#fff' }}>
                <span className="ponto" style={{ background: STATUS.dar_atencao.cor }} />só “dar atenção”
              </button>
            </div>
          )}

          {vista === 'mural' && <div className="mural">{filtrados.slice(0, limite).map((s) => <Nota key={s.id} s={s} />)}</div>}
          {vista === 'lista' && <ListaSonhos sonhos={filtrados.slice(0, limite)} />}
          {vista !== 'temas' && filtrados.length > limite && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0 16px' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Mostrando {limite} de {filtrados.length}</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="btn btn-linha" onClick={() => setLimite(limite + POR_PAGINA)}>Mostrar mais {Math.min(POR_PAGINA, filtrados.length - limite)}</button>
                <button type="button" className="btn" style={{ color: 'var(--muted)' }} onClick={() => setLimite(filtrados.length)}>Mostrar todos</button>
              </div>
            </div>
          )}
          {vista === 'temas' && <PorTema sonhos={filtrados} temas={temas} />}
          {filtrados.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum sonho com esse filtro.</p>}
        </>
      )}
    </div>
  );
}

function ListaSonhos({ sonhos }) {
  let mesAtual = '';
  return (
    <div className="painel" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['Data', 'Sonho', 'Status', 'Áudio'].map((h) => <th key={h} className="rotulo" style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: '#F7F8FA' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {sonhos.map((s) => {
            const m = mesAno(s.sonhado_em);
            const cab = m !== mesAtual ? (mesAtual = m) : null;
            return [
              cab && <tr key={'m' + m}><td colSpan={4} className="rotulo" style={{ padding: '16px 14px 8px' }}>{m}</td></tr>,
              <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>{new Date(s.sonhado_em).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <Link to={'/app/sonho/' + s.id} style={{ color: 'var(--ink)', fontWeight: 800, textDecoration: 'none' }}>{s.titulo?.trim() || <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Sem título</span>}</Link>
                  {s.texto && <div style={{ fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.texto}</div>}
                </td>
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

function PorTema({ sonhos, temas }) {
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
                {lista.slice(0, 8).map((s) => <Nota key={s.id} s={s} comTemas />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
