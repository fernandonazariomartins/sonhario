import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import Entrar from './Entrar.jsx';
import { Mic, Mural, Importar, Sair } from '../components/Icones.jsx';

export default function AppLayout() {
  const { pronto, usuario, semConta, temLogin, aviso, sair, entrar } = useEstado();
  const { pathname } = useLocation();

  if (!pronto) return <div style={{ padding: 40, color: 'var(--muted)' }}>Carregando…</div>;
  // Como no Torvilo: com o Supabase configurado, pede o login (ou "continuar sem conta") antes de abrir.
  if (temLogin && !usuario && !semConta) return <Entrar />;

  const naCaptura = pathname === '/app' || pathname === '/app/';
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header className="topo">
        <Logo para="/app" />
        <nav aria-label="Seções do app" className="abas" style={{ marginLeft: 'auto' }}>
          <NavLink to="/app" end aria-label="Registrar sonho" className={({ isActive }) => 'aba' + (isActive ? ' ativa' : '')}><Mic size={16} /> <span className="esconde-celular">Registrar</span></NavLink>
          <NavLink to="/app/acervo" className={({ isActive }) => 'aba' + (isActive || pathname.startsWith('/app/sonho') ? ' ativa' : '')}><Mural size={16} /> Acervo</NavLink>
          <NavLink to="/app/importar" aria-label="Importar sonhos" className={({ isActive }) => 'aba' + (isActive ? ' ativa' : '')}><Importar size={16} /> <span className="esconde-celular">Importar</span></NavLink>
        </nav>
        {usuario ? (
          <button className="btn-icone" onClick={sair} title={'Sair (' + (usuario.email || '') + ')'} aria-label="Sair da conta"><Sair size={18} /></button>
        ) : temLogin ? (
          <button className="btn btn-linha" onClick={entrar}>Entrar com Google</button>
        ) : null}
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      {!naCaptura && <footer style={{ padding: '0 20px 28px' }}><Assinatura /></footer>}
      {aviso && <div className="toast" role="status">{aviso}</div>}
    </div>
  );
}
