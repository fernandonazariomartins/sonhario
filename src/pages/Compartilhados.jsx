// Sonhos que outras pessoas compartilharam comigo (pacientes e amigos). Só leitura.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { PAPEIS, sonhosDe, urlAudioCompartilhado, desfazer } from '../lib/compartilhar.js';
import { STATUS, dataLonga, dataCurta, tituloDe, duracao, contarTemas } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { Nota, Status } from './Acervo.jsx';
import { Voltar, Avancar, Busca, Calendario, Pessoas } from '../components/Icones.jsx';

function useSonhosDe(donoId) {
  const [estado, setEstado] = useState({ carregando: true, sonhos: [], erro: '' });
  useEffect(() => {
    let vivo = true;
    setEstado({ carregando: true, sonhos: [], erro: '' });
    sonhosDe(donoId)
      .then((sonhos) => vivo && setEstado({ carregando: false, sonhos, erro: '' }))
      .catch((e) => vivo && setEstado({ carregando: false, sonhos: [], erro: e.message }));
    return () => { vivo = false; };
  }, [donoId]);
  return estado;
}

export default function Compartilhados() {
  const { dono, id } = useParams();
  const { compartilhamentos } = useEstado();
  const c = compartilhamentos.comigo.find((x) => x.dono_id === dono);
  if (!dono) return <Pessoas_ />;
  if (!c) return <Vazio texto="Esses sonhos não estão mais compartilhados com você." />;
  return id ? <SonhoLido c={c} id={id} /> : <SonhosDaPessoa c={c} />;
}

function Vazio({ texto }) {
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
      <div className="painel" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Pessoas size={24} /></span>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 440, lineHeight: 1.6 }}>{semViuvas(texto)}</p>
        <Link className="btn btn-linha" to="/app/acervo">Ir para o meu acervo</Link>
      </div>
    </div>
  );
}

function Pessoas_() {
  const { compartilhamentos, usuario } = useEstado();
  const { comigo } = compartilhamentos;
  if (!comigo.length) return <Vazio texto={`Ninguém compartilhou sonhos com ${usuario?.email || 'você'} ainda. Quando um paciente ou amigo liberar o acesso para esse e-mail, os sonhos aparecem aqui.`} />;
  const grupos = ['terapeuta', 'amigo'].map((p) => [PAPEIS[p].grupo, comigo.filter((c) => c.papel === p)]).filter(([, l]) => l.length);
  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="titulo-m">Compartilhados com você</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Você vê só o que cada pessoa escolheu mostrar. Aqui é só leitura.')}</p>
      </div>
      {grupos.map(([nome, lista]) => (
        <section key={nome} aria-label={nome} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="rotulo">{nome}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {lista.map((c) => (
              <Link key={c.id} to={'/app/compartilhados/' + c.dono_id} className="painel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none' }}>
                <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--preto)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flex: 'none' }}>{(c.dono_nome || c.dono_email || '?').charAt(0).toUpperCase()}</span>
                <span style={{ minWidth: 0, marginRight: 'auto' }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{c.dono_nome || c.dono_email}</strong>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{c.escopo === 'todos' ? 'todos os sonhos' : 'sonhos escolhidos'}{c.ver_amplificacoes ? ' · com amplificações' : ''}</span>
                </span>
                <Avancar size={18} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SonhosDaPessoa({ c }) {
  const { carregando, sonhos, erro } = useSonhosDe(c.dono_id);
  const { recarregarCompartilhamentos, avisar } = useEstado();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState(''); // '' | 'sessao' | 'atencao'
  const nome = c.dono_nome || c.dono_email;
  const temas = useMemo(() => contarTemas(sonhos).slice(0, 8), [sonhos]);
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return sonhos.filter((s) =>
      (!filtro || (filtro === 'sessao' ? s.levar_sessao : s.status === 'dar_atencao')) &&
      (!q || [s.titulo, s.texto, ...(s.temas || []), ...(s.conclusoes || []).map((x) => x.texto)].join(' ').toLowerCase().includes(q)));
  }, [sonhos, busca, filtro]);
  const nSessao = sonhos.filter((s) => s.levar_sessao).length;
  const nAtencao = sonhos.filter((s) => s.status === 'dar_atencao').length;

  async function sair() {
    if (!confirm(`Deixar de ver os sonhos de ${nome}? Só ${nome.split(' ')[0]} pode liberar de novo.`)) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); navegar('/app/compartilhados'); } catch (e) { avisar('Não deu: ' + e.message); }
  }

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div><Link to="/app/compartilhados" className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> Compartilhados</Link></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ marginRight: 'auto' }}>
          <span className="rotulo">{c.papel === 'terapeuta' ? 'Paciente' : 'Amigo ou amiga'} · só leitura</span>
          <h1 className="titulo-m">{nome}</h1>
          {!carregando && <span style={{ fontSize: 14, color: 'var(--muted)' }}>{sonhos.length === 1 ? '1 sonho compartilhado' : sonhos.length + ' sonhos compartilhados'}</span>}
        </div>
        <label className="busca"><Busca size={18} /><span className="sr">Buscar nos sonhos de {nome}</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar: palavra, pessoa, lugar" />
        </label>
      </div>

      {(nSessao > 0 || nAtencao > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {nSessao > 0 && <button type="button" className="btn btn-linha" aria-pressed={filtro === 'sessao'} onClick={() => setFiltro(filtro === 'sessao' ? '' : 'sessao')} style={{ minHeight: 36, background: filtro === 'sessao' ? 'var(--azul-claro)' : '#fff' }}>Para a próxima sessão ({nSessao})</button>}
          {nAtencao > 0 && <button type="button" className="btn btn-linha" aria-pressed={filtro === 'atencao'} onClick={() => setFiltro(filtro === 'atencao' ? '' : 'atencao')} style={{ minHeight: 36, background: filtro === 'atencao' ? 'var(--warn-bg)' : '#fff' }}><span className="ponto" style={{ background: STATUS.dar_atencao.cor }} />dar atenção ({nAtencao})</button>}
        </div>
      )}
      {temas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Temas mais frequentes:</span>
          {temas.map((t) => <button key={t.nome} type="button" className="chip" onClick={() => setBusca(t.nome)} style={{ border: 0, background: 'var(--cinza)', color: 'var(--ink)', cursor: 'pointer' }}>{t.nome} · {t.n}</button>)}
        </div>
      )}

      {carregando ? <p style={{ color: 'var(--muted)' }}>Carregando os sonhos…</p>
        : erro ? <div className="aviso">Não deu para carregar: {erro}</div>
        : !sonhos.length ? <div className="painel" style={{ padding: 24, color: 'var(--muted)' }}>{semViuvas(`${nome} ainda não escolheu nenhum sonho para mostrar.`)}</div>
        : <div className="mural">{filtrados.map((s) => <Nota key={s.id} s={s} para={`/app/compartilhados/${c.dono_id}/${s.id}`} />)}</div>}
      {!carregando && sonhos.length > 0 && filtrados.length === 0 && <p style={{ color: 'var(--muted)' }}>Nenhum sonho com esse filtro.</p>}

      <button type="button" onClick={sair} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: '8px 0' }}>Deixar de ver os sonhos de {nome}</button>
    </div>
  );
}

