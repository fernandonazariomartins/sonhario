// Quadros largos do Laboratório onírico: o mapa das pessoas e o mapa dos temas no tempo.
// Só mostram contagens do próprio acervo; nada aqui interpreta.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCorTema } from '../lib/estado.jsx';
import { semViuvas } from '../lib/tipografia.js';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const data = (ms) => { const d = new Date(ms); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
const rotuloDe = (l) => l.tema || l.palavra;
const linkDe = (l) => (l.tema ? '/app/acervo?tema=' + encodeURIComponent(l.tema) : '/app/acervo?q=' + encodeURIComponent(l.palavra));

function Quadro({ nome, titulo, termo, children }) {
  return (
    <article className="insight largo">
      <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>{nome}</span>
      <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{semViuvas(titulo)}</h2>
      {children}
      <p style={{ margin: 'auto 0 0', paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 820 }}>{semViuvas(termo)}</p>
    </article>
  );
}

// ——— Pessoas ———

// Grafo de duas colunas: pessoas à esquerda, imagens à direita, linhas mais grossas quanto mais sonhos juntos.
function Grafo({ pessoas, sel, setSel }) {
  const peso = new Map();
  for (const p of pessoas) for (const l of p.ligados) {
    const v = peso.get(l.chave) || { ...l, total: 0 };
    v.total += l.n; peso.set(l.chave, v);
  }
  const simbolos = [...peso.values()].sort((a, b) => b.total - a.total).slice(0, 12);
  const linhas = Math.max(pessoas.length, simbolos.length);
  const alto = linhas * 34 + 16;
  const yP = (i) => 8 + 17 + i * 34 + ((linhas - pessoas.length) * 34) / 2;
  const yS = (j) => 8 + 17 + j * 34 + ((linhas - simbolos.length) * 34) / 2;
  const maxN = Math.max(1, ...pessoas.map((p) => p.n));
  const xP = 168, xS = 452;
  const atual = pessoas[sel];
  const ligadosAtual = new Set(atual?.ligados.map((l) => l.chave));
  return (
    <svg viewBox={'0 0 620 ' + alto} width="100%" role="img" aria-label="Pessoas ligadas às imagens que aparecem nos mesmos sonhos" style={{ display: 'block', maxHeight: 440 }}>
      {pessoas.map((p, i) => p.ligados.map((l) => {
        const j = simbolos.findIndex((s) => s.chave === l.chave);
        if (j < 0) return null;
        const ativo = i === sel;
        return (
          <path key={p.chave + l.chave} d={`M${xP + 8},${yP(i)} C${(xP + xS) / 2},${yP(i)} ${(xP + xS) / 2},${yS(j)} ${xS - 8},${yS(j)}`}
            fill="none" stroke={ativo ? 'var(--azul)' : 'var(--azul-cinza)'} strokeOpacity={ativo ? 0.9 : 0.35}
            strokeWidth={Math.min(7, 1 + l.n * 1.1)} strokeLinecap="round" />
        );
      }))}
      {pessoas.map((p, i) => {
        const ativo = i === sel;
        return (
          <g key={p.chave} role="button" tabIndex={0} aria-pressed={ativo} aria-label={p.nome} style={{ cursor: 'pointer' }}
            onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}>
            <rect x={0} y={yP(i) - 16} width={xP + 18} height={32} fill="transparent" />
            <text className="sigilo" x={xP - 8} y={yP(i)} textAnchor="end" dominantBaseline="central" fontSize={14} fontWeight={ativo ? 800 : 500} fill={ativo ? 'var(--azul)' : 'var(--ink)'}>{p.nome}</text>
            <circle cx={xP + 4} cy={yP(i)} r={4 + (p.n / maxN) * 6} fill={ativo ? 'var(--azul)' : 'var(--azul-cinza)'} />
          </g>
        );
      })}
      {simbolos.map((s, j) => {
        const ativo = ligadosAtual.has(s.chave);
        return (
          <g key={s.chave}>
            <circle cx={xS} cy={yS(j)} r={5} fill={ativo ? 'var(--azul)' : 'var(--node)'} />
            <text x={xS + 12} y={yS(j)} dominantBaseline="central" fontSize={13.5} fontWeight={ativo ? 700 : 400} fill={ativo ? 'var(--ink)' : 'var(--muted)'}>{rotuloDe(s)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Faixa do tempo: um traço por sonho em que a pessoa aparece.
function Faixa({ sonhos, periodo }) {
  const span = Math.max(1, periodo.fim - periodo.ini);
  const pos = (ms) => Math.min(100, Math.max(0, ((ms - periodo.ini) / span) * 100));
  return (
    <div>
      <div style={{ position: 'relative', height: 26, background: 'var(--cinza)', borderRadius: 8 }} role="img" aria-label={'Aparece em ' + sonhos.length + ' sonhos ao longo do acervo'}>
        {sonhos.map((s) => <span key={s.id} title={data(s.em)} style={{ position: 'absolute', top: 5, bottom: 5, left: pos(s.em) + '%', width: 3, marginLeft: -1.5, borderRadius: 2, background: 'var(--azul)' }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
        <span>{new Date(periodo.ini).getFullYear()}</span><span>hoje</span>
      </div>
    </div>
  );
}

function Detalhe({ p, periodo, rotulo }) {
  const estiloTema = useCorTema();
  const max = Math.max(1, ...p.ligados.map((l) => l.n));
  const ultimos = [...p.sonhos].reverse().slice(0, 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div>
        <Link to={p.ehTag ? '/app/acervo?tema=' + encodeURIComponent(p.nome) : '/app/acervo?q=' + encodeURIComponent(p.nome)} className="sigilo" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', textDecoration: 'none' }}>{p.nome}</Link>
        <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
          {semViuvas('em ' + plural(p.n, 'sonho', 'sonhos') + (p.peloNome ? ', pelo nome' : '') + ' · primeira vez em ' + data(p.sonhos[0].em) + (p.n > 1 ? ' · a mais recente em ' + data(p.sonhos[p.sonhos.length - 1].em) : ''))}
        </p>
      </div>
      <Faixa sonhos={p.sonhos} periodo={periodo} />
      {p.ligados.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="rotulo">{rotulo}</span>
          {p.ligados.map((l) => (
            <Link key={l.chave} to={linkDe(l)} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 34%) 1fr auto', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
              <span className="chip" style={{ ...(l.tema ? estiloTema(l.tema) : { background: 'transparent', border: '1px solid var(--line-strong)' }), height: 24, fontSize: 13, justifySelf: 'start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotuloDe(l)}</span>
              <span style={{ height: 10, borderRadius: 5, background: 'var(--cinza)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: (l.n / max) * 100 + '%', background: l.tema ? 'var(--azul)' : 'var(--azul-cinza)', borderRadius: 5 }} />
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--muted)', minWidth: 56, textAlign: 'right' }}>{l.n} de {p.n}</span>
            </Link>
          ))}
        </div>
      ) : <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>{semViuvas('Ainda nenhuma imagem se repete nos sonhos com essa pessoa.')}</p>}
      {p.junto.length > 0 && (
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
          Aparece junto com {p.junto.map((o, i) => <span key={o.nome}>{i ? ', ' : ''}<strong className="sigilo" style={{ color: 'var(--ink)' }}>{o.nome}</strong> ({o.n})</span>)}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="rotulo">Sonhos mais recentes com <span className="sigilo">{p.nome}</span></span>
        {ultimos.map((s) => (
          <Link key={s.id} to={'/app/sonho/' + s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, color: 'var(--ink)', textDecoration: 'none', padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
            <strong className="sigilo" style={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: s.titulo ? 'var(--ink)' : 'var(--muted)' }}>{s.titulo || 'Sem título'}</strong>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{data(s.em)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const TEXTOS = {
  relatos: { nome: 'Personificação', titulo: 'Quem aparece e o que vem junto', rotulo: 'No mesmo sonho',
    termo: 'Pessoas citadas nos relatos pelo papel (mãe, chefe) ou pelo nome, em pelo menos 3 sonhos. Toque numa delas para ver os temas e as imagens que mais aparecem nos sonhos em que ela está; o que já mora no mesmo ambiente (escola e colega) fica de fora. É contagem: mostra a companhia de cada figura, não o que ela significa.' },
  nomes: { nome: 'Pessoas pelo nome', titulo: 'As pessoas das suas tags e os seus símbolos', rotulo: 'Símbolos no mesmo sonho',
    termo: 'Só as tags com nome de alguém (Natália, Tia Marília), em pelo menos 3 sonhos; mãe, pai e criança ficam no quadro de cima. Toque numa pessoa para ver as outras tags que mais aparecem nos mesmos sonhos, pesando o quanto são raras no resto do acervo. É contagem: mostra a companhia de cada pessoa, não o que ela significa.' },
};

export function MapaPessoas({ pessoas, periodo, tipo = 'relatos' }) {
  const txt = TEXTOS[tipo];
  const [sel, setSel] = useState(0);
  if (!pessoas.length) return tipo === 'nomes' ? (
    <Quadro nome={txt.nome} titulo={txt.titulo} termo={txt.termo}>
      <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)' }}>{semViuvas('Ainda não há nenhuma tag com nome de pessoa em 3 sonhos ou mais. Quando você marcar alguém pelo nome, ela aparece aqui.')}</p>
    </Quadro>
  ) : null;
  const p = pessoas[Math.min(sel, pessoas.length - 1)];
  return (
    <Quadro nome={txt.nome} titulo={txt.titulo} termo={txt.termo}>
      <div className="lab-duas">
        <div className="lab-grafo" style={{ minWidth: 0 }}><Grafo pessoas={pessoas} sel={Math.min(sel, pessoas.length - 1)} setSel={setSel} /></div>
        {/* No celular, o grafo fica pequeno demais: as pessoas viram botões. */}
        <div className="lab-escolha" role="group" aria-label="Escolher pessoa">
          {pessoas.map((x, i) => (
            <button key={x.chave} type="button" aria-pressed={x === p} onClick={() => setSel(i)} className="chip"
              style={{ height: 32, fontSize: 14, cursor: 'pointer', border: 0, background: x === p ? 'var(--azul)' : 'var(--cinza)', color: x === p ? '#fff' : 'var(--ink)', fontWeight: x === p ? 800 : 600 }}>
              {x.nome} <span style={{ opacity: 0.75, fontWeight: 500, marginLeft: 6 }}>{x.n}</span>
            </button>
          ))}
        </div>
        <Detalhe p={p} periodo={periodo} rotulo={txt.rotulo} />
      </div>
    </Quadro>
  );
}

// ——— Temas no tempo ———

export function MapaTemas({ mapa }) {
  const estiloTema = useCorTema();
  if (!mapa) return null;
  const max = Math.max(1, ...mapa.linhas.flatMap((l) => l.valores));
  const maxTotal = Math.max(1, ...mapa.totais);
  const cols = mapa.rotulos.length;
  const grade = { display: 'grid', gridTemplateColumns: `minmax(96px, 150px) repeat(${cols}, minmax(30px, 1fr))`, gap: 3, alignItems: 'center', minWidth: 120 + cols * 34 };
  const periodo = mapa.passo === 1 ? 'mês' : mapa.passo === 3 ? 'trimestre' : 'semestre';
  return (
    <Quadro nome="Ritmo dos temas" titulo="Seus temas ao longo do tempo"
      termo={`Cada linha é um tema, cada coluna um ${periodo}. Quanto mais escuro, mais sonhos com aquele tema. Dá para ver o que chegou, o que voltou e o que ficou em silêncio. A última linha mostra quantos sonhos você registrou em cada ${periodo}.`}>
      <div style={{ overflowX: 'auto', margin: '0 -4px', padding: '0 4px 4px' }}>
        <div style={grade} role="table" aria-label="Temas por período">
          <span />
          {mapa.rotulos.map((r, c) => (
            <span key={c} style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.25 }}>
              {r.curto}{(c === 0 || mapa.rotulos[c - 1].ano !== r.ano) ? <><br /><strong style={{ color: 'var(--ink)' }}>{r.ano}</strong></> : <><br />&nbsp;</>}
            </span>
          ))}
          {mapa.linhas.map((l) => (
            <div key={l.tema} role="row" style={{ display: 'contents' }}>
              <Link to={'/app/acervo?tema=' + encodeURIComponent(l.tema)} className="chip" style={{ ...estiloTema(l.tema), height: 26, fontSize: 13.5, justifySelf: 'start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.tema}</Link>
              {l.valores.map((v, c) => (
                <span key={c} role="cell" title={l.tema + ' · ' + mapa.rotulos[c].curto + ' ' + mapa.rotulos[c].ano + ': ' + plural(v, 'sonho', 'sonhos')}
                  style={{ height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700,
                    background: v ? `color-mix(in srgb, var(--azul) ${Math.round(18 + (v / max) * 82)}%, var(--azul-claro))` : 'var(--cinza)',
                    color: v / max > 0.45 ? '#fff' : 'var(--azul-escuro)' }}>{v || ''}</span>
              ))}
            </div>
          ))}
          <span style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 6 }}>todos os sonhos</span>
          {mapa.totais.map((t, c) => (
            <span key={c} title={plural(t, 'sonho', 'sonhos')} style={{ height: 44, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 2, paddingTop: 6 }}>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{t || ''}</span>
              <span style={{ width: '70%', height: Math.max(2, (t / maxTotal) * 24), borderRadius: 3, background: 'var(--azul-cinza)' }} />
            </span>
          ))}
        </div>
      </div>
    </Quadro>
  );
}

// ——— Curva dos temas ———

// Cores dos destaques (validadas para daltonismo): sobe em azul, desce em terracota, volta em verde.
const COR = { sobe: '#0257AA', desce: '#C8551B', volta: '#1E8263' };
const SETA = { sobe: '↑', desce: '↓', volta: '↺' };

export function CurvaTemas({ curva }) {
  const estiloTema = useCorTema();
  const [sel, setSel] = useState({ destaque: 0 });
  const [foco, setFoco] = useState(null); // período sob o mouse ou o dedo
  // O desenho usa a largura real da caixa, para letras e linhas terem o mesmo tamanho no celular e no computador.
  const caixa = useRef(null);
  const [largura, setLargura] = useState(720);
  useEffect(() => {
    const el = caixa.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [curva]);
  if (!curva) return null;
  const { rotulos, totais, firme, parcial, linhas, destaques } = curva;
  const P = rotulos.length;
  const destaque = sel.tema ? null : destaques[sel.destaque] || null;
  const ativos = sel.tema ? [{ tema: sel.tema, papel: 'sobe' }] : destaque ? destaque.temas : [];
  const corDe = new Map(ativos.map((t) => [t.tema, COR[t.papel]]));

  const estreito = largura < 520;
  const W = Math.max(300, largura), H = estreito ? 260 : 300, esq = 40, dir = estreito ? 92 : 132, topo = 18, baixo = 40;
  const larg = W - esq - dir, alt = H - topo - baixo;
  const maxP = Math.max(0.1, ...linhas.flatMap((l) => l.p.filter((v) => v != null)));
  const teto = Math.min(1, Math.ceil(maxP * 10) / 10);
  const passoGrade = teto > 0.5 ? 0.25 : teto > 0.2 ? 0.1 : 0.05;
  const x = (i) => esq + (P === 1 ? larg / 2 : (i * larg) / (P - 1));
  const y = (v) => topo + alt - (v / teto) * alt;
  const trecho = (l, de, ate) => {
    let d = '', abre = true;
    for (let i = de; i <= ate; i++) {
      if (l.p[i] == null) { abre = true; continue; }
      d += (abre ? 'M' : 'L') + x(i).toFixed(1) + ',' + y(l.p[i]).toFixed(1);
      abre = false;
    }
    return d;
  };
  const ultimo = parcial ? P - 2 : P - 1; // o período em andamento entra tracejado
  const grade = [];
  for (let v = 0; v <= teto + 1e-9; v += passoGrade) grade.push(v);

  // Rótulos diretos no fim das linhas em destaque, afastados para não se encostarem.
  const fimDe = (l) => { for (let i = P - 1; i >= 0; i--) if (l.p[i] != null) return i; return 0; };
  const rotFim = linhas.filter((l) => corDe.has(l.tema)).map((l) => ({ l, i: fimDe(l), y: y(l.p[fimDe(l)]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < rotFim.length; k++) if (rotFim[k].y - rotFim[k - 1].y < 18) rotFim[k].y = rotFim[k - 1].y + 18;

  const pct = (v) => Math.round(v * 100) + '%';
  const nomeP = (i) => (curva.porAno ? rotulos[i] : rotulos[i].replace(/(\d+)\.(\d)/, '$2º semestre de $1'));
  const periodoNome = curva.porAno ? 'ano' : 'semestre';
  const resumoAria = (destaque ? destaque.texto + ' ' : '') + 'Temas: ' + linhas.map((l) => l.tema + ' ' + l.p.map((v, i) => rotulos[i] + ' ' + (v == null ? '-' : pct(v))).join(', ')).join('; ');

  return (
    <Quadro nome="Curva dos temas" titulo={`Como os seus temas cresceram e minguaram, ${periodoNome} a ${periodoNome}`}
      termo={`Cada linha é um tema: a parte dos sonhos de cada ${periodoNome} em que ele aparece. Usa a proporção, e não o número, para um ${periodoNome} com mais registros não parecer cheio de tudo. Os destaques são contas: um tema que sobe enquanto outro desce pode ser coincidência, ou uma imagem cedendo lugar a outra. O sentido é seu.`}>
      {destaques.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label="Destaques">
          {destaques.map((d, k) => {
            const on = !sel.tema && sel.destaque === k;
            return (
              <button key={d.id} type="button" aria-pressed={on} onClick={() => setSel({ destaque: k })}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: '1px solid ' + (on ? 'var(--ink)' : 'var(--line-strong)'), background: on ? 'var(--ink)' : 'var(--panel)', color: on ? '#fff' : 'var(--ink)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: on ? 0.8 : 0.65 }}>{d.nome}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, display: 'flex', gap: 8 }}>
                  {d.temas.map((t) => <span key={t.tema}><span aria-hidden="true" style={{ color: on ? '#fff' : COR[t.papel] }}>{SETA[t.papel]} </span><span className="sigilo">{t.tema}</span></span>)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div ref={caixa} style={{ position: 'relative' }} onPointerLeave={() => setFoco(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={resumoAria} style={{ display: 'block', overflow: 'visible' }}>
          {destaque && (
            <rect x={x(destaque.de)} y={topo} width={Math.max(2, x(destaque.ate) - x(destaque.de))} height={alt} fill="var(--azul-claro)" opacity={0.55} rx={4} />
          )}
          {grade.map((v) => (
            <g key={v}>
              <line x1={esq} x2={W - dir} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
              <text x={esq - 8} y={y(v)} textAnchor="end" dominantBaseline="central" fontSize={11} fill="var(--muted)">{pct(v)}</text>
            </g>
          ))}
          {rotulos.map((r, i) => (estreito && P > 6 && i % 2 !== (P - 1) % 2 && foco !== i) ? null : (
            <text key={i} x={x(i)} y={H - baixo + 18} textAnchor="middle" fontSize={estreito ? 10.5 : 11.5} fontWeight={foco === i ? 800 : 500} fill={firme[i] ? 'var(--ink)' : 'var(--subtle)'}>
              {r}{parcial && i === P - 1 ? '*' : ''}
            </text>
          ))}
          {foco != null && <line x1={x(foco)} x2={x(foco)} y1={topo} y2={topo + alt} stroke="var(--subtle)" strokeWidth={1} strokeDasharray="3 3" />}
          {/* Os outros temas ficam ao fundo, em cinza. */}
          {linhas.filter((l) => !corDe.has(l.tema)).map((l) => (
            <g key={l.tema} fill="none" stroke="var(--node)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
              <path d={trecho(l, 0, ultimo)} />
              {parcial && <path d={trecho(l, ultimo, P - 1)} strokeDasharray="3 4" />}
            </g>
          ))}
          {linhas.filter((l) => corDe.has(l.tema)).map((l) => {
            const cor = corDe.get(l.tema);
            return (
              <g key={l.tema}>
                <path d={trecho(l, 0, ultimo)} fill="none" stroke={cor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {parcial && <path d={trecho(l, ultimo, P - 1)} fill="none" stroke={cor} strokeWidth={2.5} strokeDasharray="4 5" strokeLinecap="round" />}
                {l.p.map((v, i) => v != null && (
                  <circle key={i} cx={x(i)} cy={y(v)} r={foco === i ? 6 : 4.5} fill={cor} stroke="var(--panel)" strokeWidth={2} />
                ))}
              </g>
            );
          })}
          {rotFim.map(({ l, i, y: yy }) => (
            <text key={l.tema} className="sigilo" x={x(i) + 12} y={yy} dominantBaseline="central" fontSize={estreito ? 12.5 : 13.5} fontWeight={800} fill="var(--ink)">
              <tspan fill={corDe.get(l.tema)}>{SETA[ativos.find((t) => t.tema === l.tema)?.papel] || ''} </tspan>{l.tema}
            </text>
          ))}
          {/* Faixas invisíveis por período: passar o mouse ou tocar mostra os números. */}
          {rotulos.map((_, i) => {
            const meio = P === 1 ? larg : larg / (P - 1);
            return <rect key={i} x={x(i) - meio / 2} y={0} width={meio} height={H} fill="transparent" style={{ cursor: 'crosshair' }}
              onPointerEnter={() => setFoco(i)} onClick={() => setFoco(i)} />;
          })}
        </svg>
        {foco != null && (
          <div role="status" style={{ position: 'absolute', top: 0, left: Math.max(0, Math.min(W - 180, foco > P / 2 ? x(foco) - 192 : x(foco) + 12)), width: 180, boxSizing: 'border-box',
            background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 10, boxShadow: 'var(--shadow-pop)', padding: '8px 12px', fontSize: 13, pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ fontWeight: 800 }}>{nomeP(foco)}{parcial && foco === P - 1 ? ' (até agora)' : ''}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: ativos.length ? 4 : 0 }}>{plural(totais[foco], 'sonho registrado', 'sonhos registrados')}{!firme[foco] ? ' · poucos para comparar' : ''}</div>
            {linhas.filter((l) => corDe.has(l.tema)).map((l) => (
              <div key={l.tema} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 3, borderRadius: 2, background: corDe.get(l.tema) }} />
                <span className="sigilo">{l.tema}</span>
                <strong style={{ marginLeft: 'auto', paddingLeft: 10 }}>{l.p[foco] == null ? '–' : pct(l.p[foco])}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>({l.n[foco]})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(destaque || sel.tema) && (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, maxWidth: 680 }} className="sigilo">
          {destaque ? semViuvas(destaque.texto) : (() => {
            const l = linhas.find((m) => m.tema === sel.tema);
            const vals = l.p.map((v, i) => (v == null ? null : { v, i })).filter(Boolean);
            const ini = vals[0], fim = vals[vals.length - 1];
            return semViuvas(`${l.tema}: em ${pct(ini.v)} dos sonhos de ${nomeP(ini.i)} e em ${pct(fim.v)} dos de ${nomeP(fim.i)}, em ${plural(l.total, 'sonho', 'sonhos')} no total.`);
          })()}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginRight: 2 }}>Ver um tema:</span>
        {linhas.map((l) => {
          const on = sel.tema === l.tema;
          return (
            <button key={l.tema} type="button" aria-pressed={on} className="chip" onClick={() => setSel(on ? { destaque: 0 } : { tema: l.tema })}
              style={{ ...estiloTema(l.tema), height: 26, fontSize: 13, cursor: 'pointer', border: 0, outline: on ? '2px solid var(--ink)' : 'none', outlineOffset: 1, fontWeight: on ? 800 : 600 }}>
              {l.tema}
            </button>
          );
        })}
        {parcial && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>* {periodoNome} em andamento, tracejado</span>}
      </div>
    </Quadro>
  );
}
