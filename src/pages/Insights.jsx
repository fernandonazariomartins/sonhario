import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { calcularInsights } from '../lib/insights.js';
import { semViuvas } from '../lib/tipografia.js';

const plural = (n) => n + (n === 1 ? ' insight' : ' insights');
const linkTema = (t) => '/app/acervo?v=temas&t=' + encodeURIComponent(t);

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

function Cartao({ i }) {
  const estiloTema = useCorTema();
  const chip = { height: 26, fontSize: 14 };
  return (
    <article className="insight">
      <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>{i.nome}</span>
      <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{semViuvas(i.titulo)}</h2>
      {i.barras && <Barras barras={i.barras} />}
      {i.itens?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {i.itens.map((x, k) => (
            <li key={k} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
              {x.tema && <Link to={linkTema(x.tema)} className="chip" style={{ ...estiloTema(x.tema), ...chip }}>{x.tema}</Link>}
              {x.par && <><span style={{ color: 'var(--muted)' }}>+</span><Link to={linkTema(x.par)} className="chip" style={{ ...estiloTema(x.par), ...chip }}>{x.par}</Link></>}
              {x.palavra && <span className="chip" style={{ ...estiloTema(x.palavra), ...chip }}>{x.palavra}</span>}
              {x.sonho && <Link to={'/app/sonho/' + x.sonho.id} style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ink)' }}>{x.sonho.titulo || 'Sem título'}</Link>}
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{x.texto}</span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ margin: 'auto 0 0', paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(i.termo)}</p>
    </article>
  );
}

export default function Insights() {
  const { sonhos } = useEstado();
  const r = useMemo(() => calcularInsights(sonhos), [sonhos]);
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
        {r.lista.length > 0 && <span className="rotulo">{plural(r.lista.length)} no seu acervo</span>}
        <h1 className="titulo-m">Insights</h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('O que se repete, o que some e o que volta no seu acervo. O Sonhário não interpreta: ele mostra os padrões, e o sentido é seu. Quanto mais sonhos com tema, mais insights aparecem.')}</p>
      </div>
      {r.lista.length > 0
        ? <div className="insights">{r.lista.map((i) => <Cartao key={i.id} i={i} />)}</div>
        : <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>{semViuvas('Ainda não há padrões para mostrar. Continue registrando seus sonhos e marcando temas: os insights aparecem aqui sozinhos.')}</p>}
    </div>
  );
}
