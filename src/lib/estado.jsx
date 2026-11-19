// Estado do app: sessão, modo (com ou sem conta) e a lista de sonhos.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, entrarComGoogle, sair } from './supabase.js';
import { local, remoto, levarParaConta } from './armazem.js';
import { mapaDeCores, corDoTema } from './coresTema.js';
import { PRAZO_LIXEIRA as PRAZO } from './sonhos.js';
import { listarCompartilhamentos, salvarMeuPerfil, meuModo, definirModo } from './compartilhar.js';
import { resumoComentarios } from './comentarios.js';
import { sonhosDeExemplo } from './exemplos.js';
import { usaBotaoGoogle } from './googleLogin.js';
import EntrarGoogle from '../components/EntrarGoogle.jsx';
import * as cofreLib from './cofre.js';
import { DEMO } from './demo.js';

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
  // Na demonstração, o acervo inventado já faz o papel dos exemplos.
  const [semExemplos, setSemExemplos] = useState(() => DEMO || localStorage.getItem(SEM_EXEMPLOS) === '1');
  const [janelaLogin, setJanelaLogin] = useState(false);
  const [aviso, setAviso] = useState(null); // { msg, acao?: { rotulo, fn } }
  const [compartilhamentos, setCompartilhamentos] = useState({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} });
  // Modo terapeuta: atende pacientes? perguntar: ainda não respondeu.
  const [modo, setModo] = useState({ atende: false, perguntar: false, carregado: false });
  const [comentarios, setComentarios] = useState({}); // { [sonho_id]: { total, novos } } dos meus sonhos
  const sonhosRef = useRef([]);
  useEffect(() => { sonhosRef.current = todos; }, [todos]);

  const usuario = sessao?.user || null;
  const loja = useMemo(() => (usuario ? remoto(usuario.id) : local), [usuario]);
  const uid = usuario?.id || null;

  // Cofre: 'carregando' | 'indisponivel' | 'sem-chaves' | 'trancado' | 'aberto' | 'erro' (veja cofre.js).
  // O estado vale só para a conta em que foi lido: logo depois de entrar, ainda é 'carregando'
  // (senão um sonho do aparelho poderia subir aberto antes de o cofre ser lido).
  const [cofreDe, setCofreDe] = useState({ uid: undefined, estado: 'carregando' });
  const cofre = cofreDe.uid === uid ? cofreDe.estado : 'carregando';
  const setCofre = useCallback((estado) => setCofreDe({ uid, estado }), [uid]);
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const abrirCofre = useCallback(async () => {
    setCofreDe({ uid: undefined, estado: 'carregando' });
    try { setCofreDe({ uid, estado: await cofreLib.carregarCofre(usuario) }); } catch { setCofreDe({ uid, estado: 'erro' }); }
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (pronto) abrirCofre(); }, [pronto, abrirCofre]);
  // Com o cofre, dá para ler (aberto) ou só guardar sonhos novos (trancado: só a chave pública).
  const podeGuardar = cofre === 'indisponivel' || cofre === 'aberto' || cofre === 'trancado';
  const podeLer = cofre === 'indisponivel' || cofre === 'aberto';

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
    if (!podeLer) { setSonhos([]); setCarregado(true); return; }
    try {
      const lista = await loja.listar();
      // Passados os 7 dias na lixeira, apaga de vez (com o áudio).
      const velhos = lista.filter(vencido);
      setSonhos(lista.filter((s) => !vencido(s)));
      if (velhos.length) loja.apagarVarios(velhos).catch(() => {});
    } catch (e) { avisar('Não deu para carregar os sonhos: ' + e.message); }
    setCarregado(true);
    if (cofre === 'aberto') cofreLib.entregarChaves().catch(() => {});
  }, [loja, avisar, podeLer, cofre]);

  // Ao entrar com Google, leva para a conta o que estava salvo no aparelho.
  useEffect(() => {
    if (!pronto || !podeGuardar) return;
    setCarregado(false);
    (async () => {
      if (cofreLib.temPublica()) await cofreLib.subirChavesDeLinks().catch(() => {});
      if (usuario && local.listar().length) {
        try {
          const n = await levarParaConta(usuario.id);
          avisar(n === 1 ? '1 sonho levado para a sua conta' : `${n} sonhos levados para a sua conta`);
        } catch (e) { avisar('Não deu para levar os sonhos para a conta: ' + e.message); }
      }
      recarregar();
    })();
  }, [pronto, usuario, recarregar, avisar, podeGuardar]);

  // Convites feitos e recebidos. Se o banco ainda não tem a tabela, fica tudo vazio.
  const recarregarCompartilhamentos = useCallback(async () => {
    if (!usuario) { setCompartilhamentos({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} }); return; }
    try { setCompartilhamentos(await listarCompartilhamentos(usuario)); } catch { setCompartilhamentos({ meus: [], pedidos: [], comigo: [], aguardando: [], perfis: {} }); }
    // Alguém novo pode ter ganhado acesso (pedido aprovado, link aberto): entrega a chave dos sonhos.
    cofreLib.entregarChaves().catch(() => {});
  }, [usuario]);
  const recarregarModo = useCallback(async () => {
    if (!usuario) { setModo({ atende: false, perguntar: false, carregado: true }); return; }
    try { setModo({ ...(await meuModo(usuario)), carregado: true }); } catch { setModo({ atende: false, perguntar: false, carregado: true }); }
  }, [usuario]);
  useEffect(() => {
    if (!pronto) return;
    // O perfil precisa existir antes de ler o modo (na primeira entrada ele é criado aqui).
    if (usuario) salvarMeuPerfil(usuario).catch(() => {}).finally(recarregarModo);
    else recarregarModo();
    recarregarCompartilhamentos();
  }, [pronto, usuario, recarregarCompartilhamentos, recarregarModo]);

  const mudarModo = useCallback(async (atende) => {
    if (!usuario) return;
    const antes = modo;
    setModo({ atende, perguntar: false, carregado: true });
    try { await definirModo(usuario, atende); } catch (e) {
      setModo(antes);
      avisar(/atende/.test(e?.message || '') ? 'O modo terapeuta ainda não está ativo no banco: rode o bloco 16 do supabase/schema.sql.' : 'Não deu para salvar: ' + e.message);
    }
  }, [usuario, modo, avisar]);

  // Comentários nos meus sonhos, para o mural e a lista mostrarem quem comentou.
  const recarregarComentarios = useCallback(async () => {
    if (!usuario) { setComentarios({}); return; }
    setComentarios(await resumoComentarios({ donoId: usuario.id, meuId: usuario.id }));
  }, [usuario]);
  useEffect(() => {
    if (!pronto) return;
    recarregarComentarios();
    if (!usuario) return;
    // Volta a olhar quando a pessoa volta para o app.
    const ao = () => { if (document.visibilityState === 'visible') recarregarComentarios(); };
    document.addEventListener('visibilitychange', ao);
    return () => document.removeEventListener('visibilitychange', ao);
  }, [pronto, usuario, recarregarComentarios]);

  const salvar = useCallback(async (sonho) => {
    const s = { ...sonho, atualizado_em: new Date().toISOString() };
    // Com conta e cofre, todo sonho salvo vai trancado.
    if (usuario && cofreLib.temPublica() && !s._trancado) s._cifrado = true;
    setSonhos((lista) => [s, ...lista.filter((x) => x.id !== s.id)].sort((a, b) => b.sonhado_em.localeCompare(a.sonhado_em)));
    try {
      await loja.salvar(s);
      if (s._cifrado && s.compartilhado_com?.length) cofreLib.entregarChaves().catch(() => {});
    } catch (e) { avisar('Não deu para salvar: ' + e.message); }
    return s;
  }, [loja, avisar, usuario]);

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

  // Frase-senha e código de recuperação.
  const [nivel, setNivel] = useState('basico'); // nível de criptografia da conta
  useEffect(() => { if (cofre === 'aberto' || cofre === 'trancado') setNivel(cofreLib.modoAtual()); }, [cofre]);
  const criarCofre = useCallback(async (senha, n = 'basico') => {
    const codigo = await cofreLib.criarCofre(usuario, senha, n);
    if (codigo) setCodigoRecuperacao(codigo); // avançada: mostrado até a pessoa confirmar que guardou
    setNivel(n);
    setCofre('aberto');
    return codigo;
  }, [uid, setCofre]); // eslint-disable-line react-hooks/exhaustive-deps
  const destrancar = useCallback(async (senha) => { await cofreLib.destrancar(senha); setCofre('aberto'); }, [setCofre]);
  const recuperarCofre = useCallback(async (codigo, nova) => { await cofreLib.recuperar(codigo, nova); setCofre('aberto'); }, [setCofre]);
  const trocarSenha = useCallback((atual, nova) => cofreLib.trocarSenha(atual, nova), []);
  const recuperarBasico = useCallback(async (nova) => { await cofreLib.recuperarBasico(nova); setCofre('aberto'); }, [setCofre]);
  const irParaAvancado = useCallback(async () => { const codigo = await cofreLib.irParaAvancado(); setNivel('avancado'); setCodigoRecuperacao(codigo); }, []);
  const irParaBasico = useCallback(async (senha) => { await cofreLib.irParaBasico(senha); setNivel('basico'); }, []);
  // Tranca o que ainda está aberto no banco (sonhos de antes da frase-senha).
  const trancarAcervo = useCallback(async (aoAvancar) => {
    const r = await loja.trancarTodos(sonhosRef.current, aoAvancar);
    await recarregar();
    return r;
  }, [loja, recarregar]);
  const abertosNoBanco = useMemo(() => (usuario && cofre === 'aberto' ? todos.filter((s) => !s._cifrado && !s._trancado).length : 0), [usuario, cofre, todos]);

  const valor = {
    cofre, abrirCofre, criarCofre, destrancar, recuperarCofre, recuperarBasico, trocarSenha, nivel, irParaAvancado, irParaBasico, trancarAcervo, abertosNoBanco,
    codigoRecuperacao, esquecerCodigo: () => setCodigoRecuperacao(''),
    pronto, carregado, podeLer, usuario, sonhos, lixeira, restaurar, apagarDeVez, exemplos, semExemplos,
    esconderExemplos: () => { localStorage.setItem(SEM_EXEMPLOS, '1'); setSemExemplos(true); }, aviso, compartilhamentos, recarregarCompartilhamentos, modo, mudarModo, recarregarModo, comentarios, recarregarComentarios, avisar, recarregar, salvar, atualizar, apagar, salvarVarios, apagarTodos, apagarVarios,
    salvarAudio: (id, blob) => loja.salvarAudio(id, blob),
    urlAudio: (ref) => loja.urlAudio(ref),
    salvarImagem: (id, blob) => loja.salvarImagem(id, blob),
    urlImagem: (ref) => loja.urlImagem(ref),
    apagarImagem: (ref) => loja.apagarImagem(ref),
    temLogin: !!supabase,
    demo: DEMO,
    semConta,
    entrar: () => (usaBotaoGoogle() ? setJanelaLogin(true) : entrarComGoogle()),
    pularLogin: () => { localStorage.setItem(PULOU, '1'); setSemConta(true); },
    sair: async () => { await cofreLib.esquecerAparelho(usuario?.id); await sair(); localStorage.removeItem(PULOU); setSemConta(false); setSonhos([]); setCarregado(false); },
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
