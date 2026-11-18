import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { calcularInsights, META } from '../lib/insights.js';
import { INSIGHTS_EXEMPLO, insightDeExemplo, requisito } from '../lib/exemplos.js';
import { Cadeado } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

const plural = (n) => n + (n === 1 ? ' insight' : ' insights');
const linkTema = (t) => '/app/acervo?tema=' + encodeURIComponent(t);

function Barras({ barras }) {
  const max = Math.max(1, ...barras.map((m) => m.n));
  const destaque = barras.some((b) => b.destaque);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }} role="img" aria-label={barras.map((m) => m.rotulo + ' ' + m.n).join(', ')}>
      {barras.map((m, i) => {
        const forte = destaque ? m.destaque : i === barras.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{m.n}</span>
            <span style={{ width: '100%', height: Math.max(3, (m.n / max) * 60), borderRadius: 4, background: forte ? 'var(--azul)' : 'var(--azul-cinza)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{m.rotulo}</span>
          </div>
        );
      })}
    </div>
  );
}

// modo: 'real' (do acervo), 'exemplo' (inventado, aberto) ou 'bloqueado' (inventado, embaçado).
function Cartao({ i, modo = 'real', trava }) {
  const estiloTema = useCorTema();
  const chip = { height: 26, fontSize: 14 };
  const real = modo === 'real';
  const Chip = ({ t }) => (real
    ? <Link to={linkTema(t)} className="chip" style={{ ...estiloTema(t), ...chip }}>{t}</Link>
    : <span className="chip" style={{ ...estiloTema(t), ...chip }}>{t}</span>);
  const corpo = (
    <>
      {i.barras && <Barras barras={i.barras} />}
      {i.itens?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {i.itens.map((x, k) => (
            <li key={k} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
              {x.tema && <Chip t={x.tema} />}
              {x.par && <><span style={{ color: 'var(--muted)' }}>+</span><Chip t={x.par} /></>}
              {x.palavra && (real
                ? <Link to={'/app/acervo?q=' + encodeURIComponent(x.palavra)} className="chip" style={{ ...estiloTema(x.palavra), ...chip }}>{x.palavra}</Link>
                : <span className="chip" style={{ ...estiloTema(x.palavra), ...chip }}>{x.palavra}</span>)}
              {x.sonho && (real
                ? <Link to={'/app/sonho/' + x.sonho.id} style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ink)' }}>{x.sonho.titulo || 'Sem título'}</Link>
                : <span style={{ fontSize: 14.5, fontWeight: 800 }}>{x.sonho.titulo || 'Sem título'}</span>)}
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{x.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
  return (
    <article className={'insight' + (real ? '' : ' ' + modo)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: modo === 'bloqueado' ? 'var(--muted)' : 'var(--azul)' }}>{i.nome}</span>
        {modo === 'exemplo' && <span className="selo-exemplo">exemplo</span>}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{semViuvas(i.titulo)}</h2>
      {modo === 'bloqueado' ? (
        <div className="embacado-caixa">
          <div className="embacado" aria-hidden="true" inert="">{corpo}</div>
          <div className="trava"><Cadeado size={18} /><span>{semViuvas(trava)}</span></div>
        </div>
      ) : corpo}
      <p style={{ margin: 'auto 0 0', paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(i.termo)}</p>
    </article>
  );
}

function Secao({ rotulo, texto, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 680 }}>
        <span className="rotulo">{rotulo}</span>
        {texto && <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(texto)}</p>}
      </div>
      <div className="insights">{children}</div>
    </section>
  );
}

export default function Insights() {
  const { sonhos, exemplos } = useEstado();
  const r = useMemo(() => calcularInsights(sonhos), [sonhos]);
  const temos = new Set(r.lista.map((i) => i.id));
  // Os insights de exemplo saem junto com os sonhos de exemplo.
  const deExemplo = INSIGHTS_EXEMPLO.filter((id) => !temos.has(id)).slice(0, Math.min(INSIGHTS_EXEMPLO.length, exemplos.length));
  const bloqueados = Object.keys(META).filter((id) => !temos.has(id) && !deExemplo.includes(id));
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
        {r.lista.length > 0 && <span className="rotulo">{plural(r.lista.length)} no seu acervo</span>}
        <h1 className="titulo-m">Insights</h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('O que se repete, o que some e o que volta no seu acervo. O Sonhário não interpreta: ele mostra os padrões, e o sentido é seu. Quanto mais sonhos com tema, mais insights aparecem.')}</p>
      </div>
      {r.lista.length > 0
        ? <div className="insights">{r.lista.map((i) => <Cartao key={i.id} i={i} />)}</div>
        : <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>{semViuvas('Ainda não há padrões no seu acervo. Continue registrando seus sonhos e marcando temas: os insights aparecem aqui sozinhos.')}</p>}

      {deExemplo.length > 0 && (
        <Secao rotulo={deExemplo.length === 1 ? '1 exemplo' : deExemplo.length + ' exemplos'}
          texto="Para você ver como um insight fica. Os números são inventados, não vêm do seu acervo, e os exemplos saem conforme você registra os seus sonhos.">
          {deExemplo.map((id) => <Cartao key={id} i={insightDeExemplo(id)} modo="exemplo" />)}
        </Secao>
      )}

      {bloqueados.length > 0 && (
        <Secao rotulo={'Ainda bloqueados · ' + bloqueados.length}
          texto="Cada um se abre sozinho quando o seu acervo tiver algo a mostrar.">
          {bloqueados.map((id) => <Cartao key={id} i={insightDeExemplo(id)} modo="bloqueado" trava={requisito(id, r)} />)}
        </Secao>
      )}
    </div>
  );
}
