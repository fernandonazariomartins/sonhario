// Comentários de um sonho compartilhado.
// modo "dono": vê a conversa de cada pessoa que recebeu o sonho e responde.
// modo "leitor": comenta para o dono ou guarda uma nota privada (só quem escreveu vê).
import { useCallback, useEffect, useState } from 'react';
import { useEstado } from '../lib/estado.jsx';
import { comentariosDoSonho, comentar, apagarComentario, marcarVistos, conversas, quando } from '../lib/comentarios.js';
import { pessoa } from '../lib/compartilhar.js';
import { semViuvas } from '../lib/tipografia.js';
import Avatar from './Avatar.jsx';
import { Mensagem, Cadeado } from './Icones.jsx';

const primeiro = (n = '') => n.trim().split(/\s+/)[0] || n;

export default function Comentarios({ sonhoId, modo, donoNome = '', veem = [], aoMudar }) {
  const { usuario, avisar, compartilhamentos } = useEstado();
  const [lista, setLista] = useState(undefined); // undefined: carregando; null: banco sem a tabela
  const carregar = useCallback(async () => {
    try {
      const l = await comentariosDoSonho(sonhoId);
      setLista(l);
      if (l?.some((c) => !c.visto && !c.privado && c.autor_id !== usuario?.id)) { await marcarVistos(sonhoId).catch(() => {}); aoMudar?.(); }
    } catch (e) { setLista([]); avisar('Não deu para carregar os comentários: ' + e.message); }
  }, [sonhoId, usuario?.id, avisar, aoMudar]);
  useEffect(() => { setLista(undefined); carregar(); }, [carregar]);

  if (!usuario || lista === null) return null;

  async function enviar(dados) {
    const novo = await comentar({ sonhoId, ...dados });
    setLista((l) => [...(l || []), novo]);
    aoMudar?.();
  }
  async function apagar(c) {
    if (!confirm(c.privado ? 'Apagar esta nota?' : 'Apagar este comentário?')) return;
    try { await apagarComentario(c.id); setLista((l) => l.filter((x) => x.id !== c.id)); aoMudar?.(); } catch (e) { avisar('Não deu para apagar: ' + e.message); }
  }

  const nomeDe = (email, c) => (c?.autor_id === usuario.id ? 'Você' : c?.autor_nome || pessoa(compartilhamentos.perfis, email).nome);

  if (modo === 'dono') {
    const grupos = conversas(lista || []);
    if (!grupos.length && !veem.length) return null;
    return (
      <section className="painel" aria-labelledby="t-coment" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Cabeca n={(lista || []).length} />
        {lista === undefined ? <p style={pequeno}>Carregando…</p>
          : !grupos.length ? <p style={pequeno}>{semViuvas('Quem recebe este sonho pode comentar. Os comentários aparecem aqui, e você responde para cada pessoa.')}</p>
          : grupos.map((g) => {
            const p = pessoa(compartilhamentos.perfis, g.email);
            return (
              <div key={g.email} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <span className="rotulo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar nome={p.nome} foto={p.foto} size={22} /> Conversa com {primeiro(p.nome)}</span>
                <Fio itens={g.itens} meuId={usuario.id} nomeDe={(c) => nomeDe(g.email, c)} aoApagar={apagar} podeApagar={() => true} />
                <Caixa rotulo={'Responder a ' + primeiro(p.nome)} dica={'Só ' + primeiro(p.nome) + ' vê esta conversa.'} aoEnviar={(texto) => enviar({ texto, leitorEmail: g.email })} />
              </div>
            );
          })}
      </section>
    );
  }

  const dono = primeiro(donoNome) || 'a pessoa';
  return (
    <section className="painel" aria-labelledby="t-coment" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Cabeca n={(lista || []).length} />
      {lista === undefined ? <p style={pequeno}>Carregando…</p>
        : lista.length > 0 && <Fio itens={lista} meuId={usuario.id} nomeDe={(c) => nomeDe('', c)} aoApagar={apagar} podeApagar={(c) => c.autor_id === usuario.id} />}
      <Caixa comPrivado dono={dono} aoEnviar={(texto, privado) => enviar({ texto, privado })} />
    </section>
  );
}

const pequeno = { margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 };

function Cabeca({ n }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <h2 id="t-coment" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Comentários</h2>
      {n > 0 && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{n}</span>}
    </div>
  );
}

function Fio({ itens, meuId, nomeDe, aoApagar, podeApagar }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {itens.map((c) => (
        <li key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', ...(c.privado ? { background: 'var(--cinza)', borderRadius: 12, padding: 10, margin: '0 -10px' } : {}) }}>
          <Avatar nome={c.autor_nome || nomeDe(c)} foto={c.autor_foto} size={28} />
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px 8px' }}>
              <strong style={{ color: 'var(--ink)' }}>{nomeDe(c)}</strong>
              {quando(c.criado_em)}
              {c.privado && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Cadeado size={12} /> nota privada, só você vê</span>}
              {!c.privado && c.autor_id !== meuId && !c.visto && <span className="selo-novo">novo</span>}
            </span>
            <p className="leitura sigilo" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{semViuvas(c.texto)}</p>
            {podeApagar(c) && <button type="button" onClick={() => aoApagar(c)} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>apagar</button>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Caixa({ rotulo = 'Novo comentário', dica, comPrivado, dono, aoEnviar }) {
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const { avisar } = useEstado();
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try { await aoEnviar(texto, privado); setTexto(''); } catch (err) { avisar(err.message); }
    setEnviando(false);
  }
  const placeholder = comPrivado ? (privado ? 'Uma nota só para você sobre este sonho…' : 'O que este sonho despertou em você?') : 'Escreva uma resposta…';
  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {comPrivado && (
        <div role="radiogroup" aria-label="Quem vê" className="abas" style={{ alignSelf: 'flex-start' }}>
          <button type="button" role="radio" aria-checked={!privado} className={'aba' + (!privado ? ' ativa' : '')} onClick={() => setPrivado(false)}><Mensagem size={14} /> {dono} vê</button>
          <button type="button" role="radio" aria-checked={privado} className={'aba' + (privado ? ' ativa' : '')} onClick={() => setPrivado(true)}><Cadeado size={14} /> Só eu vejo</button>
        </div>
      )}
      <label className="sr" htmlFor={'coment-' + rotulo}>{rotulo}</label>
      <textarea id={'coment-' + rotulo} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} rows={3} maxLength={5000}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar(e); }}
        className="leitura" style={{ border: '1px solid var(--line-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.6, resize: 'vertical', background: privado ? 'var(--cinza)' : '#fff' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45, flex: '1 1 160px' }}>
          {semViuvas(comPrivado ? (privado ? `A nota fica com você. ${dono} não vê.` : `Só ${dono} vê este comentário. Outras pessoas que recebem o sonho, não.`) : dica)}
        </span>
        <button className="btn btn-azul" disabled={!texto.trim() || enviando} style={{ marginLeft: 'auto' }}>
          {enviando ? 'Enviando…' : comPrivado && privado ? 'Guardar nota' : comPrivado ? 'Comentar' : 'Responder'}
        </button>
      </div>
    </form>
  );
}
