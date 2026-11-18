// Estado do app: sessão, modo (com ou sem conta) e a lista de sonhos.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, entrarComGoogle, sair } from './supabase.js';
import { local, remoto, levarParaConta } from './armazem.js';
import { mapaDeCores, corDoTema } from './coresTema.js';
import { PRAZO_LIXEIRA as PRAZO } from './sonhos.js';
import { listarCompartilhamentos, salvarMeuPerfil } from './compartilhar.js';
import { sonhosDeExemplo } from './exemplos.js';
import { usaBotaoGoogle } from './googleLogin.js';
import EntrarGoogle from '../components/EntrarGoogle.jsx';

const Ctx = createContext(null);
const PULOU = 'sonhario:sem-conta';
const SEM_EXEMPLOS = 'sonhario:sem-exemplos';

const vencido = (s) => s.apagado_em && Date.now() - new Date(s.apagado_em).getTime() > PRAZO;
const semColuna = (e) => /apagado_em/.test(e?.message || '');

export function EstadoProvider({ children }) {
  const [pronto, setPronto] = useState(false);
  const [sessao, setSessao] = useState(null);
  const [semConta, setSemConta] = useState(() => localStorage.getItem(PULOU) === '1' || !supabase);
  const [todos, setSonhos] = useState([]); // inclui os que estão na lixeira
  const sonhos = useMemo(() => todos.filter((s) => !s.apagado_em), [todos]);
  const lixeira = useMemo(() => todos.filter((s) => s.apagado_em).sort((a, b) => b.apagado_em.localeCompare(a.apagado_em)), [todos]);
  const [carregado, setCarregado] = useState(false);
  const [semExemplos, setSemExemplos] = useState(() => localStorage.getItem(SEM_EXEMPLOS) === '1');
  const [janelaLogin, setJanelaLogin] = useState(false);
  const [aviso, setAviso] = useState(null); // { msg, acao?: { rotulo, fn } }
  const [compartilhamentos, setCompartilhamentos] = useState({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} });
  const sonhosRef = useRef([]);
  useEffect(() => { sonhosRef.current = todos; }, [todos]);

  const usuario = sessao?.user || null;
  const loja = useMemo(() => (usuario ? remoto(usuario.id) : local), [usuario]);

  const avisar = useCallback((msg, acao) => {
    setAviso({ msg, acao });
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => setAviso(null), acao ? 7000 : 4000);
  }, []);

  useEffect(() => {
    if (!supabase) { setPronto(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setPronto(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const recarregar = useCallback(async () => {
    try {
      const lista = await loja.listar();
      // Passados os 7 dias na lixeira, apaga de vez (com o áudio).
      const velhos = lista.filter(vencido);
      setSonhos(lista.filter((s) => !vencido(s)));
      if (velhos.length) loja.apagarVarios(velhos).catch(() => {});
    } catch (e) { avisar('Não deu para carregar os sonhos: ' + e.message); }
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

  // Muda vários sonhos de uma vez (lixeira e restaurar), com volta atrás se o banco recusar.
  const marcar = useCallback(async (ids, apagado_em) => {
    const alvo = new Set(ids);
    const antes = sonhosRef.current.filter((x) => alvo.has(x.id));
    const depois = antes.map((s) => ({ ...s, apagado_em }));
    const porId = new Map(depois.map((s) => [s.id, s]));
    setSonhos((l) => l.map((x) => porId.get(x.id) || x));
    try { await loja.salvarVarios(depois); return true; } catch (e) {
      setSonhos((l) => l.map((x) => (alvo.has(x.id) ? antes.find((a) => a.id === x.id) : x)));
      avisar(semColuna(e) ? 'A lixeira ainda não está ativa no banco: rode o bloco 8 do supabase/schema.sql.' : 'Não deu para apagar: ' + e.message);
      return false;
    }
  }, [loja, avisar]);

  // Apagar manda para a lixeira; dá para desfazer na hora ou restaurar em até 7 dias.
  const apagarVarios = useCallback(async (ids, msg) => {
    if (!ids.length) return;
    const ok = await marcar(ids, new Date().toISOString());
    if (ok) avisar(msg || (ids.length === 1 ? 'Sonho movido para a lixeira' : ids.length + ' sonhos movidos para a lixeira'), { rotulo: 'Desfazer', fn: () => marcar(ids, null) });
  }, [marcar, avisar]);
  const apagar = useCallback((id) => apagarVarios([id]), [apagarVarios]);
  const apagarTodos = useCallback(() => apagarVarios(sonhosRef.current.filter((s) => !s.apagado_em).map((s) => s.id)), [apagarVarios]);

  const restaurar = useCallback(async (ids) => {
    const ok = await marcar(ids, null);
    if (ok) avisar(ids.length === 1 ? 'Sonho de volta ao acervo' : ids.length + ' sonhos de volta ao acervo');
  }, [marcar, avisar]);

  // Apagar de vez: só de dentro da lixeira.
  const apagarDeVez = useCallback(async (ids) => {
    const alvo = new Set(ids);
    const lista = sonhosRef.current.filter((x) => alvo.has(x.id));
    setSonhos((l) => l.filter((x) => !alvo.has(x.id)));
    try { await loja.apagarVarios(lista); } catch (e) { avisar('Não deu para apagar: ' + e.message); await recarregar(); }
  }, [loja, avisar, recarregar]);

  const salvarVarios = useCallback(async (lista) => {
    const agora = new Date().toISOString();
    const novos = lista.map((s) => ({ ...s, atualizado_em: agora }));
    try { await loja.salvarVarios(novos); } catch (e) { avisar('Não deu para salvar: ' + e.message); }
    await recarregar();
  }, [loja, avisar, recarregar]);

  // Exemplos só na tela, nunca no banco. Esperam a lista carregar para não piscar para quem já tem sonhos.
  const exemplos = useMemo(() => (carregado && !semExemplos ? sonhosDeExemplo(sonhos.length) : []), [carregado, semExemplos, sonhos.length]);

  const fecharLogin = useCallback(() => setJanelaLogin(false), []);
  // Na home, depois de entrar, segue para o app (como fazia o login antigo).
  const depoisDeEntrar = useCallback(() => {
    setJanelaLogin(false);
    if (location.pathname === '/') {
      history.pushState({}, '', '/app');
      dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  const valor = {
    pronto, usuario, sonhos, lixeira, restaurar, apagarDeVez, exemplos, semExemplos,
    esconderExemplos: () => { localStorage.setItem(SEM_EXEMPLOS, '1'); setSemExemplos(true); }, aviso, compartilhamentos, recarregarCompartilhamentos, avisar, recarregar, salvar, atualizar, apagar, salvarVarios, apagarTodos, apagarVarios,
    salvarAudio: (id, blob) => loja.salvarAudio(id, blob),
    urlAudio: (ref) => loja.urlAudio(ref),
    salvarImagem: (id, blob) => loja.salvarImagem(id, blob),
    urlImagem: (ref) => loja.urlImagem(ref),
    apagarImagem: (ref) => loja.apagarImagem(ref),
    temLogin: !!supabase,
    semConta,
    entrar: () => (usaBotaoGoogle() ? setJanelaLogin(true) : entrarComGoogle()),
    pularLogin: () => { localStorage.setItem(PULOU, '1'); setSemConta(true); },
    sair: async () => { await sair(); localStorage.removeItem(PULOU); setSemConta(false); setSonhos([]); setCarregado(false); },
  };
  return (
    <Ctx.Provider value={valor}>
      {children}
      {janelaLogin && (
        <EntrarGoogle
          aoFechar={fecharLogin}
          aoEntrar={depoisDeEntrar}
          aoFalhar={() => { setJanelaLogin(false); entrarComGoogle(); }}
        />
      )}
    </Ctx.Provider>
  );
}

export const useEstado = () => useContext(Ctx);

// Estilo da etiqueta de um tema (fundo e texto), com a cor fixa daquele tema no acervo.
export function useCorTema() {
  const { sonhos } = useEstado();
  const mapa = useMemo(() => mapaDeCores(sonhos), [sonhos]);
  return useCallback((nome) => { const c = corDoTema(nome, mapa); return { background: c.fundo, color: c.texto }; }, [mapa]);
}
