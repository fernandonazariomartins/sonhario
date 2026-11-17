// Estado do app: sessão, modo (com ou sem conta) e a lista de sonhos.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, entrarComGoogle, sair } from './supabase.js';
import { local, remoto, levarParaConta } from './armazem.js';
import { mapaDeCores, corDoTema } from './coresTema.js';
import { listarCompartilhamentos, salvarMeuPerfil } from './compartilhar.js';
import { sonhosDeExemplo } from './exemplos.js';

const Ctx = createContext(null);
const PULOU = 'sonhario:sem-conta';
const SEM_EXEMPLOS = 'sonhario:sem-exemplos';

export function EstadoProvider({ children }) {
  const [pronto, setPronto] = useState(false);
  const [sessao, setSessao] = useState(null);
  const [semConta, setSemConta] = useState(() => localStorage.getItem(PULOU) === '1' || !supabase);
  const [sonhos, setSonhos] = useState([]);
  const [carregado, setCarregado] = useState(false);
  const [semExemplos, setSemExemplos] = useState(() => localStorage.getItem(SEM_EXEMPLOS) === '1');
  const [aviso, setAviso] = useState('');
  const [compartilhamentos, setCompartilhamentos] = useState({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} });
  const sonhosRef = useRef([]);
  useEffect(() => { sonhosRef.current = sonhos; }, [sonhos]);

  const usuario = sessao?.user || null;
  const loja = useMemo(() => (usuario ? remoto(usuario.id) : local), [usuario]);

  const avisar = useCallback((msg) => {
    setAviso(msg);
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => setAviso(''), 4000);
  }, []);

  useEffect(() => {
    if (!supabase) { setPronto(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setPronto(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const recarregar = useCallback(async () => {
    try { setSonhos(await loja.listar()); } catch (e) { avisar('Não deu para carregar os sonhos: ' + e.message); }
    setCarregado(true);
  }, [loja, avisar]);

  // Ao entrar com Google, leva para a conta o que estava salvo no aparelho.
  useEffect(() => {
    if (!pronto) return;
    setCarregado(false);
    (async () => {
      if (usuario && local.listar().length) {
        try {
          const n = await levarParaConta(usuario.id);
          avisar(n === 1 ? '1 sonho levado para a sua conta' : `${n} sonhos levados para a sua conta`);
        } catch (e) { avisar('Não deu para levar os sonhos para a conta: ' + e.message); }
      }
      recarregar();
    })();
  }, [pronto, usuario, recarregar, avisar]);

  // Convites feitos e recebidos. Se o banco ainda não tem a tabela, fica tudo vazio.
  const recarregarCompartilhamentos = useCallback(async () => {
    if (!usuario) { setCompartilhamentos({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} }); return; }
    try { setCompartilhamentos(await listarCompartilhamentos(usuario)); } catch { setCompartilhamentos({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} }); }
  }, [usuario]);
  useEffect(() => {
    if (!pronto) return;
    if (usuario) salvarMeuPerfil(usuario).catch(() => {});
    recarregarCompartilhamentos();
  }, [pronto, usuario, recarregarCompartilhamentos]);

  const salvar = useCallback(async (sonho) => {
    const s = { ...sonho, atualizado_em: new Date().toISOString() };
    setSonhos((lista) => [s, ...lista.filter((x) => x.id !== s.id)].sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em)));
    try { await loja.salvar(s); } catch (e) { avisar('Não deu para salvar: ' + e.message); }
    return s;
  }, [loja, avisar]);

  // Muda só alguns campos do sonho mais recente (ex.: a transcrição que chega depois de guardar).
  const atualizar = useCallback(async (id, parcial) => {
    const atual = sonhosRef.current.find((x) => x.id === id);
    if (!atual) return null;
    return salvar({ ...atual, ...parcial });
  }, [salvar]);

  const apagar = useCallback(async (id) => {
    const s = sonhos.find((x) => x.id === id);
    setSonhos((lista) => lista.filter((x) => x.id !== id));
    try { await loja.apagar(id, s); } catch (e) { avisar('Não deu para apagar: ' + e.message); }
  }, [loja, sonhos, avisar]);

  const salvarVarios = useCallback(async (lista) => {
    const agora = new Date().toISOString();
    const novos = lista.map((s) => ({ ...s, atualizado_em: agora }));
    try { await loja.salvarVarios(novos); } catch (e) { avisar('Não deu para salvar: ' + e.message); }
    await recarregar();
  }, [loja, avisar, recarregar]);

  const apagarVarios = useCallback(async (ids) => {
    const alvo = new Set(ids);
    const lista = sonhosRef.current.filter((x) => alvo.has(x.id));
    setSonhos((l) => l.filter((x) => !alvo.has(x.id)));
    try { await loja.apagarVarios(lista); } catch (e) { avisar('Não deu para apagar: ' + e.message); await recarregar(); }
  }, [loja, avisar, recarregar]);

  const apagarTodos = useCallback(async () => {
    try { await loja.apagarTodos(); setSonhos([]); } catch (e) { avisar('Não deu para apagar: ' + e.message); await recarregar(); }
  }, [loja, avisar, recarregar]);

  // Exemplos só na tela, nunca no banco. Esperam a lista carregar para não piscar para quem já tem sonhos.
  const exemplos = useMemo(() => (carregado && !semExemplos ? sonhosDeExemplo(sonhos.length) : []), [carregado, semExemplos, sonhos.length]);

  const valor = {
    pronto, usuario, sonhos, exemplos, semExemplos,
    esconderExemplos: () => { localStorage.setItem(SEM_EXEMPLOS, '1'); setSemExemplos(true); }, aviso, compartilhamentos, recarregarCompartilhamentos, avisar, recarregar, salvar, atualizar, apagar, salvarVarios, apagarTodos, apagarVarios,
    salvarAudio: (id, blob) => loja.salvarAudio(id, blob),
    urlAudio: (ref) => loja.urlAudio(ref),
    salvarImagem: (sonhoId, blob) => loja.salvarImagem(sonhoId, blob),
    urlImagem: (ref) => loja.urlImagem(ref),
    apagarImagens: (refs) => loja.apagarImagens(refs),
    temLogin: !!supabase,
    semConta,
    entrar: () => entrarComGoogle(),
    pularLogin: () => { localStorage.setItem(PULOU, '1'); setSemConta(true); },
    sair: async () => { await sair(); localStorage.removeItem(PULOU); setSemConta(false); setSonhos([]); setCarregado(false); },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useEstado = () => useContext(Ctx);

// Estilo da etiqueta de um tema (fundo e texto), com a cor fixa daquele tema no acervo.
export function useCorTema() {
  const { sonhos } = useEstado();
  const mapa = useMemo(() => mapaDeCores(sonhos), [sonhos]);
  return useCallback((nome) => { const c = corDoTema(nome, mapa); return { background: c.fundo, color: c.texto }; }, [mapa]);
}
