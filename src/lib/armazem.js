// Onde os sonhos moram.
// Sem conta: no próprio aparelho (localStorage para os textos, IndexedDB para os áudios).
// Com conta: no Supabase (tabela "sonhos" + buckets "audios" e "imagens"), protegido por RLS.
// Imagens: sem conta, no IndexedDB (mesma gaveta dos áudios, com a chave "img:…");
// com conta, no bucket "imagens", em user_id/sonho_id/imagem_id.ext.
import { supabase, AUDIO_BUCKET, IMAGEM_BUCKET } from './supabase.js';
import { novoId } from './sonhos.js';
import { extensaoDe, urlEmCache, esquecerUrl } from './imagens.js';

const CHAVE = 'sonhario:sonhos';
const CAMPOS = ['id', 'sonhado_em', 'criado_em', 'atualizado_em', 'titulo', 'texto', 'temas', 'status', 'cor', 'conclusoes', 'levar_sessao', 'audio'];

/* ---------- áudio local (IndexedDB) ---------- */
function abrirDB() {
  return new Promise((ok, erro) => {
    const req = indexedDB.open('sonhario', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('audios');
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });
}
async function idb(modo, fn) {
  const db = await abrirDB();
  return new Promise((ok, erro) => {
    const tx = db.transaction('audios', modo);
    const req = fn(tx.objectStore('audios'));
    tx.oncomplete = () => ok(req && req.result);
    tx.onerror = () => erro(tx.error);
  });
}
const refsImagens = (lista) => lista.flatMap((s) => (s.imagens || []).map((i) => i.ref)).filter(Boolean);

const audioLocal = {
  salvar: (id, blob) => idb('readwrite', (s) => s.put(blob, id)),
  ler: (id) => idb('readonly', (s) => s.get(id)),
  apagar: (id) => idb('readwrite', (s) => s.delete(id)),
};

/* ---------- modo sem conta ---------- */
export const local = {
  listar() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
  },
  gravarTodos(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  },
  async salvar(sonho) {
    const lista = local.listar().filter((s) => s.id !== sonho.id);
    lista.unshift(sonho);
    lista.sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em));
    local.gravarTodos(lista);
    return sonho;
  },
  async apagar(id) {
    const s = local.listar().find((x) => x.id === id);
    local.gravarTodos(local.listar().filter((x) => x.id !== id));
    if (s?.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
    for (const ref of refsImagens(s ? [s] : [])) await audioLocal.apagar(ref).catch(() => {});
  },
  async salvarVarios(sonhos) {
    const ids = new Set(sonhos.map((s) => s.id));
    const lista = [...sonhos, ...local.listar().filter((s) => !ids.has(s.id))];
    lista.sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em));
    local.gravarTodos(lista);
  },
  async apagarVarios(lista) {
    const ids = new Set(lista.map((s) => s.id));
    local.gravarTodos(local.listar().filter((x) => !ids.has(x.id)));
    for (const s of lista) if (s.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
    for (const ref of refsImagens(lista)) await audioLocal.apagar(ref).catch(() => {});
  },
  async apagarTodos() {
    for (const s of local.listar()) if (s.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
    for (const ref of refsImagens(local.listar())) await audioLocal.apagar(ref).catch(() => {});
    local.gravarTodos([]);
  },
  async salvarAudio(id, blob) {
    await audioLocal.salvar(id, blob);
    return id;
  },
  async urlAudio(ref) {
    const blob = await audioLocal.ler(ref);
    return blob ? URL.createObjectURL(blob) : null;
  },
  async salvarImagem(sonhoId, blob) {
    const ref = `img:${sonhoId}/${novoId()}.${extensaoDe(blob)}`;
    await audioLocal.salvar(ref, blob);
    return ref;
  },
  urlImagem: (ref) => urlEmCache(ref, async (r) => { const b = await audioLocal.ler(r); return b ? URL.createObjectURL(b) : null; }),
  async apagarImagens(refs) {
    for (const ref of refs) { esquecerUrl(ref); await audioLocal.apagar(ref).catch(() => {}); }
  },
};

/* ---------- modo com conta ---------- */
function linha(s, userId) {
  const o = { user_id: userId };
  for (const c of CAMPOS) o[c] = s[c];
  // Só vai junto quando o banco já tem a coluna (veio na leitura); assim nada quebra antes da migração.
  if (Array.isArray(s.compartilhado_com)) o.compartilhado_com = s.compartilhado_com;
  if (Array.isArray(s.imagens)) o.imagens = s.imagens;
  return o;
}
export function remoto(userId) {
  return {
    async listar() {
      const { data, error } = await supabase.from('sonhos').select('*').order('sonhado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
    async salvar(sonho) {
      const { error } = await supabase.from('sonhos').upsert(linha(sonho, userId));
      if (error) throw error;
      return sonho;
    },
    async apagar(id, sonho) {
      if (sonho?.audio?.ref) await supabase.storage.from(AUDIO_BUCKET).remove([sonho.audio.ref]);
      if (sonho?.imagens?.length) await supabase.storage.from(IMAGEM_BUCKET).remove(refsImagens([sonho]));
      const { error } = await supabase.from('sonhos').delete().eq('id', id);
      if (error) throw error;
    },
    async salvarVarios(sonhos) {
      for (let i = 0; i < sonhos.length; i += 200) {
        const { error } = await supabase.from('sonhos').upsert(sonhos.slice(i, i + 200).map((s) => linha(s, userId)));
        if (error) throw error;
      }
    },
    async apagarVarios(lista) {
      const audios = lista.filter((s) => s.audio?.ref).map((s) => s.audio.ref);
      if (audios.length) await supabase.storage.from(AUDIO_BUCKET).remove(audios);
      const imagens = refsImagens(lista);
      for (let i = 0; i < imagens.length; i += 500) await supabase.storage.from(IMAGEM_BUCKET).remove(imagens.slice(i, i + 500));
      for (let i = 0; i < lista.length; i += 200) {
        const { error } = await supabase.from('sonhos').delete().in('id', lista.slice(i, i + 200).map((s) => s.id));
        if (error) throw error;
      }
    },
    async apagarTodos() {
      const { data: arquivos } = await supabase.storage.from(AUDIO_BUCKET).list(userId, { limit: 1000 });
      if (arquivos?.length) await supabase.storage.from(AUDIO_BUCKET).remove(arquivos.map((a) => `${userId}/${a.name}`));
      const { data: comImagens } = await supabase.from('sonhos').select('imagens').eq('user_id', userId);
      const imagens = refsImagens(comImagens || []);
      for (let i = 0; i < imagens.length; i += 500) await supabase.storage.from(IMAGEM_BUCKET).remove(imagens.slice(i, i + 500));
      const { error } = await supabase.from('sonhos').delete().eq('user_id', userId);
      if (error) throw error;
    },
    async salvarAudio(id, blob) {
      const ext = (blob.type.includes('mp4') && 'm4a') || (blob.type.includes('ogg') && 'ogg') || 'webm';
      const caminho = `${userId}/${id}.${ext}`;
      const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(caminho, blob, { upsert: true, contentType: blob.type || 'audio/webm' });
      if (error) throw error;
      return caminho;
    },
    async urlAudio(ref) {
      const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
    async salvarImagem(sonhoId, blob) {
      const caminho = `${userId}/${sonhoId}/${novoId()}.${extensaoDe(blob)}`;
      const { error } = await supabase.storage.from(IMAGEM_BUCKET).upload(caminho, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' });
      if (error) throw new Error(/bucket not found/i.test(error.message) ? 'O espaço das imagens ainda não existe. Rode o bloco 8 do supabase/schema.sql.' : error.message);
      return caminho;
    },
    urlImagem: (ref) => urlImagemRemota(ref),
    async apagarImagens(refs) {
      refs.forEach(esquecerUrl);
      if (refs.length) await supabase.storage.from(IMAGEM_BUCKET).remove(refs);
    },
  };
}

// Também serve para as imagens de quem compartilhou comigo (o RLS decide quem vê).
export const urlImagemRemota = (ref) => urlEmCache(ref, async (r) => {
  const { data, error } = await supabase.storage.from(IMAGEM_BUCKET).createSignedUrl(r, 60 * 60);
  return error ? null : data.signedUrl;
});

// Leva os sonhos guardados no aparelho para a conta (igual ao "livros levados" do Torvilo).
export async function levarParaConta(userId) {
  const lista = local.listar();
  if (!lista.length) return 0;
  const r = remoto(userId);
  for (const s of lista) {
    const copia = { ...s };
    if (s.audio?.ref) {
      const blob = await audioLocal.ler(s.audio.ref).catch(() => null);
      copia.audio = blob ? { ...s.audio, ref: await r.salvarAudio(s.id, blob) } : null;
    }
    if (s.imagens?.length) {
      copia.imagens = [];
      for (const img of s.imagens) {
        const blob = await audioLocal.ler(img.ref).catch(() => null);
        if (blob) copia.imagens.push({ ...img, ref: await r.salvarImagem(s.id, blob) });
      }
    }
    await r.salvar(copia);
    if (s.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
    for (const ref of refsImagens([s])) await audioLocal.apagar(ref).catch(() => {});
  }
  local.gravarTodos([]);
  return lista.length;
}
