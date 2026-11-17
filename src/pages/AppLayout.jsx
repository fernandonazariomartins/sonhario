import { useEffect, useMemo, useRef, useState } from 'react';
import { ehVazio, arrumarDoNotion } from '../lib/importar.js';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import Entrar from './Entrar.jsx';
import Contribuir from '../components/Contribuir.jsx';
import Lembrete from '../components/Lembrete.jsx';
import Compartilhar from '../components/Compartilhar.jsx';
import { rotuloAba, convitePendente } from '../lib/compartilhar.js';
import { instalado } from '../lib/lembrete.js';
import { Mais, Mural, Faisca, Importar, Sair, Pontos, Sino, Mensagem, Voltar, Lixo, Pessoas } from '../components/Icones.jsx';

export default function AppLayout() {
  const { pronto, usuario, semConta, temLogin, aviso, sair, entrar, sonhos, apagarTodos, apagarVarios, salvarVarios, avisar, compartilhamentos } = useEstado();
  const navegar = useNavigate();
  const comigoTodos = [...compartilhamentos.comigo, ...compartilhamentos.aguardando];
  const vazios = useMemo(() => sonhos.filter(ehVazio), [sonhos]);
  const doNotion = useMemo(() => arrumarDoNotion(sonhos), [sonhos]);
  const [arrumando, setArrumando] = useState(false);
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [janela, setJanela] = useState(''); // 'contribuir' | 'lembrete' | 'compartilhar'
  const caixaMenu = useRef(null);

  useEffect(() => { setMenu(false); setJanela(''); }, [pathname]);

  // Página nova abre no topo; só o botão voltar do navegador devolve a rolagem de antes.
  const tipoNavegacao = useNavigationType();
  useEffect(() => { if (tipoNavegacao !== 'POP') window.scrollTo(0, 0); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convite aberto sem login: guarda o endereço e volta para ele depois de entrar com Google.
  const DESTINO = 'sonhario:depois-de-entrar';
  useEffect(() => {
    if (!pronto) return;
    if (!usuario && temLogin && pathname.startsWith('/app/compartilhados')) sessionStorage.setItem(DESTINO, pathname);
    if (usuario) {
      const convite = convitePendente.pegar();
      if (convite) { navegar('/convite/' + convite, { replace: true }); return; }
      const destino = sessionStorage.getItem(DESTINO);
      if (destino) { sessionStorage.removeItem(DESTINO); if (destino !== pathname) navegar(destino, { replace: true }); }
    }
  }, [pronto, usuario, temLogin, pathname, navegar]);
  useEffect(() => {
    if (!menu) return;
    const fora = (e) => !caixaMenu.current?.contains(e.target) && setMenu(false);
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [menu]);

  if (!pronto) return <div style={{ padding: 40, color: 'var(--muted)' }}>Carregando…</div>;
  // Sem login: no navegador, a pessoa vê a home. No app instalado, vê a tela de entrar
  // (lá ainda dá para continuar sem conta e registrar o sonho na hora).
  if (temLogin && !usuario) {
    if (pathname.startsWith('/app/compartilhados')) sessionStorage.setItem(DESTINO, pathname);
    if (!instalado()) return <Navigate to="/" replace />;
    if (!semConta) return <Entrar />;
  }

  const naCaptura = pathname === '/app' || pathname === '/app/';
  const aba = ({ isActive }) => 'aba' + (isActive ? ' ativa' : '');
  const abrir = (j) => { setMenu(false); setJanela(j); };
  // Sonhos que vieram do Notion com o cabeçalho ("# Sem título", "Data : …") dentro do relato.
  async function arrumarNotion() {
    setMenu(false);
    setArrumando(true);
    const n = doNotion.length;
    await salvarVarios(doNotion);
    setArrumando(false);
    avisar(n === 1 ? '1 sonho do Notion arrumado' : n + ' sonhos do Notion arrumados');
  }
  async function apagarVazios() {
    setMenu(false);
    const n = vazios.length;
    if (!confirm(`Apagar ${n === 1 ? '1 sonho vazio' : n + ' sonhos vazios'}? São os que não têm título, relato, áudio, temas nem amplificações.`)) return;
    await apagarVarios(vazios.map((s) => s.id));
    avisar(n === 1 ? '1 sonho vazio apagado' : n + ' sonhos vazios apagados');
  }
  async function apagarTudo() {
    setMenu(false);
    const n = sonhos.length;
    const r = prompt(`Isso apaga os ${n} sonhos do seu acervo, com áudios e amplificações. Não dá para desfazer.\n\nPara confirmar, digite APAGAR:`);
    if ((r || '').trim().toUpperCase() !== 'APAGAR') return;
    await apagarTodos();
    avisar(n === 1 ? '1 sonho apagado' : n + ' sonhos apagados');
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header className="topo">
        <Logo para="/app" />
        <nav aria-label="Seções do app" className="abas" style={{ marginLeft: 'auto' }}>
          <NavLink to="/app" end aria-label="Novo sonho" className={({ isActive }) => 'aba' + (isActive ? ' ativa' : ' aba-novo')}><Mais size={16} /> <span className="esconde-celular">Novo</span></NavLink>
          <NavLink to="/app/acervo" aria-label="Acervo" className={({ isActive }) => aba({ isActive: isActive || pathname.startsWith('/app/sonho') })}><Mural size={16} /> <span className="esconde-pequeno">Acervo</span></NavLink>
          <NavLink to="/app/insights" aria-label="Insights" className={aba}><Faisca size={16} /> <span className="esconde-celular">Insights</span></NavLink>
          {comigoTodos.length > 0 && <NavLink to="/app/compartilhados" aria-label={rotuloAba(comigoTodos)} className={aba}><Pessoas size={16} /> <span className="esconde-celular">{rotuloAba(comigoTodos)}</span></NavLink>}
        </nav>
        <div ref={caixaMenu} style={{ position: 'relative' }}>
          <button type="button" className="btn-icone" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu" aria-label="Mais opções"><Pontos /></button>
          {menu && (
            <div className="menu" role="menu">
              <Link role="menuitem" className="menu-item" to="/app/importar"><Importar size={18} /> Importar sonhos</Link>
              <Link role="menuitem" className="menu-item" to="/" state={{ ficar: true }}><Voltar size={18} /> Página inicial</Link>
              {temLogin && <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('compartilhar')}><Pessoas size={18} /> Pessoas com acesso{compartilhamentos.pedidos.length > 0 && <span style={{ marginLeft: 'auto', minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: 'var(--azul)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{compartilhamentos.pedidos.length}</span>}</button>}
              {temLogin && usuario && compartilhamentos.comigo.length === 0 && compartilhamentos.aguardando.length === 0 && <Link role="menuitem" className="menu-item" to="/app/compartilhados"><Pessoas size={18} /> Compartilhados comigo</Link>}
              <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('lembrete')}><Sino size={18} /> Lembrete da manhã</button>
              <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('contribuir')}><Mensagem size={18} /> Contribuir com uma ideia</button>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 4px' }} />
              {doNotion.length > 0 && <button role="menuitem" type="button" className="menu-item" onClick={arrumarNotion}><Importar size={18} /> Arrumar sonhos vindos do Notion ({doNotion.length})</button>}
              {vazios.length > 0 && <button role="menuitem" type="button" className="menu-item" onClick={apagarVazios}><Lixo size={18} /> Apagar sonhos vazios ({vazios.length})</button>}
              {sonhos.length > 0 && <button role="menuitem" type="button" className="menu-item" style={{ color: '#B42318' }} onClick={apagarTudo}><Lixo size={18} /> Apagar todos os sonhos</button>}
              {usuario ? (
                <button role="menuitem" type="button" className="menu-item" onClick={sair}><Sair size={18} /> <span>Sair<br /><span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>{usuario.email}</span></span></button>
              ) : temLogin ? (
                <button role="menuitem" type="button" className="menu-item" onClick={entrar}>Entrar com Google</button>
              ) : <span className="menu-item" style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 13 }}>Seus sonhos ficam neste aparelho.</span>}
            </div>
          )}
        </div>
      </header>
      {!naCaptura && compartilhamentos.pedidos.length > 0 && (
        <button type="button" onClick={() => setJanela('compartilhar')} style={{ border: 0, borderBottom: '1px solid #F3DDB5', background: 'var(--warn-bg)', color: 'var(--warn-ink)', padding: '10px 20px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Pessoas size={16} /> {compartilhamentos.pedidos.length === 1 ? '1 pessoa abriu seu link e quer ver um sonho' : compartilhamentos.pedidos.length + ' pessoas abriram seu link e querem ver um sonho'} · <span style={{ textDecoration: 'underline' }}>ver pedidos</span>
        </button>
      )}
      {!naCaptura && doNotion.length > 0 && (
        <button type="button" disabled={arrumando} onClick={arrumarNotion} style={{ border: 0, borderBottom: '1px solid #F3DDB5', background: 'var(--warn-bg)', color: 'var(--warn-ink)', padding: '10px 20px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', textAlign: 'center' }}>
          <Importar size={16} /> {doNotion.length === 1 ? '1 sonho veio do Notion com o cabeçalho no relato' : doNotion.length + ' sonhos vieram do Notion com o cabeçalho no relato'} · <span style={{ textDecoration: 'underline' }}>{arrumando ? 'arrumando…' : 'arrumar título e data'}</span>
        </button>
      )}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      {!naCaptura && (
        <footer style={{ padding: '0 20px 108px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Assinatura />
          <button type="button" className="btn btn-linha" onClick={() => setJanela('contribuir')}><Mensagem size={16} /> Contribuir com uma ideia</button>
        </footer>
      )}
      {!naCaptura && <Link to="/app" className="fab" aria-label="Novo sonho"><Mais size={26} w={2.6} /><span className="esconde-celular">Novo sonho</span></Link>}
      {janela === 'contribuir' && <Contribuir aoFechar={() => setJanela('')} />}
      {janela === 'lembrete' && <Lembrete aoFechar={() => setJanela('')} />}
      {janela === 'compartilhar' && <Compartilhar aoFechar={() => setJanela('')} />}
      {aviso && <div className="toast" role="status" style={naCaptura ? undefined : { bottom: 100 }}>{aviso}</div>}
    </div>
  );
}
