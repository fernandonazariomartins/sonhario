// Link de convite de quem atende: o paciente entra com Google e fica ligado a quem convidou.
// Ficar ligado não mostra nenhum sonho: o paciente escolhe, um por vez, o que mostrar.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { verConviteTerapeuta, aceitarConviteTerapeuta, convitePendente } from '../lib/compartilhar.js';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { semViuvas } from '../lib/tipografia.js';

const texto = { margin: 0, color: 'var(--muted)', lineHeight: 1.6 };

export default function ConviteTerapeuta() {
  const { token } = useParams();
  const { pronto, usuario, temLogin, entrar, recarregarCompartilhamentos, recarregarModo } = useEstado();
  const [convite, setConvite] = useState(undefined); // undefined: carregando; null: não existe
  const [aceito, setAceito] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!temLogin) { setConvite(null); return; }
    verConviteTerapeuta(token).then(setConvite).catch(() => setConvite(null));
  }, [token, temLogin]);

  // Já com a conta: aceita na hora.
  useEffect(() => {
    if (!pronto || !usuario || !convite) return;
    let vivo = true;
    aceitarConviteTerapeuta(token)
      .then(async (r) => {
        convitePendente.pegar(); // já usado: não volta para cá depois
        await Promise.all([recarregarCompartilhamentos(), recarregarModo()]);
        if (vivo) setAceito(r || {});
      })
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [pronto, usuario, convite, token, recarregarCompartilhamentos, recarregarModo]);

  const nome = convite?.dono_nome || 'Alguém';
  const primeiro = nome.split(' ')[0];
  let corpo;
  if (aceito) {
    corpo = (
      <>
        <Avatar nome={nome} foto={convite.dono_foto} size={72} />
        <h1 className="titulo-m">{semViuvas(aceito.ja_estava ? `${primeiro} já está no seu Sonhário` : `Pronto: ${primeiro} está no seu Sonhário como terapeuta`)}</h1>
        <p style={texto}>{semViuvas(`Nenhum sonho foi compartilhado. ${primeiro} só vê o que você escolher mostrar, um sonho por vez: pelo botão Compartilhar dentro do sonho, ou marcando “Levar para a próxima sessão”.`)}</p>
        <Link className="btn btn-preto btn-grande" to="/app">Abrir o meu Sonhário</Link>
        <p style={{ ...texto, fontSize: 13 }}>{semViuvas('Para desfazer a ligação, é só ir em ⋯ › Pessoas com acesso.')}</p>
      </>
    );
  } else if (convite === undefined || (usuario && convite && !erro)) {
    corpo = <p style={{ color: 'var(--muted)' }}>Abrindo o convite…</p>;
  } else if (!convite) {
    corpo = (
      <>
        <h1 className="titulo-m">{semViuvas('Esse link não existe mais')}</h1>
        <p style={texto}>{semViuvas('Peça um link novo para quem te convidou.')}</p>
        <Link className="btn btn-linha btn-grande" to="/">Conhecer o Sonhário</Link>
      </>
    );
  } else if (erro) {
    corpo = (
      <>
        <h1 className="titulo-m">{semViuvas('Não deu para aceitar o convite')}</h1>
        <div className="aviso">{semViuvas(erro)}</div>
        <Link className="btn btn-linha btn-grande" to="/app">Ir para o meu Sonhário</Link>
      </>
    );
  } else {
    corpo = (
      <>
        <Avatar nome={nome} foto={convite.dono_foto} size={72} />
        <span className="rotulo">Convite de terapeuta</span>
        <h1 className="titulo-m">{semViuvas(`${nome} convidou você para registrar seus sonhos no Sonhário`)}</h1>
        <p style={texto}>{semViuvas(`Entre com a sua conta Google. ${primeiro} passa a aparecer como terapeuta no seu Sonhário, mas não vê nenhum sonho: você escolhe, um por vez, o que mostrar. É de graça.`)}</p>
        <button type="button" className="btn btn-preto btn-grande" onClick={() => { convitePendente.guardar('/terapeuta/' + token); entrar(); }}>Entrar com Google</button>
        <p style={{ ...texto, fontSize: 13 }}>{semViuvas('Seus sonhos são seus. Dá para desfazer a ligação quando quiser.')}</p>
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
