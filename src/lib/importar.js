// Importação de sonhos que a pessoa já tem: Notion (CSV), Google Keep (Takeout, JSON) e texto/Markdown.
import { unzipSync, strFromU8 } from 'fflate';
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
  // Como o Notion em português escreve: "28 de outubro de 2024 21:04"
  m = t.toLowerCase().match(/^(\d{1,2}) de ([a-zç]+)\.? de (\d{4})/);
  if (m) {
    const mes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(m[2].slice(0, 3));
    if (mes >= 0) return new Date(+m[3], mes, +m[1], 7).toISOString();
  }
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

// Página do Notion exportada em Markdown: "# Título", depois as propriedades
// ("Data : 30/09/2026", "Temas: A, B") e, por fim, o relato do sonho.
const PROPS = { data: 'data', date: 'data', status: 'status', temas: 'temas', tags: 'temas', tema: 'temas', 'observações': 'obs', observacoes: 'obs', notas: 'obs', 'adicionado em': 'criado', 'created time': 'criado', 'criado em': 'criado' };
const SEM_TITULO = ['untitled', 'sem título', 'sem titulo', 'new page', 'nova página'];

// Links internos do Notion ("[texto](Pagina%20abc.md)") viram só o texto.
const semLinks = (t) => t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

// Separa as linhas da página. Se o cabeçalho chegou numa linha só
// ("# Sem título Data : 02/02/2023 Adicionado em: …"), quebra antes de cada propriedade.
const CHAVES_RE = new RegExp('\\s+(' + Object.keys(PROPS).join('|') + ')\\s*:', 'gi');
function linhasDaPagina(texto) {
  const linhas = texto.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const i = linhas.findIndex((l) => l.trim());
  if (i >= 0 && /^#\s+/.test(linhas[i])) linhas.splice(i, 1, ...linhas[i].replace(CHAVES_RE, '\n$1:').split('\n'));
  return linhas;
}

// Devolve o sonho; null se não for uma página da tabela de sonhos;
// false se for uma página da tabela, mas sem título nem relato (não há o que trazer).
export function deNotionPagina(texto) {
  const linhas = linhasDaPagina(texto);
  let i = 0;
  while (i < linhas.length && !linhas[i].trim()) i++;
  let titulo = '';
  if (/^#\s+/.test(linhas[i] || '')) { titulo = linhas[i].replace(/^#\s+/, '').trim(); i++; }
  const props = {};
  let fimProps = i;
  for (; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue; // o Notion às vezes deixa linha em branco entre as propriedades
    const m = linhas[i].match(/^([^:]{1,40}?)\s*:\s?(.*)$/);
    const chave = m && PROPS[m[1].trim().toLowerCase()];
    if (!chave) break;
    props[chave] = m[2].trim();
    fimProps = i + 1;
  }
  if (!Object.keys(props).length) return null; // não é uma página da tabela de sonhos
  const corpo = semLinks(linhas.slice(fimProps).join('\n')).trim();
  if (SEM_TITULO.includes(titulo.toLowerCase())) titulo = '';
  const sonhado = lerData(props.data) || lerData(props.criado) || new Date().toISOString();
  const obs = props.obs || '';
  const s = novoSonho({
    titulo: semLinks(titulo),
    texto: corpo,
    sonhado_em: sonhado,
    criado_em: sonhado,
    temas: semLinks(props.temas || '').split(',').map((t) => t.trim()).filter(Boolean),
    status: STATUS_NOTION[(props.status || '').toLowerCase()] || 'nao_aberto',
    conclusoes: obs ? [{ id: 'imp-' + Math.random().toString(16).slice(2), em: sonhado, origem: 'sozinho', texto: semLinks(obs) }] : [],
  });
  return s.titulo || s.texto || s.conclusoes.length ? s : false;
}

// Sonhos que entraram com o cabeçalho do Notion grudado no relato
// ("# Sem título", "Data : …", "Adicionado em: …"). Devolve a versão arrumada
// de cada um, com o mesmo id, ou nada se não houver o que arrumar.
export function arrumarDoNotion(acervo) {
  const arrumados = [];
  for (const s of acervo) {
    if (!/^\s*#\s/.test(s.texto || '')) continue;
    const p = deNotionPagina(s.texto);
    if (p === null) continue;
    arrumados.push({
      ...s,
      titulo: s.titulo?.trim() && !SEM_TITULO.includes(s.titulo.trim().toLowerCase()) ? s.titulo : p ? p.titulo : '',
      texto: p ? p.texto : '',
      sonhado_em: p ? p.sonhado_em : lerData(s.texto.match(/Data\s*:\s*([^\n]+)/i)?.[1]) || s.sonhado_em,
      criado_em: p ? p.criado_em : s.criado_em,
      temas: [...new Set([...(s.temas || []), ...(p ? p.temas : [])])],
      conclusoes: (s.conclusoes || []).length ? s.conclusoes : p ? p.conclusoes : [],
    });
  }
  return arrumados;
}

// Abre o .zip do Notion (que às vezes vem com outro .zip dentro).
function abrirZip(bytes, saida = []) {
  const arquivos = unzipSync(bytes);
  for (const [nome, dados] of Object.entries(arquivos)) {
    const n = nome.toLowerCase();
    if (n.endsWith('.zip')) abrirZip(dados, saida);
    else if (n.endsWith('.md') || n.endsWith('.csv') || n.endsWith('.json') || n.endsWith('.txt')) saida.push({ name: nome, doZip: true, text: async () => strFromU8(dados) });
  }
  return saida;
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

export async function lerArquivos(entrada) {
  const arquivos = [];
  for (const f of entrada) {
    if (f.name.toLowerCase().endsWith('.zip')) arquivos.push(...abrirZip(new Uint8Array(await f.arrayBuffer())));
    else arquivos.push(f);
  }
  const sonhos = [];
  const doCSV = [];
  const paginas = [];
  const marcadores = new Set();
  const keep = [];
  for (const f of arquivos) {
    const txt = await f.text();
    const n = f.name.toLowerCase();
    const pagina = n.endsWith('.md') ? deNotionPagina(txt) : null;
    if (n.endsWith('.csv')) doCSV.push(...deNotionCSV(txt));
    else if (pagina) paginas.push(pagina);
    else if (pagina === false) continue; // página do Notion sem título nem relato
    else if (f.name.toLowerCase().endsWith('.json')) {
      try {
        const o = JSON.parse(txt);
        (o.labels || []).forEach((l) => marcadores.add(l.name));
        keep.push(o);
      } catch { /* não é uma nota do Keep */ }
    } else if (!f.doZip) sonhos.push(...deTexto(txt)); // outras páginas do export do Notion ficam de fora
  }
  // As páginas trazem o relato; o CSV só tem título e propriedades.
  // Se vieram páginas, o CSV do mesmo export é dispensado.
  const vistos = new Set();
  const unicos = doCSV.filter((x) => { const k = x.titulo + '|' + x.sonhado_em + '|' + x.temas.join(); return !vistos.has(k) && vistos.add(k); });
  sonhos.push(...(paginas.length ? paginas : unicos));
  return { sonhos, keep, marcadores: [...marcadores].sort(), soCSV: !paginas.length && doCSV.length > 0 };
}

// Compara o que vai entrar com o acervo, sem duplicar.
// - Mesmo dia, mesmo título e mesmo começo de relato: já está lá, pula.
// - Mesmo dia e título, e o do acervo está sem relato (ex.: veio só da tabela): completa esse.
// Cada sonho do acervo só é usado uma vez, então vários "Sem título" no mesmo dia não se misturam.
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const SEM = new Set(['', 'sem titulo', 'untitled']);
const tituloNorm = (s) => (SEM.has(norm(s.titulo)) ? '' : norm(s.titulo));
const dia = (s) => (s.sonhado_em || '').slice(0, 10);
const comeco = (s) => norm(s.texto).slice(0, 80);

export function combinarComAcervo(entrando, acervo, pularRepetidos = true) {
  const porChave = new Map();
  for (const e of acervo) {
    const k = dia(e) + '|' + tituloNorm(e);
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push(e);
  }
  const usados = new Set();
  const novos = [];
  const completar = [];
  for (const s of entrando) {
    const candidatos = porChave.get(dia(s) + '|' + tituloNorm(s)) || [];
    const igual = comeco(s) && candidatos.find((e) => comeco(e) === comeco(s));
    if (igual) { usados.add(igual.id); if (!pularRepetidos) novos.push(s); continue; }
    if (comeco(s)) {
      const vazio = candidatos.find((e) => !usados.has(e.id) && !comeco(e));
      if (vazio) {
        usados.add(vazio.id);
        completar.push({ ...vazio, texto: s.texto, temas: [...new Set([...(vazio.temas || []), ...(s.temas || [])])] });
        continue;
      }
    } else if (candidatos.length && pularRepetidos) continue;
    novos.push(s);
  }
  return { novos, completar };
}

// Sonho sem nada dentro: sem título, relato, áudio, temas nem amplificações.
export const ehVazio = (s) => !s.titulo?.trim() && !s.texto?.trim() && !s.audio && !(s.temas || []).length && !(s.conclusoes || []).length;
