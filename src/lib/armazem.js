// Onde os sonhos moram.
// Sem conta: no próprio aparelho (localStorage para os textos, IndexedDB para os áudios).
// Com conta: no Supabase (tabela "sonhos" + bucket "audios"), protegido por RLS.
import { supabase, AUDIO_BUCKET } from './supabase.js';

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
  },
  async apagarTodos() {
    for (const s of local.listar()) if (s.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
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
};

/* ---------- modo com conta ---------- */
function linha(s, userId) {
  const o = { user_id: userId };
  for (const c of CAMPOS) o[c] = s[c];
  // Só vai junto quando o banco já tem a coluna (veio na leitura); assim nada quebra antes da migração.
  if (Array.isArray(s.compartilhado_com)) o.compartilhado_com = s.compartilhado_com;
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
      for (let i = 0; i < lista.length; i += 200) {
        const { error } = await supabase.from('sonhos').delete().in('id', lista.slice(i, i + 200).map((s) => s.id));
        if (error) throw error;
      }
    },
    async apagarTodos() {
      const { data: arquivos } = await supabase.storage.from(AUDIO_BUCKET).list(userId, { limit: 1000 });
      if (arquivos?.length) await supabase.storage.from(AUDIO_BUCKET).remove(arquivos.map((a) => `${userId}/${a.name}`));
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
  };
}

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
    await r.salvar(copia);
    if (s.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
  }
  local.gravarTodos([]);
  return lista.length;
}
