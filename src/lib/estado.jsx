// Estado do app: sessão, modo (com ou sem conta) e a lista de sonhos.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, entrarComGoogle, sair } from './supabase.js';
import { local, remoto, levarParaConta } from './armazem.js';

const Ctx = createContext(null);
const PULOU = 'sonhario:sem-conta';

export function EstadoProvider({ children }) {
  const [pronto, setPronto] = useState(false);
  const [sessao, setSessao] = useState(null);
  const [semConta, setSemConta] = useState(() => localStorage.getItem(PULOU) === '1' || !supabase);
  const [sonhos, setSonhos] = useState([]);
  const [aviso, setAviso] = useState('');

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
  }, [loja, avisar]);

  // Ao entrar com Google, leva para a conta o que estava salvo no aparelho.
  useEffect(() => {
    if (!pronto) return;
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

  const salvar = useCallback(async (sonho) => {
    const s = { ...sonho, atualizado_em: new Date().toISOString() };
    setSonhos((lista) => [s, ...lista.filter((x) => x.id !== s.id)].sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em)));
    try { await loja.salvar(s); } catch (e) { avisar('Não deu para salvar: ' + e.message); }
    return s;
  }, [loja, avisar]);

  const apagar = useCallback(async (id) => {
    const s = sonhos.find((x) => x.id === id);
    setSonhos((lista) => lista.filter((x) => x.id !== id));
    try { await loja.apagar(id, s); } catch (e) { avisar('Não deu para apagar: ' + e.message); }
  }, [loja, sonhos, avisar]);

  const valor = {
    pronto, usuario, sonhos, aviso, avisar, recarregar, salvar, apagar,
    salvarAudio: (id, blob) => loja.salvarAudio(id, blob),
    urlAudio: (ref) => loja.urlAudio(ref),
    temLogin: !!supabase,
    semConta,
    entrar: () => entrarComGoogle(),
    pularLogin: () => { localStorage.setItem(PULOU, '1'); setSemConta(true); },
    sair: async () => { await sair(); localStorage.removeItem(PULOU); setSemConta(false); setSonhos([]); },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useEstado = () => useContext(Ctx);
