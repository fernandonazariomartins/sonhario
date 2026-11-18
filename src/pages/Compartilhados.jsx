// Sonhos que outras pessoas compartilharam comigo (pacientes e amigos). Só leitura.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { sonhosDe, urlAudioCompartilhado, urlImagemCompartilhada, desfazer, pessoa, resumoCompartilhados, linkTerapeutaExiste, meuLinkTerapeuta, mandarLinkTerapeuta } from '../lib/compartilhar.js';
import Imagens from '../components/Imagens.jsx';
import Avatar from '../components/Avatar.jsx';
import { STATUS, dataLonga, dataCurta, tituloDe, duracao, contarTemas } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { interpretar, casar } from '../lib/busca.js';
import { Nota, Status, MuralEmLinhas } from './Acervo.jsx';
import { Voltar, Avancar, Busca, Calendario, Pessoas, Copiar, Link as IconeLink } from '../components/Icones.jsx';

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

// Quem atende: o link fixo de convite, o mesmo para todos os pacientes.
function ConvidarPacientes() {
  const { usuario, avisar } = useEstado();
  const [url, setUrl] = useState(undefined); // undefined: carregando; '': ainda não criou
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let vivo = true;
    linkTerapeutaExiste(usuario).then((u) => vivo && setUrl(u)).catch(() => vivo && setUrl(''));
    return () => { vivo = false; };
  }, [usuario]);

  async function gerar(trocar = false) {
    if (trocar && !confirm('Trocar o link? O link atual para de funcionar. Quem já entrou por ele continua com você.')) return;
    setOcupado(true);
    try {
      const u = await meuLinkTerapeuta(usuario, { trocar });
      setUrl(u);
      if (trocar) avisar('Link trocado. O antigo não funciona mais.');
      else mandarLinkTerapeuta(u, avisar);
    } catch (e) {
      avisar(/convites_terapeuta/.test(e?.message || '') ? 'O convite de terapeuta ainda não está ativo no banco: rode o bloco 12 do supabase/schema.sql.' : 'Não deu para criar o link: ' + e.message);
    }
    setOcupado(false);
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(url); avisar('Link copiado'); } catch { prompt('Copie o link:', url); }
  }

  return (
    <section aria-label="Convidar pacientes" className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <strong style={{ fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconeLink size={18} /> Convidar pacientes</strong>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 620 }}>{semViuvas('Um link só, para mandar a todos os pacientes. Quem entra por ele com a conta Google aparece aqui. Você não vê nenhum sonho até a pessoa escolher mostrar, um por vez.')}</p>
      {url === undefined ? <span style={{ fontSize: 14, color: 'var(--muted)' }}>Carregando…</span>
        : url ? (
          <>
            <div style={{ display: 'flex', gap: 8, maxWidth: 620 }}>
              <input className="campo" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Link de convite para pacientes" style={{ fontSize: 13 }} />
              <button type="button" className="btn btn-linha" onClick={copiar}><Copiar size={16} /> Copiar</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <button type="button" className="btn btn-azul" onClick={() => mandarLinkTerapeuta(url, avisar)}>Mandar</button>
              <button type="button" onClick={() => gerar(true)} disabled={ocupado} style={{ border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: '8px 4px' }}>Trocar o link</button>
            </div>
          </>
        ) : <button type="button" className="btn btn-azul" style={{ alignSelf: 'flex-start' }} onClick={() => gerar(false)} disabled={ocupado}><IconeLink size={16} /> {ocupado ? 'Criando…' : 'Gerar link de convite'}</button>}
    </section>
  );
}

function resumoDe(r) {
  if (!r) return null;
  if (!r.n) return 'ainda não mostrou nenhum sonho';
  return (r.n === 1 ? '1 sonho' : r.n + ' sonhos') + (r.n_sessao ? ` · ${r.n_sessao} para a próxima sessão` : '');
}

