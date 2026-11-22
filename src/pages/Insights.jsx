import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { calcularInsights, calcularLaboratorio, META } from '../lib/insights.js';
import { INSIGHTS_EXEMPLO, insightDeExemplo, requisito } from '../lib/exemplos.js';
import { Cadeado } from '../components/Icones.jsx';
import { CurvaTemas, MapaPessoas, MapaTemas } from '../components/Laboratorio.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { compararNovidades, guardar, linhas, quandoFoi } from '../lib/novidades.js';

const plural = (n) => n + (n === 1 ? ' observação' : ' observações');
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
function Cartao({ i, modo = 'real', trava, novidade }) {
  const estiloTema = useCorTema();
  const chip = { height: 26, fontSize: 14 };
  const mini = { height: 22, fontSize: 12.5 };
  const real = modo === 'real';
  const Chip = ({ t }) => (real
    ? <Link to={linkTema(t)} className="chip" style={{ ...estiloTema(t), ...chip }}>{t}</Link>
    : <span className="chip" style={{ ...estiloTema(t), ...chip }}>{t}</span>);
  const chaves = novidade ? linhas(i).map((l) => l.chave) : [];
  const corpo = (
    <>
      {i.barras && <Barras barras={i.barras} />}
      {i.itens?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {i.itens.map((x, k) => (
            <li key={k} className={novidade && !novidade.nova && novidade.linhas.has(chaves[k]) ? 'linha-nova' : undefined} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
              {x.tema && <Chip t={x.tema} />}
              {x.par && <><span style={{ color: 'var(--muted)' }}>{x.seta ? '→' : '+'}</span><Chip t={x.par} /></>}
              {x.palavra && (real
                ? <Link to={'/app/acervo?q=' + encodeURIComponent(x.palavra)} className="chip" style={{ ...estiloTema(x.palavra), ...chip }}>{x.palavra}</Link>
                : <span className="chip" style={{ ...estiloTema(x.palavra), ...chip }}>{x.palavra}</span>)}
              {x.parPalavra && <><span style={{ color: 'var(--muted)' }}>+</span>{real
                ? <Link to={'/app/acervo?q=' + encodeURIComponent(x.parPalavra)} className="chip" style={{ ...estiloTema(x.parPalavra), ...chip }}>{x.parPalavra}</Link>
                : <span className="chip" style={{ ...estiloTema(x.parPalavra), ...chip }}>{x.parPalavra}</span>}</>}
              {x.sonho && (real
                ? <Link to={'/app/sonho/' + x.sonho.id} className="sigilo" style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ink)' }}>{x.sonho.titulo || 'Sem título'}</Link>
                : <span className="sigilo" style={{ fontSize: 14.5, fontWeight: 800 }}>{x.sonho.titulo || 'Sem título'}</span>)}
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{x.texto}</span>
              {x.ligados?.length > 0 && (
                <span style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '2px solid var(--line)', margin: '2px 0 4px' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>no mesmo sonho:</span>
                  {x.ligados.map((l) => (l.tema
                    ? (real ? <Link key={'t' + l.tema} to={linkTema(l.tema)} className="chip" style={{ ...estiloTema(l.tema), ...mini }}>{l.tema}</Link>
                      : <span key={'t' + l.tema} className="chip" style={{ ...estiloTema(l.tema), ...mini }}>{l.tema}</span>)
                    : (real ? <Link key={'p' + l.palavra} to={'/app/acervo?q=' + encodeURIComponent(l.palavra)} className="chip" style={{ ...mini, background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink)' }}>{l.palavra}</Link>
                      : <span key={'p' + l.palavra} className="chip" style={{ ...mini, background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink)' }}>{l.palavra}</span>)))}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
  return (
    <article className={'insight' + (real ? '' : ' ' + modo) + (novidade ? ' com-novidade' : '')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="rotulo-forte" style={{ color: modo === 'bloqueado' ? 'var(--muted)' : 'var(--azul)' }}>{i.nome}</span>
        {modo === 'exemplo' && <span className="selo-exemplo">exemplo</span>}
        {novidade && <span className="selo-novidade">{novidade.nova ? 'nova' : 'atualizada'} {quandoFoi(novidade.quando)}</span>}
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
  const { sonhos, exemplos, carregado, podeLer, usuario, laboratorio, mudarLaboratorio, avisar } = useEstado();
  const r = useMemo(() => calcularInsights(sonhos), [sonhos]);
  const lab = useMemo(() => (laboratorio ? calcularLaboratorio(sonhos) : null), [laboratorio, sonhos]);
  // Vindo da busca (#laboratorio), desce até a seção.
  useEffect(() => {
    if (lab && location.hash === '#laboratorio') document.getElementById('laboratorio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lab]);
  // Só compara com a última visita quando o acervo já está todo carregado e legível.
  const estavel = carregado && podeLer && sonhos.length > 0;
  const uid = usuario?.id;
  const nov = useMemo(() => (estavel ? compararNovidades(r.lista, uid) : null), [estavel, r, uid]);
  useEffect(() => { if (nov) guardar(uid, nov.vistas); }, [nov, uid]);
  const novidades = nov?.novidades || {};
  // As que têm novidade vêm primeiro, da mais recente para a mais antiga.
  const ordem = [...r.lista].sort((a, b) => (novidades[b.id]?.quando || 0) - (novidades[a.id]?.quando || 0));
  const comNovidade = r.lista.filter((i) => novidades[i.id]).length;
  const temos = new Set(r.lista.map((i) => i.id));
  // As observações de exemplo saem junto com os sonhos de exemplo.
  const deExemplo = INSIGHTS_EXEMPLO.filter((id) => !temos.has(id)).slice(0, Math.min(INSIGHTS_EXEMPLO.length, exemplos.length));
  const bloqueados = Object.keys(META).filter((id) => !temos.has(id) && !deExemplo.includes(id));
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
        {r.lista.length > 0 && <span className="rotulo">{plural(r.lista.length)} no seu acervo{comNovidade > 0 && <span style={{ color: 'var(--azul)' }}>{' · ' + comNovidade + (comNovidade === 1 ? ' com novidade' : ' com novidades')}</span>}</span>}
        <h1 className="titulo-m">Observações</h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('O que se repete, o que some e o que volta no seu acervo. O Sonhário não interpreta: ele mostra os padrões, e o sentido é seu. Quanto mais sonhos com tema, mais observações aparecem.')}</p>
      </div>
      {r.lista.length > 0
        ? <div className="insights">{ordem.map((i) => <Cartao key={i.id} i={i} novidade={novidades[i.id]} />)}</div>
        : <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>{semViuvas('Ainda não há padrões no seu acervo. Continue registrando seus sonhos e marcando temas: as observações aparecem aqui sozinhas.')}</p>}

      {lab && (
        <section id="laboratorio" aria-label="Laboratório onírico" className="laboratorio">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 680 }}>
              <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>Laboratório onírico</span>
              <h2 className="titulo-m" style={{ fontSize: 26 }}>Observações extras</h2>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas('Em teste. Mostram o que anda junto no seu acervo e talvez tenha passado sem você notar. Continuam sendo contagens: o sentido é seu. Só aparecem para quem abriu o laboratório.')}</p>
            </div>
            <button type="button" className="btn btn-linha" style={{ minHeight: 36 }} onClick={() => { mudarLaboratorio(false); avisar('Laboratório fechado. Para abrir de novo, use a senha na busca.'); }}>Fechar o laboratório</button>
          </div>
          {(lab.lista.length > 0 || lab.pessoas.length > 0 || lab.nomes.length > 0 || lab.mapaTemas || lab.curva)
            ? (
              <div className="insights">
                <MapaPessoas pessoas={lab.pessoas} periodo={lab.periodo} />
                <MapaPessoas pessoas={lab.nomes} periodo={lab.periodo} tipo="nomes" />
                <CurvaTemas curva={lab.curva} />
                <MapaTemas mapa={lab.mapaTemas} />
                {lab.lista.map((i) => <Cartao key={i.id} i={i} />)}
              </div>
            )
            : <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>{semViuvas(sonhos.length < 10 ? 'As observações extras aparecem a partir de 10 sonhos registrados.' : 'Ainda não há nada para mostrar aqui. Com mais sonhos e temas, as observações extras aparecem sozinhas.')}</p>}
        </section>
      )}

      {deExemplo.length > 0 && (
        <Secao rotulo={deExemplo.length === 1 ? '1 exemplo' : deExemplo.length + ' exemplos'}
          texto="Para você ver como uma observação fica. Os números são inventados, não vêm do seu acervo, e os exemplos saem conforme você registra os seus sonhos.">
          {deExemplo.map((id) => <Cartao key={id} i={insightDeExemplo(id)} modo="exemplo" />)}
        </Secao>
      )}

      {bloqueados.length > 0 && (
        <Secao rotulo={'Ainda bloqueadas · ' + bloqueados.length}
          texto="Cada uma se abre sozinha quando o seu acervo tiver algo a mostrar.">
          {bloqueados.map((id) => <Cartao key={id} i={insightDeExemplo(id)} modo="bloqueado" trava={requisito(id, r)} />)}
        </Secao>
      )}
    </div>
  );
}
