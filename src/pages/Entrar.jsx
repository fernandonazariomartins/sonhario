import { useEstado } from '../lib/estado.jsx';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { tr } from '../lib/i18n.js';

const G = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function Entrar() {
  const { entrar, pularLogin } = useEstado();
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <div><Logo /></div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="rotulo">{tr("Caderno de sonhos")}</span>
          <h1 className="titulo-m">{semViuvas(tr("Entre para guardar seus sonhos em qualquer aparelho."))}</h1>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(tr("Com a conta, os sonhos e os áudios ficam salvos e aparecem no celular e no computador. Tudo vai trancado com uma frase-senha que só você sabe."))}</p>
          <button className="btn btn-preto btn-grande" onClick={entrar} style={{ marginTop: 8 }}><span style={{ background: '#fff', borderRadius: 6, width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><G /></span>{tr(" Entrar com Google")}</button>
          <button className="btn btn-linha btn-grande" onClick={pularLogin}>{tr("Continuar sem conta")}</button>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas(tr("Sem conta, tudo fica só neste aparelho. Quando você entrar depois, os sonhos vão junto para a conta."))}</p>
        </div>
      </div>
      <Assinatura />
    </div>
  );
}
