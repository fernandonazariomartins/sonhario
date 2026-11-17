import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { calcularInsights } from '../lib/insights.js';
import { semViuvas } from '../lib/tipografia.js';
import { Cadeado } from '../components/Icones.jsx';

const linkTema = (t) => '/app/acervo?v=temas&t=' + encodeURIComponent(t);

function Meses({ meses }) {
  const max = Math.max(1, ...meses.map((m) => m.n));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96 }} role="img" aria-label={'Sonhos por mês: ' + meses.map((m) => m.rotulo + ' ' + m.n).join(', ')}>
      {meses.map((m, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{m.n}</span>
          <span style={{ width: '100%', height: Math.max(3, (m.n / max) * 60), borderRadius: 4, background: i === meses.length - 1 ? 'var(--azul)' : 'var(--azul-cinza)' }} />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{m.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

function Cartao({ i }) {
  if (!i.liberado) {
    const pct = Math.min(100, Math.round((i.atual / i.meta) * 100));
    return (
      <article className="insight bloqueado" aria-label={i.nome + ', bloqueado'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
          <Cadeado size={16} /><span className="rotulo-forte">{i.nome}</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--muted)' }}>{semViuvas(i.titulo)}</h2>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(i.termo)}</p>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="barra"><span style={{ width: pct + '%' }} /></div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Desbloqueia com {i.meta} {i.falta} · {Math.min(i.atual, i.meta)} de {i.meta}</span>
        </div>
      </article>
    );
  }
  return (
    <article className="insight">
      <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>{i.nome}</span>
      <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{semViuvas(i.titulo)}</h2>
      {i.meses && <Meses meses={i.meses} />}
      {i.itens.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {i.itens.map((x, k) => (
            <li key={k} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 8px' }}>
              {x.tema && <Link to={linkTema(x.tema)} style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{x.tema}</Link>}
              {x.par && <><span style={{ color: 'var(--muted)' }}>+</span><Link to={linkTema(x.par)} style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{x.par}</Link></>}
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{x.texto}</span>
            </li>
          ))}
        </ul>
      ) : <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{semViuvas(i.vazio)}</p>}
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
        <span className="rotulo">{r.liberados} de {r.lista.length} desbloqueados</span>
        <h1 className="titulo-m">Insights</h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('O que se repete, o que some e o que volta no seu acervo. O Sonhário não interpreta: ele mostra os padrões, e o sentido é seu. Quanto mais sonhos com tema, mais insights se abrem.')}</p>
      </div>
      <div className="insights">{r.lista.map((i) => <Cartao key={i.id} i={i} />)}</div>
    </div>
  );
}
