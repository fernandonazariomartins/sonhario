// Sonhos que outras pessoas compartilharam comigo (pacientes e amigos). Só leitura.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { sonhosDe, urlAudioCompartilhado, urlImagemCompartilhada, desfazer, pessoa } from '../lib/compartilhar.js';
import Imagens from '../components/Imagens.jsx';
import Comentarios from '../components/Comentarios.jsx';
import { resumoComentarios } from '../lib/comentarios.js';
import Avatar from '../components/Avatar.jsx';
import { LinhaPessoa } from '../components/Compartilhar.jsx';
import { ConvidarPacientes, BotaoConvite } from '../components/Convidar.jsx';
import { STATUS, dataLonga, dataCurta, tituloDe, duracao, contarTemas } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { interpretar, casar } from '../lib/busca.js';
import { Nota, Status, MuralEmLinhas } from './Acervo.jsx';
import { Voltar, Avancar, Busca, Calendario, Pessoas } from '../components/Icones.jsx';
import { tr } from '../lib/i18n.js';

// Sonhos trancados que ainda não abrem aqui (a chave não chegou) ficam de fora, só contados.
function useSonhosDe(donoId) {
  const { cofre } = useEstado();
  const [estado, setEstado] = useState({ carregando: true, sonhos: [], trancados: 0, erro: '' });
  useEffect(() => {
    let vivo = true;
    setEstado({ carregando: true, sonhos: [], trancados: 0, erro: '' });
    sonhosDe(donoId)
      .then((lista) => vivo && setEstado({ carregando: false, sonhos: lista.filter((s) => !s._trancado), trancados: lista.filter((s) => s._trancado).length, erro: '' }))
      .catch((e) => vivo && setEstado({ carregando: false, sonhos: [], trancados: 0, erro: e.message }));
    return () => { vivo = false; };
  }, [donoId, cofre]);
  return estado;
}

function AvisoTrancados({ n, nome }) {
  if (!n) return null;
  return <div className="aviso">{semViuvas(tr("{0} para você. {1} quando {2} abrir o Sonhário de novo, que é quando a chave chega até você.", [n === 1 ? tr('1 sonho ainda está trancado') : n + tr(' sonhos ainda estão trancados'), n === 1 ? tr("Ele aparece") : tr("Eles aparecem"), nome.split(' ')[0]]))}</div>;
}

export default function Compartilhados() {
  const { dono, id } = useParams();
  const { compartilhamentos } = useEstado();
  const c = compartilhamentos.comigo.find((x) => x.dono_id === dono);
  if (!dono) return <Pessoas_ />;
  if (!c) return <Vazio texto={tr("Esses sonhos não estão mais compartilhados com você.")} />;
  return id ? <SonhoLido c={c} id={id} /> : <SonhosDaPessoa c={c} />;
}

function Vazio({ texto }) {
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
      <div className="painel" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Pessoas size={24} /></span>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 440, lineHeight: 1.6 }}>{semViuvas(texto)}</p>
        <Link className="btn btn-linha" to="/app/acervo">{tr("Ir para o meu acervo")}</Link>
      </div>
    </div>
  );
}

function Pessoas_() {
  const { compartilhamentos, usuario, modo } = useEstado();
  const { comigo, aguardando } = compartilhamentos;
  const esperando = aguardando.length > 0 && (
    <div className="aviso">{semViuvas(aguardando.length === 1
      ? tr("Seu pedido para ver o sonho de {0} está esperando aprovação.", [aguardando[0].dono_nome || aguardando[0].dono_email])
      : tr("{0} pedidos esperando aprovação.", [aguardando.length]))}</div>
  );
  if (!modo.atende) {
    if (!comigo.length && esperando) return <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>{esperando}</div>;
    if (!comigo.length) return <Vazio texto={tr("Ninguém compartilhou sonhos com {0} ainda. Quando alguém (um paciente, um amigo) liberar o acesso para esse e-mail, os sonhos aparecem aqui.", [usuario?.email || tr("você")])} />;
  }
  // Paciente: quem me marcou como terapeuta (pelo convite ou em Pessoas com acesso).
  const pacientes = comigo.filter((c) => c.eh_terapeuta);
  const outros = comigo.filter((c) => !c.eh_terapeuta);
  const grupos = modo.atende || pacientes.length
    ? [[tr("Pacientes"), pacientes], [pacientes.length ? tr("Outras pessoas") : tr("Pessoas"), outros]]
    : [[tr("Pessoas"), comigo]];
  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="titulo-m">{modo.atende ? tr("Pacientes") : tr("Compartilhados com você")}</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(tr("Você vê só os sonhos que cada pessoa escolheu mostrar, um por um. Não dá para editar, mas dá para comentar."))}</p>
      </div>
      {modo.atende && <ConvidarPacientes />}
      {esperando}
      {modo.atende && !comigo.length && <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(tr("Ninguém entrou pelo seu link ainda. Quando alguém entrar, aparece aqui."))}</p>}
      {grupos.filter(([, lista]) => lista.length).map(([nome, lista]) => (
        <section key={nome} aria-label={nome} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="rotulo">{nome}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
            {lista.map((c) => <CartaoPessoa key={c.id} c={c} />)}
          </div>
        </section>
      ))}
      {!modo.atende && <div><BotaoConvite tipo="amigo" /></div>}
    </div>
  );
}

