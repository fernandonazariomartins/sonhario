// Tempo no acervo: a linha do tempo por ano (no lugar dos números de página)
// e a visualização em calendário.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CORES, tituloDe } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { useDiscreto } from '../lib/discreto.js';
import { Voltar, Avancar } from './Icones.jsx';

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const anoDe = (s) => new Date(s.sonhado_em).getFullYear();
const mesDe = (s) => new Date(s.sonhado_em).getMonth() + 1;
// No calendário, sonho sem título mostra o começo do relato.
const nomeCurto = (s) => s.titulo?.trim() || (s.texto || '').trim().split(/\s+/).slice(0, 6).join(' ') || (s.audio ? 'Só o áudio' : tituloDe(s));
const chaveDia = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

// { 2026: { total, meses: [12 números] }, ... }
export function contarPorAno(sonhos) {
  const r = {};
  for (const s of sonhos) {
    const a = anoDe(s);
    const x = (r[a] ||= { total: 0, meses: Array(12).fill(0) });
    x.total += 1;
    x.meses[mesDe(s) - 1] += 1;
  }
  return r;
}

export function noPeriodo(sonhos, ano, mes) {
  if (ano === 'todos') return sonhos;
  return sonhos.filter((s) => anoDe(s) === ano && (!mes || mesDe(s) === mes));
}

// Linha do tempo: uma linha com um pontinho por ano, do mais antigo (esquerda)
// ao mais recente (direita). Só o ano escolhido mostra o número; os outros
// aparecem ao passar o mouse. O tamanho do ponto acompanha quantos sonhos há.
// Os meses (barras) só aparecem com comMeses, como no calendário.
export function LinhaDoTempo({ contagem, ano, mes, aoEscolher, comTodos = false, comMeses = false, mesObrigatorio = false, semTotal = false }) {
  const anos = Object.keys(contagem).map(Number).sort((a, b) => a - b);
  const trilho = useRef(null);
  useEffect(() => {
    // Centraliza o ano escolhido só na faixa dos anos, sem rolar a página.
    const caixa = trilho.current;
    const el = caixa?.querySelector('[aria-current="true"]');
    if (el) caixa.scrollLeft = el.offsetLeft - caixa.offsetLeft - (caixa.clientWidth - el.clientWidth) / 2;
  }, [ano]);
  if (!anos.length) return null;
  const doAno = ano !== 'todos' && contagem[ano];
  const maior = doAno ? Math.max(1, ...doAno.meses) : 1;
  const maiorAno = Math.max(1, ...anos.map((a) => contagem[a].total));
  const hoje = new Date();
  const total = Object.values(contagem).reduce((n, x) => n + x.total, 0);
  return (
    <nav className="linha-tempo" aria-label="Linha do tempo">
      {comTodos && <button type="button" className={'lt-todos' + (ano === 'todos' ? ' ativo' : '')} aria-current={ano === 'todos'} onClick={() => aoEscolher('todos', 0)}
        title={total + ' sonhos'}>todos</button>}
      <div className="lt-anos" ref={trilho}>
        <div className="lt-pontos">
          {anos.map((a) => {
            const n = contagem[a].total;
            const tam = 6 + Math.round((n / maiorAno) * 4);
            return (
              <button key={a} type="button" className={'lt-ponto' + (a === ano ? ' ativo' : '')} aria-current={a === ano} onClick={() => aoEscolher(a, 0)}
                aria-label={a + ', ' + (n === 1 ? '1 sonho' : n + ' sonhos')} title={a + ' · ' + (n === 1 ? '1 sonho' : n + ' sonhos')}>
                <i style={{ width: tam, height: tam }} />
                <span className="lt-ponto-ano">{a}</span>
              </button>
            );
          })}
        </div>
      </div>
      {comMeses && doAno && (
        <div className="lt-meses" role="group" aria-label={'Meses de ' + ano}>
          {doAno.meses.map((n, i) => {
            const futuro = ano === hoje.getFullYear() && i > hoje.getMonth();
            if (futuro && !n) return null;
            return (
              <button key={i} type="button" className={'lt-mes' + (mes === i + 1 ? ' ativo' : '')} aria-pressed={mes === i + 1}
                disabled={!n && !mesObrigatorio}
                title={MESES_LONGOS[i] + ': ' + (n === 1 ? '1 sonho' : n + ' sonhos')}
                aria-label={MESES_LONGOS[i] + ' de ' + ano + ', ' + (n === 1 ? '1 sonho' : n + ' sonhos')}
                onClick={() => aoEscolher(ano, mes === i + 1 && !mesObrigatorio ? 0 : i + 1)}>
                <span className="lt-barra"><i style={{ height: n ? Math.max(18, (n / maior) * 100) + '%' : 0 }} /></span>
                <span className="lt-rotulo">{MESES[i]}</span>
              </button>
            );
          })}
        </div>
      )}
      {!semTotal && <span className="lt-total">{ano === 'todos' ? '' : (mes ? doAno.meses[mes - 1] : doAno?.total || 0) + ((mes ? doAno.meses[mes - 1] : doAno?.total) === 1 ? ' sonho' : ' sonhos')}</span>}
    </nav>
  );
}

