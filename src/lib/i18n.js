// Idiomas do Sonhário. O português é a base: cada texto do app é a própria chave,
// e src/lib/en.js traz a tradução em inglês. Sem tradução, aparece o português.
//
// Como o idioma é escolhido:
// 1. endereço começando por /en (ex.: /en, /en/demo) → inglês, e o /en sai do endereço;
//    /pt faz o mesmo para o português;
// 2. o que a pessoa escolheu antes (⋯ › Idioma, ou o link na home), guardado no aparelho;
// 3. o idioma do navegador: português se houver português na lista, senão inglês.
import en from './en.js';

const CHAVE = 'sonhario-idioma';
export const IDIOMAS = { pt: 'Português', en: 'English' };

function guardar(id) { try { localStorage.setItem(CHAVE, id); } catch { /* sem armazenamento */ } }

function escolher() {
  if (typeof window === 'undefined') return 'pt';
  const m = window.location.pathname.match(/^\/(en|pt)(\/.*)?$/);
  if (m) {
    guardar(m[1]);
    window.history.replaceState(null, '', (m[2] || '/') + window.location.search + window.location.hash);
    return m[1];
  }
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo && IDIOMAS[salvo]) return salvo;
  } catch { /* sem armazenamento */ }
  const lista = navigator.languages?.length ? navigator.languages : [navigator.language || 'pt'];
  return lista.some((l) => /^pt\b/i.test(l)) ? 'pt' : 'en';
}

export const idioma = escolher();
export const ingles = idioma === 'en';
/** Para datas e números: 'pt-BR' ou 'en-US'. */
export const locale = ingles ? 'en-US' : 'pt-BR';

if (typeof document !== 'undefined') document.documentElement.lang = locale;

/**
 * Traduz um texto. Partes variáveis vão como {0}, {1}… com os valores na lista:
 * tr('{0} sonhos', [n]).
 */
export function tr(texto, valores) {
  let s = texto;
  if (ingles) {
    const tem = (k) => Object.prototype.hasOwnProperty.call(en, k);
    // Alguns textos chegam com espaço inseparável (para evitar viúvas); a chave usa espaço comum.
    const k = tem(texto) ? texto : String(texto).replace(/\u00a0/g, ' ');
    if (tem(k)) s = en[k];
  }
  if (valores) s = s.replace(/\{(\d+)\}/g, (_, i) => (valores[i] ?? ''));
  return s;
}

/** Plural simples: plural(n, 'sonho', 'sonhos') → "1 sonho", "3 sonhos" (traduzido). */
export function contar(n, um, varios) {
  return n === 1 ? '1 ' + tr(um) : n + ' ' + tr(varios);
}

export function trocarIdioma(id) {
  if (!IDIOMAS[id] || id === idioma) return;
  guardar(id);
  window.location.reload();
}

// Datas -----------------------------------------------------------------------
const fmt = (opcoes) => new Intl.DateTimeFormat(locale, opcoes);
const MES_CURTO = fmt({ month: 'short' });
const MES_LONGO = fmt({ month: 'long' });
const DIA_SEMANA = fmt({ weekday: 'long' });
const base = (m) => new Date(2026, m, 15);
/** ['jan', 'fev', …] ou ['Jan', 'Feb', …] */
export const MESES_CURTOS = Array.from({ length: 12 }, (_, m) => MES_CURTO.format(base(m)).replace('.', ''));
/** ['janeiro', …] ou ['January', …] */
export const MESES_LONGOS = Array.from({ length: 12 }, (_, m) => MES_LONGO.format(base(m)));
/** ['domingo', 'segunda', …] ou ['Sunday', 'Monday', …] */
export const DIAS_SEMANA = Array.from({ length: 7 }, (_, d) => DIA_SEMANA.format(new Date(2026, 1, 1 + d)).replace(/-feira$/, ''));

/** "12 de março de 2026" / "March 12, 2026" (sem o ano, se for o ano atual e semAnoAtual) */
export function dataLonga(d, semAnoAtual) {
  d = new Date(d);
  const comAno = !(semAnoAtual && d.getFullYear() === new Date().getFullYear());
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', ...(comAno ? { year: 'numeric' } : {}) });
}
/** "março de 2026" / "March 2026" */
export function mesAno(mes0, ano) {
  return new Date(ano, mes0, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
/** "12 de março" / "March 12" */
export function diaMes(d) {
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}
/** "12 mar 2026" / "Mar 12, 2026" */
export function dataCurta(d) {
  d = new Date(d);
  return ingles ? MESES_CURTOS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : d.getDate() + ' ' + MESES_CURTOS[d.getMonth()] + ' ' + d.getFullYear();
}
