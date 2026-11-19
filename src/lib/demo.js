// Modo demonstração: o link /demo abre o app com um acervo inventado (veja demoDados.js),
// para a pessoa conhecer tudo sem conta. Fica ligado só nesta aba (sessionStorage), e o
// "banco" é uma imitação do Supabase na memória: nada é salvo nem enviado, e recarregar
// a página volta tudo ao começo. A conta de verdade de quem abre o link não é tocada.
import { EU, dadosIniciais, urlDesenho } from './demoDados.js';

const FLAG = 'sonhario:demo';

export const DEMO = (() => {
  try {
    if (/^\/demo\/?$/.test(location.pathname)) { sessionStorage.setItem(FLAG, '1'); return true; }
    return sessionStorage.getItem(FLAG) === '1';
  } catch { return false; }
})();

// Sai da demonstração (para a home, ou para o app de verdade).
export function sairDaDemo(destino = '/') {
  try { sessionStorage.removeItem(FLAG); } catch { /* sem armazenamento */ }
  location.href = destino;
  return new Promise(() => {}); // a página vai recarregar; nada mais deve rodar
}

/* ---------- o banco na memória ---------- */
const db = DEMO ? { ...dadosIniciais(), convites: [], lembretes: [] } : null;
const arquivos = new Map(); // caminho -> Blob (áudios e imagens novos)

const copia = (x) => JSON.parse(JSON.stringify(x));
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + Math.random().toString(16).slice(2));
const semTabela = (t) => ({ code: 'PGRST205', message: `Could not find the table 'public.${t}' in the schema cache` });

// Cada tabela, com a regra de quem vê o quê (como o RLS do banco de verdade).
function tabela(nome) {
  switch (nome) {
    case 'sonhos': return { linhas: db.sonhos, visivel: (r) => r.user_id === EU.id, chave: 'id' };
    case 'compartilhamentos': return { linhas: db.compartilhamentos, visivel: () => true, chave: 'id' };
    case 'comentarios': return { linhas: db.comentarios, visivel: (r) => r.autor_id === EU.id || !r.privado, chave: 'id' };
    case 'perfis': return { linhas: [], visivel: () => true, chave: 'id' };
    case 'convites': return { linhas: db.convites, visivel: () => true, chave: 'token' };
    case 'lembretes': return { linhas: db.lembretes, visivel: () => true, chave: 'endpoint' };
    case 'chaves_sonhos': return { linhas: [], visivel: () => true, chave: 'sonho_id' };
    default: return null; // "chaves": sem criptografia na demonstração
  }
}

// O que o banco preenche sozinho ao criar uma linha.
function preencher(nome, r) {
  const agora = new Date().toISOString();
  if (nome === 'sonhos') return { user_id: EU.id, compartilhado_com: [], imagens: [], apagado_em: null, favorito: false, ...r };
  if (nome === 'compartilhamentos') return { id: novoId(), dono_id: EU.id, escopo: 'escolhidos', pendente: false, sonhos_pedidos: [], eh_terapeuta: false, criado_em: agora, ...r };
  if (nome === 'convites') return { dono_id: EU.id, criado_em: agora, ...r };
  if (nome === 'comentarios') {
    const sonho = db.sonhos.find((s) => s.id === r.sonho_id) || db.daMarina.find((s) => s.id === r.sonho_id);
    const dono_id = sonho?.user_id || EU.id;
    return {
      id: novoId(), ...r, dono_id, autor_id: EU.id, autor_nome: EU.nome, autor_foto: '',
      leitor_email: dono_id === EU.id ? r.leitor_email : EU.email,
      privado: dono_id === EU.id ? false : !!r.privado, visto: false, criado_em: agora, editado_em: null,
    };
  }
  return r;
}

class Consulta {
  constructor(nome) { this.nome = nome; this.op = 'select'; this.filtros = []; this.ordem = []; this.devolver = false; }
  select() { if (this.op !== 'select') this.devolver = true; return this; }
  insert(v) { this.op = 'insert'; this.valor = v; return this; }
  upsert(v) { this.op = 'upsert'; this.valor = v; return this; }
  update(v) { this.op = 'update'; this.valor = v; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filtros.push((r) => r[c] === v); return this; }
  in(c, vs) { this.filtros.push((r) => vs.includes(r[c])); return this; }
  order(c, { ascending = true } = {}) { this.ordem.push([c, ascending]); return this; }
  range(a, b) { this.faixa = [a, b]; return this; }
  limit(n) { this.faixa = [0, n - 1]; return this; }
  single() { this.um = 'single'; return this; }
  maybeSingle() { this.um = 'maybe'; return this; }
  then(ok, erro) { return Promise.resolve().then(() => this.rodar()).then(ok, erro); }

