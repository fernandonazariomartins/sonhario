import { useEffect, useMemo, useRef, useState } from 'react';
import { ehVazio } from '../lib/importar.js';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import Entrar from './Entrar.jsx';
import Contribuir from '../components/Contribuir.jsx';
import Lembrete from '../components/Lembrete.jsx';
import Compartilhar from '../components/Compartilhar.jsx';
import { rotuloAba } from '../lib/compartilhar.js';
import { instalado } from '../lib/lembrete.js';
import { Mais, Mural, Faisca, Importar, Sair, Pontos, Sino, Mensagem, Voltar, Lixo, Pessoas } from '../components/Icones.jsx';

export default function AppLayout() {
  const { pronto, usuario, semConta, temLogin, aviso, sair, entrar, sonhos, apagarTodos, apagarVarios, avisar, compartilhamentos } = useEstado();
  const navegar = useNavigate();
  const vazios = useMemo(() => sonhos.filter(ehVazio), [sonhos]);
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const [janela, setJanela] = useState(''); // 'contribuir' | 'lembrete' | 'compartilhar'
  const caixaMenu = useRef(null);

  useEffect(() => { setMenu(false); setJanela(''); }, [pathname]);

  // Convite aberto sem login: guarda o endereço e volta para ele depois de entrar com Google.
  const DESTINO = 'sonhario:depois-de-entrar';
  useEffect(() => {
    if (!pronto) return;
    if (!usuario && temLogin && pathname.startsWith('/app/compartilhados')) sessionStorage.setItem(DESTINO, pathname);
    if (usuario) {
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
          {compartilhamentos.comigo.length > 0 && <NavLink to="/app/compartilhados" aria-label={rotuloAba(compartilhamentos.comigo)} className={aba}><Pessoas size={16} /> <span className="esconde-celular">{rotuloAba(compartilhamentos.comigo)}</span></NavLink>}
        </nav>
        <div ref={caixaMenu} style={{ position: 'relative' }}>
          <button type="button" className="btn-icone" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu" aria-label="Mais opções"><Pontos /></button>
          {menu && (
            <div className="menu" role="menu">
              <Link role="menuitem" className="menu-item" to="/app/importar"><Importar size={18} /> Importar sonhos</Link>
              <Link role="menuitem" className="menu-item" to="/" state={{ ficar: true }}><Voltar size={18} /> Página inicial</Link>
              {temLogin && <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('compartilhar')}><Pessoas size={18} /> Compartilhar com terapeuta ou amigos</button>}
              {temLogin && usuario && compartilhamentos.comigo.length === 0 && <Link role="menuitem" className="menu-item" to="/app/compartilhados"><Pessoas size={18} /> Compartilhados comigo</Link>}
              <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('lembrete')}><Sino size={18} /> Lembrete da manhã</button>
              <button role="menuitem" type="button" className="menu-item" onClick={() => abrir('contribuir')}><Mensagem size={18} /> Contribuir com uma ideia</button>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '6px 4px' }} />
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