// Calendário de um mês. Cada dia mostra os títulos (no celular, pontinhos);
// tocar num dia mostra os sonhos dele embaixo.
export function Calendario({ sonhos, ano, mes, aoMudarMes, renderSonhos }) {
  const [dia, setDia] = useState(null);
  const discreto = useDiscreto();
  useEffect(() => { setDia(null); }, [ano, mes]);
  const porDia = useMemo(() => {
    const m = new Map();
    for (const s of sonhos) {
      const d = new Date(s.sonhado_em);
      if (d.getFullYear() !== ano || d.getMonth() + 1 !== mes) continue;
      const k = chaveDia(d);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(s);
    }
    for (const l of m.values()) l.sort((a, b) => a.sonhado_em.localeCompare(b.sonhado_em));
    return m;
  }, [sonhos, ano, mes]);

  const primeiro = new Date(ano, mes - 1, 1);
  const nDias = new Date(ano, mes, 0).getDate();
  const celulas = [...Array(primeiro.getDay()).fill(null), ...Array.from({ length: nDias }, (_, i) => new Date(ano, mes - 1, i + 1))];
  while (celulas.length % 7) celulas.push(null);
  const hojeK = chaveDia(new Date());
  const noMes = [...porDia.values()].reduce((n, l) => n + l.length, 0);
  const diasComSonho = porDia.size;
  const passo = (d) => { const x = new Date(ano, mes - 1 + d, 1); aoMudarMes(x.getFullYear(), x.getMonth() + 1); };
  const escolhidos = dia ? porDia.get(dia) || [] : [];
  const dataDia = dia && (() => { const [a, m, d] = dia.split('-').map(Number); return new Date(a, m - 1, d); })();

  return (
    <section aria-label="Calendário" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn-icone" onClick={() => passo(-1)} aria-label="Mês anterior"><Voltar size={18} /></button>
        <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.03em', minWidth: 200, textAlign: 'center' }}>{MESES_LONGOS[mes - 1]} de {ano}</h2>
        <button type="button" className="btn-icone" onClick={() => passo(1)} aria-label="Próximo mês"><Avancar size={18} /></button>
        <button type="button" className="btn btn-linha" style={{ minHeight: 36 }} onClick={() => { const h = new Date(); aoMudarMes(h.getFullYear(), h.getMonth() + 1); }}>Hoje</button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)' }}>
          {noMes ? `${noMes === 1 ? '1 sonho' : noMes + ' sonhos'} em ${diasComSonho === 1 ? '1 noite' : diasComSonho + ' noites'}` : 'Nenhum sonho neste mês'}
        </span>
      </div>

      <div className="cal" role="grid" aria-label={MESES_LONGOS[mes - 1] + ' de ' + ano}>
        <div role="row" className="cal-semana">{SEMANA.map((d) => <span key={d} role="columnheader">{d}</span>)}</div>
        {Array.from({ length: celulas.length / 7 }, (_, w) => (
          <div role="row" key={w} className="cal-linha">
            {celulas.slice(w * 7, w * 7 + 7).map((d, i) => {
              if (!d) return <span key={i} role="gridcell" className="cal-dia vazio" />;
              const k = chaveDia(d);
              const lista = porDia.get(k) || [];
              const rotulo = d.getDate() + ' de ' + MESES_LONGOS[mes - 1] + (lista.length ? ', ' + (lista.length === 1 ? '1 sonho' : lista.length + ' sonhos') : '');
              return (
                <div key={i} role="gridcell" className={'cal-dia' + (lista.length ? ' tem' : '') + (k === hojeK ? ' hoje' : '') + (k === dia ? ' ativo' : '')}
                  onClick={() => lista.length && setDia(k === dia ? null : k)} aria-label={rotulo}>
                  <span className="cal-num">{d.getDate()}</span>
                  {lista.length > 0 && <>
                    <span className="cal-titulos">
                      {lista.slice(0, 3).map((s) => (
                        <Link key={s.id} to={'/app/sonho/' + s.id} onClick={(e) => e.stopPropagation()} className="cal-sonho" style={{ background: (CORES[s.cor] || CORES.branco).fundo }} title={discreto ? undefined : nomeCurto(s)}>{nomeCurto(s)}</Link>
                      ))}
                      {lista.length > 3 && <span className="cal-mais">+{lista.length - 3}</span>}
                    </span>
                    <span className="cal-pontos" aria-hidden="true">{lista.slice(0, 4).map((s) => <i key={s.id} />)}</span>
                  </>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="so-celular" style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{semViuvas('Toque num dia marcado para ver os sonhos daquela noite.')}</p>

      {dia && escolhidos.length > 0 && (
        <section aria-label="Sonhos do dia" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="rotulo">{DIAS[dataDia.getDay()]}, {dataDia.getDate()} de {MESES_LONGOS[dataDia.getMonth()]}</h3>
          {renderSonhos(escolhidos)}
        </section>
      )}
    </section>
  );
}