function Pessoas_() {
  const { compartilhamentos, usuario, modo } = useEstado();
  const { comigo, aguardando } = compartilhamentos;
  const [resumo, setResumo] = useState({});
  useEffect(() => {
    let vivo = true;
    resumoCompartilhados().then((r) => vivo && setResumo(r));
    return () => { vivo = false; };
  }, [comigo.length]);
  const esperando = aguardando.length > 0 && (
    <div className="aviso">{semViuvas(aguardando.length === 1
      ? `Seu pedido para ver o sonho de ${aguardando[0].dono_nome || aguardando[0].dono_email} está esperando aprovação.`
      : `${aguardando.length} pedidos esperando aprovação.`)}</div>
  );
  if (!modo.atende) {
    if (!comigo.length && esperando) return <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>{esperando}</div>;
    if (!comigo.length) return <Vazio texto={`Ninguém compartilhou sonhos com ${usuario?.email || 'você'} ainda. Quando alguém (um paciente, um amigo) liberar o acesso para esse e-mail, os sonhos aparecem aqui.`} />;
  }
  const pacientes = comigo.filter((c) => c.vinculo_terapeuta);
  const outros = comigo.filter((c) => !c.vinculo_terapeuta);
  const grupos = modo.atende
    ? [['Pacientes', pacientes], [pacientes.length ? 'Outras pessoas' : 'Pessoas', outros]]
    : [['Pessoas', comigo]];
  return (
    <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="titulo-m">{modo.atende ? 'Pacientes' : 'Compartilhados com você'}</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Você vê só os sonhos que cada pessoa escolheu mostrar, um por um. Aqui é só leitura.')}</p>
      </div>
      {modo.atende && <ConvidarPacientes />}
      {esperando}
      {modo.atende && !comigo.length && <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Ninguém entrou pelo seu link ainda. Quando alguém entrar, aparece aqui.')}</p>}
      {grupos.filter(([, lista]) => lista.length).map(([nome, lista]) => (
        <section key={nome} aria-label={nome} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="rotulo">{nome}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {lista.map((c) => (
              <Link key={c.id} to={'/app/compartilhados/' + c.dono_id} className="painel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink)', textDecoration: 'none' }}>
                <Avatar nome={c.dono_nome || c.dono_email} foto={pessoa(compartilhamentos.perfis, c.dono_email).foto} size={48} />
                <span style={{ minWidth: 0, marginRight: 'auto' }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{c.dono_nome || c.dono_email}</strong>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{resumoDe(resumo[c.dono_id]) || `sonhos que ${(c.dono_nome || 'a pessoa').split(' ')[0]} escolheu mostrar`}</span>
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
  const { recarregarCompartilhamentos, avisar, compartilhamentos, modo } = useEstado();
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
    if (!confirm(`Deixar de ver os sonhos de ${nome}? Só ${nome.split(' ')[0]} pode liberar de novo.`)) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); navegar('/app/compartilhados'); } catch (e) { avisar('Não deu: ' + e.message); }
  }

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div><Link to="/app/compartilhados" className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> {modo.atende ? 'Pacientes' : 'Compartilhados'}</Link></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <Avatar nome={nome} foto={foto} size={56} />
        <div style={{ marginRight: 'auto' }}>
          <span className="rotulo">{c.vinculo_terapeuta && modo.atende ? 'Paciente · só leitura' : 'Compartilhou com você · só leitura'}</span>
          <h1 className="titulo-m">{nome}</h1>
          {!carregando && <span style={{ fontSize: 14, color: 'var(--muted)' }}>{sonhos.length === 1 ? '1 sonho compartilhado' : sonhos.length + ' sonhos compartilhados'}</span>}
        </div>
        <label className="busca"><Busca size={18} /><span className="sr">Buscar nos sonhos de {nome}</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setBusca(''); }} placeholder="Buscar: palavra, pessoa, lugar" enterKeyHint="search" autoComplete="off" spellCheck={false} />
          {busca && <button type="button" className="busca-limpar" onClick={() => setBusca('')} aria-label="Limpar busca">×</button>}
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
        : <MuralEmLinhas>{filtrados.map((s) => <Nota key={s.id} s={s} achado={achados.get(s.id)} para={`/app/compartilhados/${c.dono_id}/${s.id}`} />)}</MuralEmLinhas>}
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
        <Imagens imagens={s.imagens || []} urlDe={urlImagemCompartilhada} />
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
                    <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(x.em)}</span>
                    <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{semViuvas(x.texto)}</p>
                  </li>
                ))}
              </ol>
            )}
        </div>
        <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(`${nome.split(' ')[0]} compartilhou este sonho com você. Só quem compartilha pode editar ou tirar o acesso.`)}</p>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>{semViuvas('O Sonhário é um caderno para registrar, organizar e voltar aos seus sonhos.')}</p>
          {/* "ficar" mantém quem já está logado na home em vez de mandar direto para o app. */}
          <Link className="btn btn-preto" to="/" state={{ ficar: true }}>Conheça mais sobre o Sonhário</Link>
        </div>
      </aside>
    </div>
  );
}
