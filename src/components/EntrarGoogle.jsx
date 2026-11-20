import { useEffect, useRef, useState } from 'react';
import Janela from './Janela.jsx';
import { desenharBotaoGoogle } from '../lib/googleLogin.js';
import { semViuvas } from '../lib/tipografia.js';
import { tr } from '../lib/i18n.js';

// Janela com o botão oficial do Google. Abre quando alguém toca em "Entrar com Google".
export default function EntrarGoogle({ aoFechar, aoEntrar, aoFalhar }) {
  const lugar = useRef(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    desenharBotaoGoogle(lugar.current, {
      aoEntrar: () => vivo && aoEntrar(),
      aoErro: (e) => vivo && setErro(e.message),
    }).catch(() => vivo && aoFalhar());
    return () => { vivo = false; };
  }, [aoEntrar, aoFalhar]);

  return (
    <Janela titulo={tr("Entrar no Sonhário")} aoFechar={aoFechar}>
      <p style={{ margin: '12px 0 20px', color: 'var(--muted)', lineHeight: 1.6 }}>
        {semViuvas(tr("Use a sua conta Google. O Sonhário recebe só o seu nome, o e-mail e a foto."))}
      </p>
      <div ref={lugar} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
      {erro && <p role="alert" style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--erro, #b3261e)' }}>{semViuvas(tr("Não deu para entrar: ") + erro)}</p>}
    </Janela>
  );
}
