// Importação de sonhos que a pessoa já tem: Notion (CSV), Google Keep (Takeout, JSON) e texto/Markdown.
import { novoSonho } from './sonhos.js';

const CORES_KEEP = { DEFAULT: 'branco', YELLOW: 'amarelo', GREEN: 'verde', TEAL: 'azul', BLUE: 'azul', CERULEAN: 'azul', ORANGE: 'coral', RED: 'coral', PINK: 'coral', PURPLE: 'lilas', BROWN: 'areia', GRAY: 'areia' };

function parseCSV(texto) {
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((x) => x.trim()));
}

// Datas do Notion: "16/11/2026", "November 16, 2026", "2026-11-16".
function lerData(txt) {
  if (!txt) return null;
  const t = txt.trim();
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], 7).toISOString();
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], 7).toISOString();
  const d = new Date(t);
  return isNaN(d) ? null : d.toISOString();
}

const STATUS_NOTION = { 'não aberto': 'nao_aberto', 'nao aberto': 'nao_aberto', aberto: 'aberto', 'dar atenção': 'dar_atencao', 'dar atencao': 'dar_atencao' };

export function deNotionCSV(texto) {
  const [cab, ...linhas] = parseCSV(texto.replace(/^\uFEFF/, ''));
  const idx = (...nomes) => cab.findIndex((c) => nomes.includes(c.trim().toLowerCase()));
  const iNome = idx('name', 'nome', 'título', 'titulo');
  const iData = idx('data', 'date');
  const iTemas = idx('temas', 'tags', 'tema');
  const iStatus = idx('status');
  const iObs = idx('observações', 'observacoes', 'notas');
  const iCriado = idx('adicionado em', 'created time', 'criado em');
  return linhas.map((l) => {
    const sonhado = lerData(l[iData]) || lerData(l[iCriado]) || new Date().toISOString();
    const obs = iObs >= 0 ? (l[iObs] || '').trim() : '';
    return novoSonho({
      titulo: (l[iNome] || '').trim(),
      sonhado_em: sonhado,
      criado_em: sonhado,
      temas: iTemas >= 0 ? (l[iTemas] || '').split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: STATUS_NOTION[(l[iStatus] || '').trim().toLowerCase()] || 'nao_aberto',
      conclusoes: obs ? [{ id: 'imp-' + Math.random().toString(16).slice(2), em: sonhado, origem: 'sozinho', texto: obs }] : [],
    });
  }).filter((s) => s.titulo || s.conclusoes.length);
}

export function deKeepJSON(obj, marcadoresAceitos) {
  if (obj.isTrashed) return null;
  const temas = (obj.labels || []).map((l) => l.name);
  if (marcadoresAceitos?.length && !temas.some((t) => marcadoresAceitos.includes(t))) return null;
  const em = obj.userEditedTimestampUsec ? new Date(obj.userEditedTimestampUsec / 1000).toISOString() : new Date().toISOString();
  const criado = obj.createdTimestampUsec ? new Date(obj.createdTimestampUsec / 1000).toISOString() : em;
  const texto = obj.textContent || (obj.listContent || []).map((i) => '• ' + i.text).join('\n');
  if (!texto && !obj.title) return null;
  return novoSonho({ titulo: obj.title || '', texto, temas, sonhado_em: criado, criado_em: criado, atualizado_em: em, cor: CORES_KEEP[obj.color] || 'branco' });
}

// Texto ou Markdown: cada parágrafo que começa com uma data vira um sonho novo.
export function deTexto(texto) {
  const partes = texto.split(/\n(?=\s*(?:#+\s*)?\d{1,2}\/\d{1,2}\/\d{2,4}|\s*(?:#+\s*)?\d{4}-\d{2}-\d{2})/);
  return partes.map((p) => {
    const m = p.trim().match(/^(?:#+\s*)?(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\s*[-–—:]?\s*(.*)$/s);
    if (!m) return p.trim() ? novoSonho({ texto: p.trim() }) : null;
    let data = m[1];
    if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(data)) data = data.replace(/(\d{2})$/, '20$1');
    const iso = lerData(data) || new Date().toISOString();
    return novoSonho({ texto: m[2].trim(), sonhado_em: iso, criado_em: iso });
  }).filter(Boolean);
}

export async function lerArquivos(arquivos) {
  const sonhos = [];
  const marcadores = new Set();
  const keep = [];
  for (const f of arquivos) {
    const txt = await f.text();
    if (f.name.toLowerCase().endsWith('.csv')) sonhos.push(...deNotionCSV(txt));
    else if (f.name.toLowerCase().endsWith('.json')) {
      try {
        const o = JSON.parse(txt);
        (o.labels || []).forEach((l) => marcadores.add(l.name));
        keep.push(o);
      } catch { /* não é uma nota do Keep */ }
    } else sonhos.push(...deTexto(txt));
  }
  return { sonhos, keep, marcadores: [...marcadores].sort() };
}
