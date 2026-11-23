// Comentários sobre um tema, na página do tema (/app/acervo?tema=X).
// O que a pessoa vai pensando sobre aquela imagem ao longo do tempo. Só ela vê.
import { useState } from 'react';
import { useEstado } from '../lib/estado.jsx';
import { useNotasTema, notasDoTema, comentarTema, editarNotaTema, apagarNotaTema } from '../lib/notasTema.js';
import { quando } from '../lib/comentarios.js';
import { semViuvas } from '../lib/tipografia.js';
import { Cadeado } from './Icones.jsx';

const pequeno = { margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 };
const link = { border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 12, padding: 0, textDecoration: 'underline', cursor: 'pointer' };

export default function ComentariosTema({ tema }) {
  const { avisar, podeLer } = useEstado();
  const { notas, carregado, semTabela } = useNotasTema();
  const [editando, setEditando] = useState(null); // id da nota
  if (!podeLer || semTabela) return null;
  const lista = notasDoTema(notas, tema);

  async function apagar(n) {
    if (!confirm('Apagar este comentário?')) return;
    try { await apagarNotaTema(n.id); } catch (e) { avisar('Não deu para apagar: ' + e.message); }
  }

  return (
    <section id="comentarios-tema" className="painel" aria-labelledby="t-coment-tema" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 84 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '4px 12px' }}>
        <h2 id="t-coment-tema" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>Comentários sobre o tema</h2>
        <span style={{ ...pequeno, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Cadeado size={12} /> Só você vê</span>
      </div>
      {!carregado ? <p style={pequeno}>Carregando…</p> : lista.length > 0 && (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lista.map((n) => (
            <li key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12, borderLeft: '2px solid var(--line-strong)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{quando(n.criado_em)}{n.editado_em && ' · editado'}</span>
              {editando === n.id
                ? <Caixa inicial={n.texto} rotulo="Salvar" aoCancelar={() => setEditando(null)} aoEnviar={async (t) => { await editarNotaTema(n, t); setEditando(null); }} />
                : <>
                  <p className="leitura sigilo" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{n._trancado ? '(comentário trancado)' : semViuvas(n.texto)}</p>
                  {!n._trancado && <span style={{ display: 'flex', gap: 14 }}>
                    <button type="button" style={link} onClick={() => setEditando(n.id)}>editar</button>
                    <button type="button" style={link} onClick={() => apagar(n)}>apagar</button>
                  </span>}
                </>}
            </li>
          ))}
        </ol>
      )}
      {carregado && <Caixa key={tema} vazio={!lista.length} rotulo="Comentar" aoEnviar={(t) => comentarTema(tema, t)} />}
    </section>
  );
}

function Caixa({ inicial = '', rotulo, vazio, aoEnviar, aoCancelar }) {
  const { avisar } = useEstado();
  const [texto, setTexto] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try { await aoEnviar(texto); if (!aoCancelar) setTexto(''); } catch (err) { avisar('Não deu para salvar: ' + err.message); }
    setEnviando(false);
  }
  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label className="sr" htmlFor={aoCancelar ? 'editar-coment-tema' : 'novo-coment-tema'}>{aoCancelar ? 'Editar comentário' : 'Novo comentário sobre o tema'}</label>
      <textarea id={aoCancelar ? 'editar-coment-tema' : 'novo-coment-tema'} value={texto} onChange={(e) => setTexto(e.target.value)} rows={aoCancelar ? 3 : 2} maxLength={5000} autoFocus={!!aoCancelar}
        placeholder={vazio ? 'O que você percebe neste tema? Como ele aparece, o que muda de um sonho para outro…' : 'Escreva mais um comentário…'}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar(e); if (e.key === 'Escape' && aoCancelar) aoCancelar(); }}
        className="leitura sigilo" style={{ border: '1px solid var(--line-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.6, resize: 'vertical', background: '#fff' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {vazio && <span style={{ ...pequeno, fontSize: 12, flex: '1 1 160px' }}>{semViuvas('Fica junto do tema, com a data, para você ver como a sua leitura muda com o tempo.')}</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {aoCancelar && <button type="button" className="btn btn-linha" onClick={aoCancelar}>Cancelar</button>}
          <button className="btn btn-azul" disabled={!texto.trim() || enviando}>{enviando ? 'Salvando…' : rotulo}</button>
        </span>
      </div>
    </form>
  );
}