  rodar() {
    const t = tabela(this.nome);
    if (!t) return { data: null, error: semTabela(this.nome) };
    const passa = (r) => t.visivel(r) && this.filtros.every((f) => f(r));
    let saida = [];
    if (this.op === 'select') {
      saida = t.linhas.filter(passa);
      for (const [c, asc] of [...this.ordem].reverse()) {
        saida = [...saida].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1));
      }
      if (this.faixa) saida = saida.slice(this.faixa[0], this.faixa[1] + 1);
    } else if (this.op === 'insert' || this.op === 'upsert') {
      for (const v of [].concat(this.valor)) {
        const i = this.op === 'upsert' ? t.linhas.findIndex((r) => r[t.chave] === v[t.chave]) : -1;
        if (i >= 0) { t.linhas[i] = { ...t.linhas[i], ...copia(v) }; saida.push(t.linhas[i]); }
        else {
          if (this.nome === 'compartilhamentos' && t.linhas.some((r) => r.dono_id === EU.id && r.convidado_email === v.convidado_email)) {
            return { data: null, error: { code: '23505', message: 'duplicate key' } };
          }
          const nova = preencher(this.nome, copia(v));
          t.linhas.push(nova); saida.push(nova);
        }
      }
    } else if (this.op === 'update') {
      for (const r of t.linhas.filter(passa)) {
        Object.assign(r, copia(this.valor));
        if (this.nome === 'comentarios' && 'texto' in this.valor) { r.editado_em = new Date().toISOString(); r.visto = false; }
        saida.push(r);
      }
    } else if (this.op === 'delete') {
      const fora = new Set(t.linhas.filter(passa));
      saida = [...fora];
      t.linhas.splice(0, t.linhas.length, ...t.linhas.filter((r) => !fora.has(r)));
      if (this.nome === 'sonhos') db.comentarios = db.comentarios.filter((c) => !saida.some((s) => s.id === c.sonho_id));
    }
    const data = copia(saida);
    if (this.um === 'single') return data.length ? { data: data[0], error: null } : { data: null, error: { message: 'Nada encontrado.' } };
    if (this.um === 'maybe') return { data: data[0] || null, error: null };
    return { data: this.op === 'select' || this.devolver ? data : null, error: null };
  }
}

/* ---------- funções do banco (rpc) ---------- */
const meusConvidados = () => db.compartilhamentos.filter((c) => c.dono_id === EU.id);
const rpcs = {
  perfis_conectados: () => db.perfis,
  perfil_por_email: ({ procurado }) => db.perfis.filter((p) => p.email === String(procurado).trim().toLowerCase()).slice(0, 1),
  sonhos_compartilhados: ({ dono }) => {
    const c = db.compartilhamentos.find((x) => x.dono_id === dono && x.convidado_email === EU.email && !x.pendente);
    if (!c) return [];
    return db.daMarina.filter((s) => s.user_id === dono && s.compartilhado_com.includes(EU.email) && !s.apagado_em)
      .map((s) => ({ ...s, conclusoes: c.ver_amplificacoes ? s.conclusoes : [] }))
      .sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em));
  },
  ver_comentarios: ({ sonho }) => {
    for (const c of db.comentarios) if (c.sonho_id === sonho && !c.privado && c.autor_id !== EU.id) c.visto = true;
    return null;
  },
  aprovar_pedido: ({ pedido }) => {
    const c = meusConvidados().find((x) => x.id === pedido);
    if (!c) throw new Error('Pedido não encontrado.');
    for (const s of db.sonhos) if (c.sonhos_pedidos.includes(s.id) && !s.compartilhado_com.includes(c.convidado_email)) s.compartilhado_com.push(c.convidado_email);
    c.pendente = false; c.sonhos_pedidos = [];
    return null;
  },
  chaves_faltando: () => [],
  chaves_publicas: () => [],
  ver_convite: ({ chave }) => db.convites.filter((c) => c.token === chave).map(() => ({ dono_nome: EU.nome, dono_foto: '', de_um_sonho: true })),
  ver_trecho_convite: () => [],
  ver_previa_convite: () => null,
  aceitar_convite: () => { throw new Error('Esse link é seu. Na demonstração, os links não vão para ninguém.'); },
};

async function rpc(nome, args = {}) {
  try { return { data: copia(rpcs[nome] ? rpcs[nome](args) ?? null : null), error: null }; }
  catch (e) { return { data: null, error: { message: e.message } }; }
}

/* ---------- arquivos ---------- */
function balde() {
  return {
    async upload(caminho, blob) { arquivos.set(caminho, blob); return { data: { path: caminho }, error: null }; },
    async createSignedUrl(ref) {
      const blob = arquivos.get(ref);
      const url = blob ? URL.createObjectURL(blob) : urlDesenho(ref);
      return url ? { data: { signedUrl: url }, error: null } : { data: null, error: { message: 'Arquivo não encontrado.' } };
    },
    async download(ref) { const b = arquivos.get(ref); return b ? { data: b, error: null } : { data: null, error: { message: 'Arquivo não encontrado.' } }; },
    async remove(refs) { for (const r of refs) arquivos.delete(r); return { data: null, error: null }; },
    async list() { return { data: [], error: null }; },
  };
}

/* ---------- o cliente ---------- */
const usuario = {
  id: EU.id, email: EU.email, aud: 'authenticated',
  user_metadata: { full_name: EU.nome, name: EU.nome },
};

export const clienteDemo = DEMO ? {
  from: (nome) => new Consulta(nome),
  rpc,
  storage: { from: balde },
  functions: { invoke: async () => ({ data: null, error: new Error('Na demonstração, isso fica desligado.') }) },
  auth: {
    getSession: async () => ({ data: { session: { user: usuario, access_token: 'demo' } } }),
    getUser: async () => ({ data: { user: usuario } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => sairDaDemo('/'),
    signInWithOAuth: () => sairDaDemo('/app'),
    signInWithIdToken: () => sairDaDemo('/app'),
  },
} : null;
