// Relatório de um tema, para salvar em PDF (ou imprimir) e levar à sessão.
// A página já é o relatório: o botão "Baixar PDF" abre o salvar como PDF do sistema.
// Tudo é montado no aparelho, com os sonhos já abertos: nada sai para servidor nenhum.
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { retratoDoTema } from '../lib/insights.js';
import { STATUS, dataLonga } from '../lib/sonhos.js';

// Como no sonho, mas com o ano: no relatório os sonhos atravessam anos.
const dataComAno = (iso) => dataLonga(iso).replace(/ · /, ' de ' + new Date(iso).getFullYear() + ' · ');
import { nomeDe } from '../lib/compartilhar.js';
import { semViuvas } from '../lib/tipografia.js';
import Assinatura from '../components/Assinatura.jsx';
import { Marca, Documento, Voltar } from '../components/Icones.jsx';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const data = (ms) => { const d = new Date(ms); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const plural = (n, um, varios) => n.toLocaleString('pt-BR') + ' ' + (n === 1 ? um : varios);
const pct = (v) => Math.round(v * 100) + '%';
const n = semViuvas;

// Sonhos por período (mês, trimestre ou ano, conforme o tamanho do intervalo): todos e os com o tema.
function porPeriodo(todos, tema, ini, fim) {
  const a = new Date(ini), z = new Date(fim);
  const meses = (z.getFullYear() - a.getFullYear()) * 12 + z.getMonth() - a.getMonth() + 1;
  const passo = meses <= 36 ? 1 : meses <= 96 ? 3 : 12;
  const chave = (d) => Math.floor((d.getFullYear() * 12 + d.getMonth()) / passo);
  const k0 = chave(a), k1 = chave(z);
  const baldes = Array.from({ length: k1 - k0 + 1 }, (_, i) => {
    const m = (k0 + i) * passo;
    const ano = Math.floor(m / 12), mes = m % 12;
    const rotulo = passo === 12 ? String(ano) : passo === 3 ? `${Math.floor(mes / 3) + 1}º tri ${ano}` : `${MESES[mes]} ${ano}`;
    return { ano, mes, rotulo, total: 0, tema: 0 };
  });
  for (const s of todos) {
    const b = baldes[chave(new Date(s.sonhado_em)) - k0];
    if (!b) continue;
    b.total++;
    if (s.temas?.includes(tema)) b.tema++;
  }
  return { baldes, passo };
}

function GraficoTempo({ baldes, passo, tema }) {
  const W = 680, H = 190, esq = 30, dir = 8, topo = 12, base = 30;
  const max = Math.max(1, ...baldes.map((b) => b.total));
  const larg = (W - esq - dir) / baldes.length;
  const barra = Math.max(2, Math.min(28, larg - 2));
  const y = (v) => topo + (H - topo - base) * (1 - v / max);
  // Rótulos: o começo de cada ano (ou cada ano, por ano), sem amontoar.
  const marcas = baldes.map((b, i) => ({ b, i })).filter(({ b, i }) => passo === 12 || i === 0 || b.mes === 0);
  const pulo = Math.ceil(marcas.length / 10);
  const passoNome = passo === 1 ? 'mês' : passo === 3 ? 'trimestre' : 'ano';
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Sonhos por ${passoNome}: todos e os com ${tema}`} style={{ display: 'block' }}>
        <line x1={esq} x2={W - dir} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" />
        <line x1={esq} x2={W - dir} y1={y(max)} y2={y(max)} stroke="var(--line)" strokeDasharray="2 3" />
        <text x={esq - 6} y={y(max) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{max}</text>
        <text x={esq - 6} y={y(0) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">0</text>
        {baldes.map((b, i) => {
          const x = esq + i * larg + (larg - barra) / 2;
          const r = Math.min(4, barra / 2);
          return (
            <g key={i}>
              <title>{`${b.rotulo}: ${plural(b.tema, 'sonho', 'sonhos')} com ${tema}, de ${plural(b.total, 'registrado', 'registrados')}`}</title>
              <rect x={esq + i * larg} y={topo} width={larg} height={H - topo - base} fill="transparent" />
              {b.total > 0 && <path d={`M${x},${y(0)} V${y(b.total) + r} q0,-${r} ${r},-${r} h${barra - 2 * r} q${r},0 ${r},${r} V${y(0)} Z`} fill="var(--line)" />}
              {b.tema > 0 && <path d={`M${x},${y(0)} V${y(b.tema) + r} q0,-${r} ${r},-${r} h${barra - 2 * r} q${r},0 ${r},${r} V${y(0)} Z`} fill="var(--azul)" />}
            </g>
          );
        })}
        {marcas.filter((_, k) => k % pulo === 0).map(({ b, i }) => (
          <text key={i} x={esq + i * larg + larg / 2} y={H - 10} textAnchor={i === 0 ? 'start' : 'middle'} fontSize="11" fill="var(--muted)">{passo === 1 && b.mes !== 0 ? b.rotulo : passo === 3 && b.mes !== 0 ? b.rotulo : String(b.ano)}</text>
        ))}
      </svg>
      <figcaption style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
        <span><i className="rel-amostra" style={{ background: 'var(--azul)' }} />com {tema}</span>
        <span><i className="rel-amostra" style={{ background: 'var(--line)' }} />todos os sonhos registrados</span>
        <span>· por {passoNome}</span>
      </figcaption>
    </figure>
  );
}

function Barras({ itens, de, estilo }) {
  const max = Math.max(1, ...itens.map((x) => x.n));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {itens.map((x) => (
        <div key={x.nome} title={`${x.nome}: ${x.n} de ${de}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 38%) 1fr 52px', alignItems: 'center', gap: 10 }}>
          <span className="chip sigilo-tag" style={{ ...(estilo ? estilo(x.nome) : { border: '1px solid var(--line-strong)' }), justifySelf: 'start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.nome}</span>
          <span style={{ height: 8, borderRadius: 4, background: 'var(--cinza)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: (x.n / max) * 100 + '%', background: 'var(--azul)', borderRadius: 4 }} />
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'right' }}>{x.n} de {de}</span>
        </div>
      ))}
    </div>
  );
}