const plural = (n, um, varios) => (n === 1 ? '1 ' + tr(um) : n + ' ' + tr(varios));
const VISIVEIS = 3;

function Etiqueta({ children, fundo = 'var(--azul-claro)', cor = 'var(--azul-escuro)' }) {
  return <span style={{ height: 24, padding: '0 10px', borderRadius: 999, background: fundo, color: cor, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{children}</span>;
}

// Uma pessoa que compartilhou comigo e o resumo dos sonhos que ela mostrou, como em "Pessoas com acesso".
function CartaoPessoa({ c }) {
  const { compartilhamentos, usuario } = useEstado();
  const { carregando, sonhos, trancados, erro } = useSonhosDe(c.dono_id);
  const [coment, setComent] = useState({});
  useEffect(() => {
    let vivo = true;
    if (usuario) resumoComentarios({ donoId: c.dono_id, leitorEmail: (usuario.email || '').toLowerCase(), meuId: usuario.id }).then((r) => vivo && setComent(r));
    return () => { vivo = false; };
  }, [c.dono_id, usuario]);
  const p = pessoa(compartilhamentos.perfis, c.dono_email, c.dono_nome);
  const base = '/app/compartilhados/' + c.dono_id;
  const lista = [...sonhos].sort((a, b) => (b.sonhado_em || '').localeCompare(a.sonhado_em || ''));
  const sessao = lista.filter((s) => s.levar_sessao).length;
  const comAmp = c.ver_amplificacoes ? lista.filter((s) => s.conclusoes?.length).length : 0;
  const novos = Object.values(coment).reduce((t, x) => t + (x.novos || 0), 0);
  const resumo = [plural(lista.length, 'sonho', 'sonhos'), sessao && plural(sessao, tr("para a próxima sessão"), tr("para a próxima sessão")), comAmp && plural(comAmp, tr("com amplificações"), tr("com amplificações"))].filter(Boolean);

  return (
    <section aria-label={p.nome} className="painel" style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Link to={base} style={{ color: 'inherit', textDecoration: 'none' }}>
        <LinhaPessoa p={p} sub={p.nome !== c.dono_email ? c.dono_email : ''}>
          {novos > 0 && <Etiqueta>{plural(novos, tr("comentário novo"), tr("comentários novos"))}</Etiqueta>}
          <Avancar size={18} />
        </LinhaPessoa>
      </Link>
      <AvisoTrancados n={trancados} nome={p.nome} />
      {carregando ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{tr("Carregando os sonhos…")}</p>
        : erro ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{tr("Não deu para carregar: {0}", [erro])}</p>
        : !lista.length ? trancados ? null : <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{semViuvas(tr("{0} ainda não escolheu nenhum sonho para mostrar.", [p.nome.split(' ')[0]]))}</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo">{resumo.map((t) => t.replace(/ /g, '\u00a0')).join(' ·\u00a0')}</span>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              {lista.slice(0, VISIVEIS).map((s, i) => (
                <li key={s.id} style={{ borderTop: i ? '1px solid var(--line)' : 0 }}>
                  <Link to={base + '/' + s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 10px 14px', color: 'inherit', textDecoration: 'none' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                        <strong style={{ fontSize: 15, color: s.titulo?.trim() ? 'var(--ink)' : 'var(--muted)' }}>{tituloDe(s)}</strong>
                        {s.levar_sessao && <Etiqueta>{tr("Próxima sessão")}</Etiqueta>}
                      </span>
                      {s.texto && <span style={{ display: 'block', fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.texto}</span>}
                      <span className="rotulo" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>
                        {tr("sonhado ")}{dataCurta(s.sonhado_em)}{coment[s.id]?.total ? ' · ' + plural(coment[s.id].total, tr("comentário"), tr("comentários")) : ''}
                      </span>
                    </span>
                    {coment[s.id]?.novos > 0 && <span className="ponto" style={{ background: 'var(--azul)' }} aria-label={tr("comentário novo")} />}
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="btn btn-linha" style={{ alignSelf: 'flex-start', minHeight: 36 }} to={base}>
              {lista.length > VISIVEIS ? tr("Ver os ") + lista.length + tr(' sonhos') : tr("Abrir os sonhos de ") + p.nome.split(' ')[0]}
            </Link>
          </div>
        )}
    </section>
  );
}

function SonhosDaPessoa({ c }) {
  const { carregando, sonhos, trancados, erro } = useSonhosDe(c.dono_id);
  const { recarregarCompartilhamentos, avisar, compartilhamentos, usuario, modo } = useEstado();
  const [coment, setComent] = useState({});
  useEffect(() => {
    let vivo = true;
    if (usuario) resumoComentarios({ donoId: c.dono_id, leitorEmail: (usuario.email || '').toLowerCase(), meuId: usuario.id }).then((r) => vivo && setComent(r));
    return () => { vivo = false; };
  }, [c.dono_id, usuario]);
  const foto = pessoa(compartilhamentos.perfis, c.dono_email).foto;
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState(''); // '' | 'sessao' | 'atencao'
  const nome = c.dono_nome || c.dono_email;
  const temas = useMemo(() => contarTemas(sonhos).slice(0, 8), [sonhos]);
  const { filtrados, achados } = useMemo(() => {
    const consulta = interpretar(busca);
    const achados = new Map();
    const filtrados = sonhos.filter((s) => {
      if (filtro && !(filtro === 'sessao' ? s.levar_sessao : s.status === 'dar_atencao')) return false;
      if (consulta.vazia) return true;
      const r = casar(s, consulta);
      if (r) achados.set(s.id, { ...r, termos: consulta.termos });
      return !!r;
    });
    return { filtrados, achados };
  }, [sonhos, busca, filtro]);
  const nSessao = sonhos.filter((s) => s.levar_sessao).length;
  const nAtencao = sonhos.filter((s) => s.status === 'dar_atencao').length;

  async function sair() {
    if (!confirm(tr("Deixar de ver os sonhos de {0}? Só {1} pode liberar de novo.", [nome, nome.split(' ')[0]]))) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); navegar('/app/compartilhados'); } catch (e) { avisar(tr("Não deu: ") + e.message); }
  }

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div><Link to="/app/compartilhados" className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> {modo.atende ? tr("Pacientes") : tr("Compartilhados")}</Link></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <Avatar nome={nome} foto={foto} size={56} />
        <div style={{ marginRight: 'auto' }}>
          <span className="rotulo">{c.eh_terapeuta ? tr("Paciente") : tr("Compartilhou com você")}</span>
          <h1 className="titulo-m">{nome}</h1>
          {!carregando && <span style={{ fontSize: 14, color: 'var(--muted)' }}>{sonhos.length === 1 ? tr("1 sonho compartilhado") : sonhos.length + tr(" sonhos compartilhados")}</span>}
        </div>
        <label className="busca"><Busca size={18} /><span className="sr">{tr("Buscar nos sonhos de {0}", [nome])}</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setBusca(''); }} placeholder={tr("Buscar: palavra, pessoa, lugar")} enterKeyHint="search" autoComplete="off" spellCheck={false} />
          {busca && <button type="button" className="busca-limpar" onClick={() => setBusca('')} aria-label={tr("Limpar busca")}>×</button>}
        </label>
      </div>

      <AvisoTrancados n={trancados} nome={nome} />
      {(nSessao > 0 || nAtencao > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {nSessao > 0 && <button type="button" className="btn btn-linha" aria-pressed={filtro === 'sessao'} onClick={() => setFiltro(filtro === 'sessao' ? '' : 'sessao')} style={{ minHeight: 36, background: filtro === 'sessao' ? 'var(--azul-claro)' : '#fff' }}>{tr("Para a próxima sessão ({0})", [nSessao])}</button>}
          {nAtencao > 0 && <button type="button" className="btn btn-linha" aria-pressed={filtro === 'atencao'} onClick={() => setFiltro(filtro === 'atencao' ? '' : 'atencao')} style={{ minHeight: 36, background: filtro === 'atencao' ? 'var(--warn-bg)' : '#fff' }}><span className="ponto" style={{ background: STATUS.dar_atencao.cor }} />{tr("dar atenção (")}{nAtencao})</button>}
        </div>
      )}
      {temas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{tr("Temas mais frequentes:")}</span>
          {temas.map((t) => <button key={t.nome} type="button" className="chip" onClick={() => setBusca(t.nome)} style={{ border: 0, background: 'var(--cinza)', color: 'var(--ink)', cursor: 'pointer' }}>{t.nome} · {t.n}</button>)}
        </div>
      )}

      {carregando ? <p style={{ color: 'var(--muted)' }}>{tr("Carregando os sonhos…")}</p>
        : erro ? <div className="aviso">{tr("Não deu para carregar: {0}", [erro])}</div>
        : !sonhos.length ? <div className="painel" style={{ padding: 24, color: 'var(--muted)' }}>{semViuvas(tr("{0} ainda não escolheu nenhum sonho para mostrar.", [nome]))}</div>
        : <MuralEmLinhas>{filtrados.map((s) => <Nota key={s.id} s={s} achado={achados.get(s.id)} coment={coment[s.id] || null} para={`/app/compartilhados/${c.dono_id}/${s.id}`} />)}</MuralEmLinhas>}
      {!carregando && sonhos.length > 0 && filtrados.length === 0 && <p style={{ color: 'var(--muted)' }}>{tr("Nenhum sonho com esse filtro.")}</p>}

      <button type="button" onClick={sair} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: '8px 0' }}>{tr("Deixar de ver os sonhos de {0}", [nome])}</button>
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

  if (carregando) return <p style={{ padding: 40, color: 'var(--muted)' }}>{tr("Carregando…")}</p>;
  if (erro || !s) return <Vazio texto={erro ? tr("Não deu para carregar: ") + erro : tr("Esse sonho não está compartilhado com você.")} />;

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Link to={voltar} className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> {nome}</Link>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{tr("só leitura · dá para comentar")}</span>
      </div>

      <article className="painel" style={{ flex: '999 1 560px', minWidth: 0, padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="rotulo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendario size={14} /> {dataLonga(s.sonhado_em)}</span>
        <h1 className="titulo-m">{semViuvas(tituloDe(s))}</h1>
        {s.levar_sessao && <span style={{ alignSelf: 'flex-start', height: 28, padding: '0 10px', borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>{tr("Para a próxima sessão")}</span>}
        {s.audio && (
          <div style={{ background: '#F7F8FA', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            {audioUrl ? <audio src={audioUrl} controls style={{ flex: 1, height: 40 }} /> : <span style={{ fontSize: 13, color: 'var(--muted)', padding: 8 }}>{tr("Carregando o áudio…")}</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{duracao(s.audio.duracao)}</span>
          </div>
        )}
        <Imagens imagens={s.imagens || []} urlDe={urlImagemCompartilhada} />
        {s.texto ? s.texto.split(/\n{2,}/).map((p, k) => <p key={k} className="leitura" style={{ margin: 0, maxWidth: 680, fontSize: 19, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{semViuvas(p)}</p>)
          : <p style={{ margin: 0, color: 'var(--muted)', fontStyle: 'italic' }}>{tr("Sem relato escrito.")}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          {(s.temas || []).map((t) => <span key={t} className="chip" style={{ ...estiloTema(t), height: 30, fontSize: 13.5 }}>{t}</span>)}
          <span style={{ marginLeft: 'auto' }}><Status s={s.status} cor="var(--ink)" /></span>
        </div>
        <nav aria-label={tr("Outros sonhos")} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {proximo && <Link className="btn btn-linha" to={voltar + '/' + proximo.id}><Voltar size={16} />{tr(" Anterior · ")}{dataCurta(proximo.sonhado_em)}</Link>}
          {anterior && <Link className="btn btn-linha" style={{ marginLeft: 'auto' }} to={voltar + '/' + anterior.id}>{tr("Seguinte · ")}{dataCurta(anterior.sonhado_em)} <Avancar size={16} /></Link>}
        </nav>
      </article>

      <aside style={{ flex: '1 1 340px', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{tr("Amplificações")}</h2>
          {!c.ver_amplificacoes ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>{semViuvas(tr("{0} preferiu não mostrar as amplificações.", [nome.split(' ')[0]]))}</p>
            : !(s.conclusoes || []).length ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{tr("Nenhuma ainda.")}</p>
            : (
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {s.conclusoes.map((x) => (
                  <li key={x.id} style={{ paddingLeft: 14, borderLeft: '2px solid var(--node)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(x.em)}</span>
                    <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{semViuvas(x.texto)}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
        <Comentarios sonhoId={s.id} modo="leitor" donoNome={nome} />
        <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(tr("{0} compartilhou este sonho com você. Só quem compartilha pode editar o sonho ou tirar o acesso.", [nome.split(' ')[0]]))}</p>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>{semViuvas(tr("O Sonhário é um caderno para registrar, organizar e voltar aos seus sonhos."))}</p>
          {/* "ficar" mantém quem já está logado na home em vez de mandar direto para o app. */}
          <Link className="btn btn-preto" to="/" state={{ ficar: true }}>{tr("Conheça mais sobre o Sonhário")}</Link>
        </div>
      </aside>
    </div>
  );
}
