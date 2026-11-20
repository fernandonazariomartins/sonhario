import { tr, ingles, MESES_CURTOS, MESES_LONGOS, DIAS_SEMANA } from './i18n.js';
// Modelo do sonho e utilidades compartilhadas.

export const STATUS = {
  nao_aberto: { rotulo: tr("não aberto"), cor: '#B8C0C8' },
  aberto: { rotulo: tr('aberto'), cor: '#16A34A' },
  dar_atencao: { rotulo: tr("dar atenção"), cor: '#E8A100' },
};

// Paleta de notas (cores do Keep, herdadas do Torvilo).
export const CORES = {
  branco: { fundo: '#FFFFFF', rotulo: '#5B6570' },
  amarelo: { fundo: '#FFF8B8', rotulo: '#6B5E00' },
  verde: { fundo: '#E2F6D3', rotulo: '#4B5560' },
  azul: { fundo: '#D4E4ED', rotulo: '#234459' },
  coral: { fundo: '#F6E2DD', rotulo: '#5B4A46' },
  lilas: { fundo: '#EFE0F7', rotulo: '#4B2560' },
  areia: { fundo: '#E9E3D4', rotulo: '#4F4A3F' },
};

export function novoId() {
  return (crypto.randomUUID && crypto.randomUUID()) || 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

export function novoSonho(parcial = {}) {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    sonhado_em: agora,
    criado_em: agora,
    atualizado_em: agora,
    titulo: '',
    texto: '',
    temas: [],
    status: 'nao_aberto',
    cor: 'branco',
    conclusoes: [],
    levar_sessao: false,
    favorito: false,
    audio: null, // { ref, duracao }
    ...parcial,
  };
}

const MESES = MESES_CURTOS;
const DIAS = DIAS_SEMANA;

export function dataCurta(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return tr("hoje · ") + hora(iso);
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return tr('ontem');
  const ano = d.getFullYear() !== hoje.getFullYear() ? d.getFullYear() : '';
  if (ingles) return MESES[d.getMonth()] + ' ' + d.getDate() + (ano ? ', ' + ano : '');
  return d.getDate() + ' ' + MESES[d.getMonth()] + (ano ? ' ' + ano : '');
}

export function dataLonga(iso) {
  const d = new Date(iso);
  if (ingles) return DIAS[d.getDay()] + ', ' + MESES_LONGOS[d.getMonth()] + ' ' + d.getDate() + ' · ' + hora(iso);
  return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES_LONGOS[d.getMonth()] + ' · ' + hora(iso);
}

export function mesAno(iso) {
  const d = new Date(iso);
  const m = MESES_LONGOS[d.getMonth()];
  return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getFullYear();
}

export function hora(iso) {
  const d = new Date(iso);
  if (ingles) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function duracao(seg) {
  if (!seg && seg !== 0) return '';
  const s = Math.round(seg);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// Título sugerido: a primeira frase curta do relato.
export function tituloSugerido(texto) {
  const t = (texto || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const frase = t.split(/[.!?\n]/)[0];
  const palavras = frase.split(' ').slice(0, 7).join(' ');
  return palavras.charAt(0).toUpperCase() + palavras.slice(1) + (frase.split(' ').length > 7 ? '…' : '');
}

// O título nunca é preenchido sozinho: fica em branco até a pessoa dar um.
export function tituloDe(s) {
  return (s.titulo || '').trim() || tr("Sem título");
}

// Para o campo <input type="datetime-local"> (hora local do aparelho).
export function paraCampoData(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}
export function deCampoData(valor) {
  const d = new Date(valor);
  return isNaN(d) ? null : d.toISOString();
}

export function contarTemas(sonhos) {
  const mapa = new Map();
  for (const s of sonhos) for (const t of s.temas || []) mapa.set(t, (mapa.get(t) || 0) + 1);
  return [...mapa.entries()].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome));
}

// Lixeira: o sonho apagado fica lá por 7 dias e depois some de vez.
export const DIAS_LIXEIRA = 7;
export const PRAZO_LIXEIRA = DIAS_LIXEIRA * 24 * 60 * 60 * 1000;
export function diasRestantes(s) {
  const fim = new Date(s.apagado_em).getTime() + PRAZO_LIXEIRA;
  return Math.max(0, Math.ceil((fim - Date.now()) / (24 * 60 * 60 * 1000)));
}