function Status({ lista }) {
  const cont = Object.keys(STATUS).map((k) => ({ k, n: lista.filter((s) => (s.status || 'nao_aberto') === k).length })).filter((x) => x.n);
  const total = lista.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 2, height: 12, borderRadius: 6, overflow: 'hidden' }} role="img" aria-label={cont.map((x) => `${STATUS[x.k].rotulo}: ${x.n}`).join(', ')}>
        {cont.map((x) => <span key={x.k} style={{ flex: x.n, background: STATUS[x.k].cor }} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13 }}>
        {cont.map((x) => <span key={x.k}><i className="rel-amostra" style={{ background: STATUS[x.k].cor }} />{STATUS[x.k].rotulo} <strong>{x.n}</strong> <span style={{ color: 'var(--muted)' }}>({pct(x.n / total)})</span></span>)}
      </div>
    </div>
  );
}

function Bloco({ titulo, dica, children, largo }) {
  return (
    <section className="rel-bloco" style={largo ? { gridColumn: '1 / -1' } : undefined}>
      <h3 className="rotulo">{titulo}</h3>
      {children}
      {dica && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{n(dica)}</p>}
    </section>
  );
}

function ImagensDoSonho({ imagens, urlImagem }) {
  const [urls, setUrls] = useState([]);
  const chave = imagens.map((i) => i.ref).join('|');
  useEffect(() => {
    let vivo = true;
    Promise.all(imagens.map((i) => urlImagem(i.ref).catch(() => null))).then((u) => vivo && setUrls(u.filter(Boolean)));
    return () => { vivo = false; };
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!urls.length) return null;
  return <div className="rel-imagens">{urls.map((u, k) => <img key={k} src={u} alt="" className="sigilo" />)}</div>;
}

export default function Relatorio() {
  const { sonhos, usuario, urlImagem, laboratorio, carregado } = useEstado();
  const estiloTema = useCorTema();
  const [params, setParams] = useSearchParams();

  const temas = useMemo(() => {
    const c = new Map();
    for (const s of sonhos) for (const t of new Set(s.temas || [])) c.set(t, (c.get(t) || 0) + 1);
    return [...c].map(([nome, k]) => ({ nome, n: k })).sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [sonhos]);
  const tema = params.get('tema') && temas.some((t) => t.nome === params.get('tema')) ? params.get('tema') : temas[0]?.nome || '';
  const anos = useMemo(() => [...new Set(sonhos.filter((s) => s.temas?.includes(tema)).map((s) => new Date(s.sonhado_em).getFullYear()))].sort((a, b) => b - a), [sonhos, tema]);
  const ano = anos.includes(+params.get('ano')) ? +params.get('ano') : null;
  const [comRelatos, setComRelatos] = useState(true);
  const [comAmps, setComAmps] = useState(true);
  const [comImagens, setComImagens] = useState(true);
  const mudar = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); if (k === 'tema') p.delete('ano'); setParams(p, { replace: true }); };

  // O período: o acervo todo ou um ano.
  const doPeriodo = useMemo(() => (ano ? sonhos.filter((s) => new Date(s.sonhado_em).getFullYear() === ano) : sonhos), [sonhos, ano]);
  const r = useMemo(() => (tema ? retratoDoTema(doPeriodo, tema) : null), [doPeriodo, tema]);
  const lista = useMemo(() => doPeriodo.filter((s) => s.temas?.includes(tema)).sort((a, b) => a.sonhado_em.localeCompare(b.sonhado_em)), [doPeriodo, tema]);
  const tempo = useMemo(() => {
    if (!lista.length) return null;
    const ini = ano ? new Date(ano, 0, 1) : new Date(lista[0].sonhado_em);
    const fim = ano ? new Date(ano, 11, 31) : new Date();
    return porPeriodo(doPeriodo, tema, ini, fim);
  }, [doPeriodo, tema, lista, ano]);
  const comImagem = lista.some((s) => s.imagens?.length);
  const comAmp = lista.some((s) => s.conclusoes?.some((c) => c.texto?.trim()));

  function baixarPdf() {
    // O PDF sai com o nome do título da página; o modo discreto sai do caminho só durante a impressão.
    const h = document.documentElement;
    const discreto = h.classList.contains('discreto');
    const titulo = document.title;
    document.title = `Sonhário · ${tema}${ano ? ' · ' + ano : ''}`;
    h.classList.remove('discreto');
    const voltar = () => { document.title = titulo; if (discreto) h.classList.add('discreto'); window.removeEventListener('afterprint', voltar); };
    window.addEventListener('afterprint', voltar);
    setTimeout(() => window.print(), 50);
  }

  if (!temas.length) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 className="titulo-m">Relatório de um tema</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{n(carregado ? 'Ainda não há sonhos com tema. Marque temas nos seus sonhos e o relatório aparece aqui.' : 'Abrindo o acervo…')}</p>
      </div>
    );
  }

  const nome = usuario ? nomeDe(usuario) : '';
  const periodoTexto = ano ? String(ano) : r ? `${data(r.primeiro.em)} a ${data(Date.now())}` : '';
  const juntos = (r?.companhia || []).map((c) => ({ nome: c.tema, n: c.n }));
  const pessoas = (r?.pessoas || []).map((p) => ({ nome: p.nome, n: p.n, tag: p.tag }));

  return (
    <div className="rel-pagina">
      <div className="nao-imprime rel-controles">
        <Link to={'/app/acervo?tema=' + encodeURIComponent(tema)} className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} /> Acervo</Link>
        <label className="rel-campo">
          <span className="rotulo">Tema</span>
          <select className="campo" value={tema} onChange={(e) => mudar('tema', e.target.value)}>
            {temas.map((t) => <option key={t.nome} value={t.nome}>{t.nome} ({t.n})</option>)}
          </select>
        </label>
        <label className="rel-campo">
          <span className="rotulo">Período</span>
          <select className="campo" value={ano || ''} onChange={(e) => mudar('ano', e.target.value)}>
            <option value="">Todo o acervo</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <div className="rel-opcoes">
          <label><input type="checkbox" checked={comRelatos} onChange={(e) => setComRelatos(e.target.checked)} /> Relatos</label>
          {comAmp && <label><input type="checkbox" checked={comAmps} onChange={(e) => setComAmps(e.target.checked)} /> Amplificações</label>}
          {comImagem && <label><input type="checkbox" checked={comImagens} onChange={(e) => setComImagens(e.target.checked)} /> Imagens</label>}
        </div>
        <button type="button" className="btn btn-preto" style={{ marginLeft: 'auto' }} onClick={baixarPdf} disabled={!r}><Documento size={17} /> Baixar PDF</button>
        <p className="rel-dica">{n('O botão abre a janela de impressão: escolha “Salvar como PDF”. No celular, toque em compartilhar e salve em Arquivos.')}</p>
      </div>

      {r && (
        <article className="relatorio" lang="pt-BR">
          <header className="rel-cabecalho">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="marca-quadrado"><Marca /></span>
              <strong style={{ fontSize: 16, fontWeight: 800 }}>Sonhário</strong>
              <span className="rotulo" style={{ marginLeft: 'auto' }}>Relatório do tema</span>
            </div>
            <h1 className="rel-titulo"><span className="sigilo-tag" style={{ ...estiloTema(tema), padding: '0 14px', borderRadius: 8 }}>{tema}</span></h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
              {nome && <><span className="sigilo">{nome}</span> · </>}{periodoTexto} · gerado em {data(Date.now())}
            </p>
          </header>

          <div className="rel-numeros">
            <div><strong>{r.n}</strong><span>{n((r.n === 1 ? 'sonho com o tema' : 'sonhos com o tema') + ' · ' + pct(r.p) + ' dos ' + plural(r.N, 'sonho', 'sonhos') + (ano ? ' de ' + ano : ' do acervo'))}</span></div>
            <div><strong>{data(r.primeiro.em)}</strong><span>{ano ? 'o primeiro no ano' : 'a primeira vez'}</span></div>
            <div><strong>{data(r.ultimo.em)}</strong><span>o mais recente</span></div>
            <div><strong>{r.comAmplificacao}</strong><span>{r.comAmplificacao === 1 ? 'com amplificação' : 'com amplificações'}</span></div>
          </div>

          <div className="rel-grade">
            {tempo && tempo.baldes.length > 1 && (
              <Bloco titulo="Quando aparece" largo dica={r.fase && !ano ? `Pesou mais em ${r.fase.ano}: ${pct(r.fase.p)} dos sonhos daquele ano, contra ${pct(r.fase.geral)} no acervo todo.` : null}>
                <GraficoTempo baldes={tempo.baldes} passo={tempo.passo} tema={tema} />
              </Bloco>
            )}
            {juntos.length > 0 && (
              <Bloco titulo="Com o que vem" dica="Outros temas marcados no mesmo sonho.">
                <Barras itens={juntos} de={r.n} estilo={estiloTema} />
              </Bloco>
            )}
            {pessoas.length > 0 && (
              <Bloco titulo="Quem aparece" dica="Pessoas das tags e dos relatos, pelo papel ou pelo nome.">
                <Barras itens={pessoas} de={r.n} estilo={(nm) => (pessoas.find((p) => p.nome === nm)?.tag ? estiloTema(nm) : { border: '1px solid var(--line-strong)' })} />
              </Bloco>
            )}
            <Bloco titulo="Como estão os sonhos" dica={r.favoritos ? `${plural(r.favoritos, 'favorito', 'favoritos')} entre eles.` : null}>
              <Status lista={lista} />
            </Bloco>
            {laboratorio && r.clima.length > 0 && (
              <Bloco titulo="O clima dos relatos" dica="Palavras de sentimento nos relatos com o tema; ao lado, o mesmo no resto.">
                {r.clima.map((c) => (
                  <div key={c.nome} style={{ display: 'grid', gridTemplateColumns: '86px 1fr auto', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <strong>{c.nome}</strong>
                    <span style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--cinza)' }}>
                      <span style={{ position: 'absolute', inset: 0, width: Math.min(100, c.p * 100) + '%', background: 'var(--azul)', borderRadius: 4 }} />
                      <span style={{ position: 'absolute', top: -3, bottom: -3, left: Math.min(100, c.pFora * 100) + '%', width: 2, background: 'var(--ink)' }} />
                    </span>
                    <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{pct(c.p)} · resto {pct(c.pFora)}</span>
                  </div>
                ))}
              </Bloco>
            )}
          </div>

          {laboratorio && r.perguntas.length > 0 && (
            <section className="rel-perguntas">
              <h3 className="rotulo-forte" style={{ color: 'var(--azul)' }}>Para levar à sessão</h3>
              <ol>{r.perguntas.map((q, k) => <li key={k} className="sigilo">{n(q)}</li>)}</ol>
            </section>
          )}

          <p className="rel-nota">{n(`Contagens feitas a partir dos seus registros. O relatório reúne o material em volta de ${tema}; o sentido fica com você e com quem te acompanha.`)}</p>

          <section className="rel-sonhos">
            <h2 className="rel-subtitulo">{lista.length === 1 ? 'O sonho' : `Os ${lista.length} sonhos`}, do mais antigo ao mais recente</h2>
            {lista.map((s) => {
              const outros = (s.temas || []).filter((t) => t !== tema);
              const amps = comAmps ? (s.conclusoes || []).filter((c) => c.texto?.trim()) : [];
              return (
                <article key={s.id} className="rel-sonho">
                  <div className="rel-sonho-topo">
                    <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{dataComAno(s.sonhado_em)}</span>
                    <h3 className="sigilo">{s.titulo?.trim() || 'Sem título'}{s.favorito && <span aria-label="favorito" style={{ color: '#E8A100', marginLeft: 6 }}>★</span>}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 }}>
                      <span className="rel-status"><i className="rel-amostra" style={{ background: STATUS[s.status]?.cor || STATUS.nao_aberto.cor }} />{STATUS[s.status]?.rotulo || 'não aberto'}</span>
                      {outros.map((t) => <span key={t} className="chip" style={estiloTema(t)}>{t}</span>)}
                    </div>
                  </div>
                  {comRelatos && s.texto?.trim() && <div className="rel-relato sigilo">{s.texto.trim().split(/\n{2,}/).map((p, k) => <p key={k}>{n(p)}</p>)}</div>}
                  {comImagens && s.imagens?.length > 0 && <ImagensDoSonho imagens={s.imagens} urlImagem={urlImagem} />}
                  {amps.length > 0 && (
                    <div className="rel-amps">
                      <span className="rotulo">Amplificações</span>
                      {amps.map((c, k) => <p key={k} className="sigilo">{n(c.texto.trim())}{c.em && <span style={{ color: 'var(--muted)', fontFamily: 'var(--sans)', fontSize: 11.5 }}> · {data(+new Date(c.em))}</span>}</p>)}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <footer className="rel-rodape"><Assinatura compacta /></footer>
        </article>
      )}
    </div>
  );
}
