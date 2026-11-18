// Onde os sonhos moram.
// Sem conta: no próprio aparelho (localStorage para os textos, IndexedDB para os áudios e as imagens).
// Com conta: no Supabase (tabela "sonhos" + buckets "audios" e "imagens"), protegido por RLS.
import { supabase, AUDIO_BUCKET, IMAGEM_BUCKET } from './supabase.js';

const CHAVE = 'sonhario:sonhos';
const CAMPOS = ['id', 'sonhado_em', 'criado_em', 'atualizado_em', 'titulo', 'texto', 'temas', 'status', 'cor', 'conclusoes', 'levar_sessao', 'audio', 'favorito'];

/* ---------- áudios e imagens no aparelho (IndexedDB) ---------- */
function abrirDB() {
  return new Promise((ok, erro) => {
    const req = indexedDB.open('sonhario', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('audios')) db.createObjectStore('audios');
      if (!db.objectStoreNames.contains('imagens')) db.createObjectStore('imagens');
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });
}
async function idb(loja, modo, fn) {
  const db = await abrirDB();
  return new Promise((ok, erro) => {
    const tx = db.transaction(loja, modo);
    const req = fn(tx.objectStore(loja));
    tx.oncomplete = () => ok(req && req.result);
    tx.onerror = () => erro(tx.error);
  });
}
const blobsLocais = (loja) => ({
  salvar: (id, blob) => idb(loja, 'readwrite', (s) => s.put(blob, id)),
  ler: (id) => idb(loja, 'readonly', (s) => s.get(id)),
  apagar: (id) => idb(loja, 'readwrite', (s) => s.delete(id)),
});
const audioLocal = blobsLocais('audios');
const imagemLocal = blobsLocais('imagens');

// Tudo o que é arquivo de um sonho: o áudio e as imagens.
async function apagarArquivosLocais(s) {
  if (s?.audio?.ref) await audioLocal.apagar(s.audio.ref).catch(() => {});
  for (const im of s?.imagens || []) await imagemLocal.apagar(im.ref).catch(() => {});
}
const EXT_AUDIO = { 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/3gpp': '3gp', 'audio/amr': 'amr', 'audio/aac': 'aac', 'audio/flac': 'flac' };
const EXT_IMAGEM = { 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' };
const extAudio = (tipo = '') => EXT_AUDIO[tipo.split(';')[0]] || (tipo.includes('mp4') && 'm4a') || 'webm';
const extImagem = (tipo = '') => EXT_IMAGEM[tipo] || 'jpg';

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
    await apagarArquivosLocais(s);
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
    for (const s of lista) await apagarArquivosLocais(s);
  },
  async apagarTodos() {
    for (const s of local.listar()) await apagarArquivosLocais(s);
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
  async salvarImagem(id, blob) {
    await imagemLocal.salvar(id, blob);
    return id;
  },
  async urlImagem(ref) {
    const blob = await imagemLocal.ler(ref);
    return blob ? URL.createObjectURL(blob) : null;
  },
  apagarImagem: (ref) => imagemLocal.apagar(ref).catch(() => {}),
};

/* ---------- modo com conta ---------- */
function linha(s, userId) {
  const o = { user_id: userId };
  for (const c of CAMPOS) o[c] = s[c];
  // Só vai junto quando o banco já tem a coluna (veio na leitura); assim nada quebra antes da migração.
  if (Array.isArray(s.compartilhado_com)) o.compartilhado_com = s.compartilhado_com;
  // Lixeira: idem, só vai quando o sonho já tem o campo (bloco 8 do schema.sql).
  if (s.apagado_em !== undefined) o.apagado_em = s.apagado_em;
  // Imagens: idem (bloco 10 do schema.sql). Sonho sem imagem não manda o campo.
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
      if (sonho?.imagens?.length) await supabase.storage.from(IMAGEM_BUCKET).remove(sonho.imagens.map((i) => i.ref));
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
      const imagens = lista.flatMap((s) => (s.imagens || []).map((i) => i.ref));
      if (imagens.length) await supabase.storage.from(IMAGEM_BUCKET).remove(imagens).catch(() => {});
      for (let i = 0; i < lista.length; i += 200) {
        const { error } = await supabase.from('sonhos').delete().in('id', lista.slice(i, i + 200).map((s) => s.id));
        if (error) throw error;
      }
    },
    async apagarTodos() {
      const { data: arquivos } = await supabase.storage.from(AUDIO_BUCKET).list(userId, { limit: 1000 });
      if (arquivos?.length) await supabase.storage.from(AUDIO_BUCKET).remove(arquivos.map((a) => `${userId}/${a.name}`));
      const { data: fotos } = await supabase.storage.from(IMAGEM_BUCKET).list(userId, { limit: 1000 }).catch(() => ({ data: null }));
      if (fotos?.length) await supabase.storage.from(IMAGEM_BUCKET).remove(fotos.map((a) => `${userId}/${a.name}`));
      const { error } = await supabase.from('sonhos').delete().eq('user_id', userId);
      if (error) throw error;
    },
    async salvarAudio(id, blob) {
      const caminho = `${userId}/${id}.${extAudio(blob.type)}`;
      const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(caminho, blob, { upsert: true, contentType: blob.type || 'audio/webm' });
      if (error) throw error;
      return caminho;
    },
    async urlAudio(ref) {
      const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
    async salvarImagem(id, blob) {
      const caminho = `${userId}/${id}.${extImagem(blob.type)}`;
      const { error } = await supabase.storage.from(IMAGEM_BUCKET).upload(caminho, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
      if (error) throw error;
      return caminho;
    },
    async urlImagem(ref) {
      const { data, error } = await supabase.storage.from(IMAGEM_BUCKET).createSignedUrl(ref, 60 * 60);
      if (error) return null;
      return data.signedUrl;
    },
    apagarImagem: (ref) => supabase.storage.from(IMAGEM_BUCKET).remove([ref]).catch(() => {}),
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
    if (s.imagens?.length) {
      const levadas = [];
      for (const im of s.imagens) {
        const blob = await imagemLocal.ler(im.ref).catch(() => null);
        if (blob) levadas.push({ ...im, ref: await r.salvarImagem(im.ref, blob) });
      }
      copia.imagens = levadas;
    }
    await r.salvar(copia);
    await apagarArquivosLocais(s);
  }
  local.gravarTodos([]);
  return lista.length;
}
