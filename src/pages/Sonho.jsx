import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { STATUS, CORES, dataLonga, dataCurta, tituloDe, contarTemas, novoId, duracao, paraCampoData, deCampoData } from '../lib/sonhos.js';
import { transcricaoNoServidor, transcreverAudio } from '../lib/transcrever.js';
import { Voltar, Fechar, Mais, Lixo, Ok, Calendario } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

export default function Sonho() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { sonhos, salvar, apagar, urlAudio, usuario, avisar } = useEstado();
  const original = sonhos.find((s) => s.id === id);
  const [s, setS] = useState(original);
  const [novoTema, setNovoTema] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [origem, setOrigem] = useState('sozinho');
  const [audioUrl, setAudioUrl] = useState(null);
  const [editandoData, setEditandoData] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const timer = useRef(null);

  // Troca de sonho, ou chegou uma versão mais nova (ex.: transcrição terminada depois de guardar).
  useEffect(() => {
    if (!original) return;
    setS((atual) => (!atual || atual.id !== original.id || original.atualizado_em > atual.atualizado_em ? original : atual));
  }, [original]);
  useEffect(() => {
    let vivo = true;
    if (s?.audio?.ref) urlAudio(s.audio.ref).then((u) => vivo && setAudioUrl(u));
    return () => { vivo = false; };
  }, [s?.audio?.ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentes = useMemo(() => contarTemas(sonhos).map((t) => t.nome).filter((t) => !s?.temas?.includes(t)).slice(0, 6), [sonhos, s?.temas]);
  const parecidos = useMemo(() => !s ? [] : sonhos.filter((x) => x.id !== s.id && x.temas?.some((t) => s.temas?.includes(t))).slice(0, 6), [sonhos, s]);

  if (!s) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>Esse sonho não está aqui.</p>
      <Link to="/app/acervo">Voltar para o acervo</Link>
    </div>
  );

  // Salva sozinho, meio segundo depois da última mudança.
  function mudar(parcial, imediato = false) {
    const prox = { ...s, ...parcial };
    setS(prox);
    clearTimeout(timer.current);
    if (imediato) salvar(prox); else timer.current = setTimeout(() => salvar(prox), 500);
  }
  const addTema = (t) => { const nome = t.trim(); if (nome && !s.temas.includes(nome)) mudar({ temas: [...s.temas, nome] }, true); setNovoTema(''); };
  async function transcrever() {
    setTranscrevendo(true);
    try {
      const url = audioUrl || await urlAudio(s.audio.ref);
      const blob = await (await fetch(url)).blob();
      const txt = await transcreverAudio(blob);
      if (txt) mudar({ texto: [s.texto, txt].filter(Boolean).join('\n\n') }, true);
      else avisar('Não encontrei fala no áudio.');
    } catch { avisar('Não deu para transcrever agora.'); }
    setTranscrevendo(false);
  }
  const addConclusao = () => {
    if (!conclusao.trim()) return;
    mudar({ conclusoes: [{ id: novoId(), em: new Date().toISOString(), origem, texto: conclusao.trim() }, ...(s.conclusoes || [])], status: s.status === 'nao_aberto' ? 'aberto' : s.status }, true);
    setConclusao('');
  };

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to="/app/acervo" className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> Acervo</Link>
        {params.get('novo') && <span style={{ height: 28, padding: '0 10px', borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ok size={14} /> guardado</span>}
      </div>

      <article className="painel" style={{ flex: '999 1 560px', minWidth: 0, padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {editandoData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="quando" className="rotulo">Quando sonhou</label>
            <input id="quando" type="datetime-local" value={paraCampoData(s.sonhado_em)}
              onChange={(e) => { const iso = deCampoData(e.target.value); if (iso) mudar({ sonhado_em: iso }); }}
              style={{ height: 40, padding: '0 10px', border: '1px solid var(--line-strong)', borderRadius: 10, fontSize: 15 }} />
            <button type="button" className="btn btn-linha" style={{ minHeight: 40 }} onClick={() => setEditandoData(false)}><Ok size={16} /> ok</button>
          </div>
        ) : (
          <button type="button" className="data-editavel" onClick={() => setEditandoData(true)} aria-label={'Data do sonho: ' + dataLonga(s.sonhado_em) + '. Mudar a data'}>
            <Calendario size={14} /> {dataLonga(s.sonhado_em)} <span className="data-mudar">mudar</span>
          </button>
        )}
        <label className="sr" htmlFor="titulo">Título</label>
        <input id="titulo" value={s.titulo} onChange={(e) => mudar({ titulo: e.target.value })} placeholder={'Sem título'}
          className="titulo-m" style={{ border: 0, padding: 0, outline: 'none', width: '100%', background: 'transparent', fontFamily: 'var(--sans)' }} />

        {s.audio && (
          <div style={{ background: '#F7F8FA', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            {audioUrl ? <audio src={audioUrl} controls style={{ flex: 1, height: 40 }} /> : <span style={{ fontSize: 13, color: 'var(--muted)', padding: 8 }}>Carregando o áudio…</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{duracao(s.audio.duracao)}</span>
          </div>
        )}
        {s.audio && transcricaoNoServidor && usuario && (
          <button type="button" className="btn btn-tracejado" style={{ alignSelf: 'flex-start' }} onClick={transcrever} disabled={transcrevendo}>
            {transcrevendo ? 'Transcrevendo o áudio…' : s.texto ? 'Transcrever o áudio de novo (soma ao texto)' : 'Transformar o áudio em texto'}
          </button>
        )}

        <label className="sr" htmlFor="relato">Relato do sonho</label>
        <textarea id="relato" value={s.texto} onChange={(e) => mudar({ texto: e.target.value })} placeholder="O que você lembra do sonho…" rows={8}
          className="leitura" style={{ border: 0, padding: 0, resize: 'vertical', outline: 'none', width: '100%', maxWidth: 680, background: 'transparent', fontSize: 19, lineHeight: 1.75 }} />

        <section aria-labelledby="t-temas" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          <h2 id="t-temas" className="rotulo">Temas</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {s.temas.map((t) => (
              <span key={t} style={{ height: 32, padding: '0 4px 0 12px', borderRadius: 999, background: 'var(--cinza)', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{t}
                <button type="button" onClick={() => mudar({ temas: s.temas.filter((x) => x !== t) }, true)} aria-label={'Tirar o tema ' + t} style={{ width: 28, height: 28, border: 0, background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}><Fechar size={12} /></button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); addTema(novoTema); }} style={{ display: 'inline-flex' }}>
              <label className="sr" htmlFor="novo-tema">Novo tema</label>
              <input id="novo-tema" value={novoTema} onChange={(e) => setNovoTema(e.target.value)} placeholder="+ novo tema" list="temas-existentes"
                style={{ height: 32, width: 140, padding: '0 12px', border: '1.5px dashed var(--node)', borderRadius: 999, fontSize: 13 }} />
              <datalist id="temas-existentes">{contarTemas(sonhos).map((t) => <option key={t.nome} value={t.nome} />)}</datalist>
            </form>
          </div>
          {recentes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Usados antes:</span>
              {recentes.map((t) => <button key={t} type="button" onClick={() => addTema(t)} style={{ height: 32, padding: '0 10px', borderRadius: 999, border: '1px solid var(--line-strong)', background: '#fff', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t}</button>)}
            </div>
          )}
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo" id="t-status">Status</span>
            <div role="radiogroup" aria-labelledby="t-status" className="abas">
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={s.status === k} className={'aba' + (s.status === k ? ' ativa' : '')} onClick={() => mudar({ status: k }, true)}>
                  <span className="ponto" style={{ background: v.cor }} />{v.rotulo}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo" id="t-cor">Cor no mural</span>
            <div role="radiogroup" aria-labelledby="t-cor" style={{ display: 'flex', gap: 6 }}>
              {Object.entries(CORES).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={s.cor === k} aria-label={k} onClick={() => mudar({ cor: k }, true)}
                  style={{ width: 32, height: 32, borderRadius: 999, background: v.fundo, border: s.cor === k ? '2px solid var(--ink)' : '1px solid var(--line-strong)' }} />
              ))}
            </div>
          </div>
        </div>

        {parecidos.length > 0 && (
          <section aria-labelledby="t-parecidos" style={{ borderTop: '1px solid var(--line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 id="t-parecidos" className="rotulo">Outros sonhos com os mesmos temas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {parecidos.map((x) => { const c = CORES[x.cor] || CORES.branco; return (
                <Link key={x.id} to={'/app/sonho/' + x.id} style={{ background: c.fundo, borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 12, color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(x.sonhado_em)}</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{tituloDe(x)}</span>
                </Link>); })}
            </div>
          </section>
        )}

        <button type="button" className="btn btn-linha" style={{ alignSelf: 'flex-start', color: 'var(--danger)', borderColor: '#F1C4BF' }}
          onClick={() => { if (confirm('Apagar este sonho? Não dá para desfazer.')) { apagar(s.id); navegar('/app/acervo'); } }}>
          <Lixo size={16} /> Apagar sonho
        </button>
      </article>

      <aside aria-labelledby="t-conc" style={{ flex: '1 1 340px', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 id="t-conc" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Amplificações</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{(s.conclusoes || []).length || 'nenhuma'} {(s.conclusoes || []).length === 1 ? 'anotação' : (s.conclusoes || []).length ? 'anotações' : 'ainda'}</span>
          </div>
          <label className="sr" htmlFor="conclusao">Nova amplificação</label>
          <textarea id="conclusao" value={conclusao} onChange={(e) => setConclusao(e.target.value)} placeholder="Que imagens, lembranças ou mitos esse sonho evoca?" rows={4}
            className="leitura" style={{ border: '1px solid var(--line-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.6, resize: 'vertical' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <div role="radiogroup" aria-label="Quando foi" className="abas">
              {[['sozinho', 'sozinho'], ['sessao', 'na sessão']].map(([k, r]) => (
                <button key={k} type="button" role="radio" aria-checked={origem === k} className={'aba' + (origem === k ? ' ativa' : '')} onClick={() => setOrigem(k)}>{r}</button>
              ))}
            </div>
            <button type="button" className="btn btn-azul" style={{ marginLeft: 'auto' }} onClick={addConclusao}><Mais size={16} /> Guardar</button>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(s.conclusoes || []).map((c) => (
              <li key={c.id} style={{ paddingLeft: 14, borderLeft: '2px solid var(--node)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(c.em)} · {c.origem === 'sessao' ? 'depois da sessão' : 'sozinho'}</span>
                <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{semViuvas(c.texto)}</p>
                <button type="button" onClick={() => mudar({ conclusoes: s.conclusoes.filter((x) => x.id !== c.id) }, true)} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>apagar</button>
              </li>
            ))}
          </ol>
        </div>
        <label className="painel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!s.levar_sessao} onChange={(e) => mudar({ levar_sessao: e.target.checked }, true)} style={{ width: 20, height: 20, accentColor: 'var(--azul)', flex: 'none' }} />
          <span style={{ fontSize: 14, lineHeight: 1.45 }}><strong>Levar para a próxima sessão</strong><br /><span style={{ color: 'var(--muted)' }}>Fica marcado para você lembrar antes da análise.</span></span>
        </label>
        <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas('As amplificações são suas. O Sonhário não interpreta sonhos e não substitui a sua análise.')}</p>
      </aside>
    </div>
  );
}
