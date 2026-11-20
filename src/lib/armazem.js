// Onde os sonhos moram.
// Sem conta: no próprio aparelho (localStorage para os textos, IndexedDB para os áudios e as imagens).
// Com conta: no Supabase (tabela "sonhos" + buckets "audios" e "imagens"), protegido por RLS.
// Com o cofre ativo, tudo o que é do sonho sai do aparelho já trancado (veja cripto.js e cofre.js):
// no banco ficam abertos só datas, status, cor, favorito, lixeira e com quem foi compartilhado.
import { supabase, AUDIO_BUCKET, IMAGEM_BUCKET } from './supabase.js';
import { cifrar, decifrar, cifrarArquivo, decifrarArquivo, sonhoDoArquivo } from './cripto.js';
import * as cofre from './cofre.js';
import { tipoPorNome } from './midia.js';
import { tr } from './i18n.js';

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

// O sonho como vai para o banco: com o cofre, título, relato, temas e amplificações vão trancados
// (as amplificações à parte, porque nem todo mundo que recebe o sonho pode vê-las).
async function podeTrancar() {
  await cofre.esperarCofre();
  if (cofre.estadoDoCofre() === 'indisponivel') return false; // banco sem o bloco 14: como antes
  if (!cofre.temPublica()) throw new Error(tr("o cofre não abriu, e o sonho não sai aberto do aparelho. Tente de novo."));
  return true;
}

async function fechar(s, userId) {
  const o = linha(s, userId);
  if (!(await podeTrancar())) return o;
  if (s._trancado) throw new Error(tr("Este sonho não abriu neste aparelho; recarregue antes de mexer nele."));
  const k = await cofre.chaveParaSalvar(s.id);
  o.cifrado = await cifrar({ titulo: s.titulo || '', texto: s.texto || '', temas: s.temas || [] }, k);
  o.cifrado_amp = await cifrar(s.conclusoes || [], k);
  o.chave_dono = await cofre.embrulharParaMim(k);
  o.titulo = ''; o.texto = ''; o.temas = []; o.conclusoes = [];
  return o;
}

// O sonho como chega do banco. Se não der para abrir, volta marcado como trancado.
export async function abrirSonho(row, chaveEmbrulhada = row.chave_dono) {
  const resto = { ...row };
  const { cifrado, cifrado_amp } = row;
  for (const c of ['cifrado', 'cifrado_amp', 'chave', 'chave_dono']) delete resto[c];
  if (!cifrado) return resto;
  try {
    const k = await cofre.abrirChave(row.id, chaveEmbrulhada);
    if (!k) return { ...resto, _cifrado: true, _trancado: true };
    const p = await decifrar(cifrado, k);
    const conclusoes = cifrado_amp ? await decifrar(cifrado_amp, k) : [];
    return { ...resto, titulo: p.titulo || '', texto: p.texto || '', temas: p.temas || [], conclusoes, _cifrado: true };
  } catch {
    return { ...resto, _cifrado: true, _trancado: true };
  }
}

// Áudio ou imagem guardado: baixa, e se estiver trancado abre com a chave do sonho.
// Arquivos de antes da criptografia passam direto.
export async function abrirArquivo(urlAssinada) {
  if (!urlAssinada) return null;
  const r = await fetch(urlAssinada);
  if (!r.ok) return null;
  const tipo = r.headers.get('content-type') || '';
  const bytes = await r.arrayBuffer();
  const id = sonhoDoArquivo(bytes);
  if (!id) return URL.createObjectURL(new Blob([bytes], { type: tipo }));
  const k = cofre.chaveEmCache(id);
  if (!k) return null;
  return URL.createObjectURL(await decifrarArquivo(bytes, k, tipo));
}

async function trancarArquivo(id, blob) {
  if (!(await podeTrancar())) return blob;
  const sonhoId = String(id).slice(0, 36); // imagens: "<id do sonho>-<n>"
  return cifrarArquivo(blob, await cofre.chaveParaSalvar(sonhoId), sonhoId);
}