function SonhoLido({ c, id }) {
  const { carregando, sonhos, erro } = useSonhosDe(c.dono_id);
  const estiloTema = useCorTema();
  const [audioUrl, setAudioUrl] = useState(null);
  const s = sonhos.find((x) => x.id === id);
  useEffect(() => {
    let vivo = true;
    if (s?.audio?.ref) urlAudioCompartilhado(s.audio.ref).then((u) => vivo && setAudioUrl(u));
    return () => { vivo = false; };
  }, [s?.audio?.ref]);
  const voltar = '/app/compartilhados/' + c.dono_id;
  const nome = c.dono_nome || c.dono_email;
  const i = sonhos.findIndex((x) => x.id === id);
  const anterior = i > 0 ? sonhos[i - 1] : null; // mais recente
  const proximo = i >= 0 && i < sonhos.length - 1 ? sonhos[i + 1] : null; // mais antigo

  if (carregando) return <p style={{ padding: 40, color: 'var(--muted)' }}>Carregando…</p>;
  if (erro || !s) return <Vazio texto={erro ? 'Não deu para carregar: ' + erro : 'Esse sonho não está compartilhado com você.'} />;

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Link to={voltar} className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> {nome}</Link>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>só leitura</span>
      </div>

      <article className="painel" style={{ flex: '999 1 560px', minWidth: 0, padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="rotulo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendario size={14} /> {dataLonga(s.sonhado_em)}</span>
        <h1 className="titulo-m">{semViuvas(tituloDe(s))}</h1>
        {s.levar_sessao && <span style={{ alignSelf: 'flex-start', height: 28, padding: '0 10px', borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>Para a próxima sessão</span>}
        {s.audio && (
          <div style={{ background: '#F7F8FA', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            {audioUrl ? <audio src={audioUrl} controls style={{ flex: 1, height: 40 }} /> : <span style={{ fontSize: 13, color: 'var(--muted)', padding: 8 }}>Carregando o áudio…</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{duracao(s.audio.duracao)}</span>
          </div>
        )}
        {s.texto ? s.texto.split(/\n{2,}/).map((p, k) => <p key={k} className="leitura" style={{ margin: 0, maxWidth: 680, fontSize: 19, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{semViuvas(p)}</p>)
          : <p style={{ margin: 0, color: 'var(--muted)', fontStyle: 'italic' }}>Sem relato escrito.</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          {(s.temas || []).map((t) => <span key={t} className="chip" style={{ ...estiloTema(t), height: 30, fontSize: 13.5 }}>{t}</span>)}
          <span style={{ marginLeft: 'auto' }}><Status s={s.status} cor="var(--ink)" /></span>
        </div>
        <nav aria-label="Outros sonhos" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {proximo && <Link className="btn btn-linha" to={voltar + '/' + proximo.id}><Voltar size={16} /> Anterior · {dataCurta(proximo.sonhado_em)}</Link>}
          {anterior && <Link className="btn btn-linha" style={{ marginLeft: 'auto' }} to={voltar + '/' + anterior.id}>Seguinte · {dataCurta(anterior.sonhado_em)} <Avancar size={16} /></Link>}
        </nav>
      </article>

      <aside style={{ flex: '1 1 340px', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Amplificações</h2>
          {!c.ver_amplificacoes ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>{semViuvas(`${nome.split(' ')[0]} preferiu não mostrar as amplificações.`)}</p>
            : !(s.conclusoes || []).length ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Nenhuma ainda.</p>
            : (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {s.conclusoes.map((x) => (
                  <li key={x.id} style={{ paddingLeft: 14, borderLeft: '2px solid var(--node)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(x.em)} · {x.origem === 'sessao' ? 'depois da sessão' : 'sozinho'}</span>
                    <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{semViuvas(x.texto)}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
        <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(`${nome.split(' ')[0]} compartilhou este sonho com você. Só quem compartilha pode editar ou tirar o acesso.`)}</p>
      </aside>
    </div>
  );
}
