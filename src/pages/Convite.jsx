// Quem recebeu um link de convite: entra com Google e já cai no sonho compartilhado.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { verConvite, aceitarConvite, convitePendente } from '../lib/compartilhar.js';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { semViuvas } from '../lib/tipografia.js';

export default function Convite() {
  const { token } = useParams();
  const navegar = useNavigate();
  const { pronto, usuario, temLogin, entrar, recarregarCompartilhamentos } = useEstado();
  const [convite, setConvite] = useState(undefined); // undefined: carregando; null: não existe
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!temLogin) { setConvite(null); return; }
    verConvite(token).then(setConvite).catch(() => setConvite(null));
  }, [token, temLogin]);

  // Já com a conta: aceita e vai direto para o sonho.
  useEffect(() => {
    if (!pronto || !usuario || !convite) return;
    let vivo = true;
    aceitarConvite(token)
      .then(async (r) => {
        await recarregarCompartilhamentos();
        if (vivo) navegar('/app/compartilhados/' + r.dono + (r.sonho ? '/' + r.sonho : ''), { replace: true });
      })
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [pronto, usuario, convite, token, navegar, recarregarCompartilhamentos]);

  const nome = convite?.dono_nome || 'Alguém';
  let corpo;
  if (convite === undefined || (usuario && convite && !erro)) {
    corpo = <p style={{ color: 'var(--muted)' }}>Abrindo o convite…</p>;
  } else if (!convite) {
    corpo = (
      <>
        <h1 className="titulo-m">{semViuvas('Esse link não existe mais')}</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Peça para a pessoa gerar um novo link no Sonhário.')}</p>
        <Link className="btn btn-linha btn-grande" to="/">Conhecer o Sonhário</Link>
      </>
    );
  } else if (erro) {
    corpo = (
      <>
        <h1 className="titulo-m">{semViuvas('Não deu para abrir')}</h1>
        <div className="aviso">{semViuvas(erro)}</div>
        <Link className="btn btn-linha btn-grande" to="/app">Ir para o meu Sonhário</Link>
      </>
    );
  } else {
    corpo = (
      <>
        <Avatar nome={nome} foto={convite.dono_foto} size={72} />
        <h1 className="titulo-m">{semViuvas(`${nome} compartilhou ${convite.de_um_sonho ? 'um sonho' : 'os sonhos'} com você`)}</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Entre com a sua conta Google para ver. É de graça, e você também ganha um caderno para anotar os seus sonhos, se quiser.')}</p>
        <button type="button" className="btn btn-preto btn-grande" onClick={() => { convitePendente.guardar(token); entrar(); }}>Entrar com Google e ver</button>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas('Você só lê: o sonho continua sendo de quem compartilhou.')}</p>
      </>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <div><Logo /></div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>{corpo}</div>
      </div>
      <Assinatura />
    </div>
  );
}