export function remoto(userId) {
  return {
    // aoParcial: recebe logo os sonhos mais recentes (já abertos), para a tela não
    // ficar vazia enquanto o resto do acervo chega e é aberto.
    async listar(aoParcial) {
      const pagina = (de, ate) => supabase
        .from('sonhos')
        .select('*')
        .order('sonhado_em', { ascending: false })
        .order('id', { ascending: true })
        .range(de, ate);
      const PRIMEIRO = 60;
      const { data: primeiros, error } = await pagina(0, PRIMEIRO - 1);
      if (error) throw error;
      const abertos = await Promise.all(primeiros.map((row) => abrirSonho(row)));
      if (primeiros.length < PRIMEIRO) return abertos;
      aoParcial?.(abertos);
      // O Supabase devolve no máximo 1000 linhas por consulta: busca em páginas até acabar.
      const PAGINA = 1000;
      const resto = [];
      for (let de = PRIMEIRO; ; de += PAGINA) {
        const { data, error: erro } = await pagina(de, de + PAGINA - 1);
        if (erro) throw erro;
        resto.push(...data);
        if (data.length < PAGINA) break;
      }
      return [...abertos, ...(await Promise.all(resto.map((row) => abrirSonho(row))))];
    },
    async salvar(sonho) {
      const { error } = await supabase.from('sonhos').upsert(await fechar(sonho, userId));
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
        const linhas = await Promise.all(sonhos.slice(i, i + 200).map((s) => fechar(s, userId)));
        // Num lote, o supabase-js manda as colunas de todas as linhas juntas: a linha que não
        // tem o campo vai com null. "imagens" e "compartilhado_com" não aceitam null, então quem
        // não tem recebe o vazio (ex.: importação com só alguns sonhos com imagem).
        for (const [campo, vazio] of [['imagens', []], ['compartilhado_com', []], ['cifrado', null], ['cifrado_amp', null], ['chave_dono', null]]) {
          if (linhas.some((l) => campo in l)) for (const l of linhas) if (!(campo in l)) l[campo] = vazio;
        }
        const { error } = await supabase.from('sonhos').upsert(linhas);
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
      const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(caminho, await trancarArquivo(id, blob), { upsert: true, contentType: blob.type || 'audio/webm' });
      if (error) throw error;
      return caminho;
    },
    async urlAudio(ref) {
      const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(ref, 60 * 60);
      if (error) return null;
      return abrirArquivo(data.signedUrl).catch(() => null);
    },
    async salvarImagem(id, blob) {
      const caminho = `${userId}/${id}.${extImagem(blob.type)}`;
      const { error } = await supabase.storage.from(IMAGEM_BUCKET).upload(caminho, await trancarArquivo(id, blob), { upsert: true, contentType: blob.type || 'image/jpeg' });
      if (error) throw error;
      return caminho;
    },
    async urlImagem(ref) {
      const { data, error } = await supabase.storage.from(IMAGEM_BUCKET).createSignedUrl(ref, 60 * 60);
      if (error) return null;
      return abrirArquivo(data.signedUrl).catch(() => null);
    },
    apagarImagem: (ref) => supabase.storage.from(IMAGEM_BUCKET).remove([ref]).catch(() => {}),

    // Tranca os sonhos que ainda estão abertos no banco, de 4 em 4.
    // Para cada sonho: primeiro grava o texto trancado (com a chave), depois troca os arquivos.
    // Se parar no meio, o que já foi fica trancado e o resto continua legível, como antes.
    async trancarTodos(lista, aoAvancar = () => {}) {
      if (!cofre.temPublica()) throw new Error(tr("Crie a frase-senha antes."));
      const faltam = lista.filter((s) => !s._cifrado && !s._trancado);
      let feitos = 0;
      const falhas = [];
      for (let i = 0; i < faltam.length; i += 4) {
        await Promise.all(faltam.slice(i, i + 4).map(async (s) => {
          try {
            const { error } = await supabase.from('sonhos').upsert(await fechar(s, userId));
            if (error) throw error;
            const arquivos = [
              ...(s.audio?.ref ? [[AUDIO_BUCKET, s.audio.ref]] : []),
              ...(s.imagens || []).map((im) => [IMAGEM_BUCKET, im.ref]),
            ];
            for (const [balde, ref] of arquivos) await trancarArquivoGuardado(balde, ref, s.id);
          } catch (e) { falhas.push({ id: s.id, erro: e.message }); }
        }));
        feitos = Math.min(faltam.length, i + 4);
        aoAvancar(feitos, faltam.length);
      }
      return { total: faltam.length, falhas };
    },
  };
}

async function trancarArquivoGuardado(balde, ref, sonhoId) {
  const { data, error } = await supabase.storage.from(balde).download(ref);
  if (error || !data) return; // arquivo que já não existe: nada a trancar
  const bytes = await data.arrayBuffer();
  if (sonhoDoArquivo(bytes)) return; // já trancado
  const tipo = (data.type && data.type !== 'application/octet-stream' ? data.type : '') || tipoPorNome(ref) || (balde === AUDIO_BUCKET ? 'audio/webm' : 'image/jpeg');
  const trancado = await cifrarArquivo(new Blob([bytes], { type: tipo }), await cofre.chaveParaSalvar(sonhoId), sonhoId);
  const r = await supabase.storage.from(balde).upload(ref, trancado, { upsert: true, contentType: tipo });
  if (r.error) throw r.error;
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
