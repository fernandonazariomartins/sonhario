// Quem recebeu um link de convite: entra com Google e já cai no sonho compartilhado.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { verConvite, aceitarConvite, convitePendente, chaveDoLinkAberto } from '../lib/compartilhar.js';
import { guardarChaveDeLink, subirChavesDeLinks } from '../lib/cofre.js';
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
  const [esperando, setEsperando] = useState(false);

  // A chave do sonho vem depois do "#": guarda (o login do Google apaga o "#") e tira do endereço.
  const [chaveLink] = useState(() => {
    const k = new URLSearchParams(location.hash.slice(1)).get('k');
    if (k) { chaveDoLinkAberto.guardar(token, k); history.replaceState(history.state, '', location.pathname + location.search); }
    return k || chaveDoLinkAberto.pegar(token);
  });

  useEffect(() => {
    if (!temLogin) { setConvite(null); return; }
    verConvite(token, chaveLink).then(setConvite).catch(() => setConvite(null));
  }, [token, temLogin, chaveLink]);

  // Já com a conta: aceita e vai direto para o sonho.
  useEffect(() => {
    if (!pronto || !usuario || !convite) return;
    let vivo = true;
    aceitarConvite(token)
      .then(async (r) => {
        // A chave do link fica com a pessoa: embrulhada com a chave dela, ou guardada até ela criar a frase-senha.
        if (chaveLink && r.sonho) {
          guardarChaveDeLink(r.sonho, chaveLink);
          chaveDoLinkAberto.tirar(token);
          await subirChavesDeLinks().catch(() => {});
        }
        await recarregarCompartilhamentos();
        if (!vivo) return;
        if (r.pendente) { setEsperando(true); return; }
        navegar('/app/compartilhados/' + r.dono + (r.sonho ? '/' + r.sonho : ''), { replace: true });
      })
      .catch((e) => vivo && setErro(e.message));
    return () => { vivo = false; };
  }, [pronto, usuario, convite, token, navegar, recarregarCompartilhamentos, chaveLink]);

  const nome = convite?.dono_nome || 'Alguém';
  let corpo;
  if (esperando) {
    corpo = (
      <>
        <Avatar nome={nome} foto={convite.dono_foto} size={72} />
        <h1 className="titulo-m">{semViuvas('Pedido enviado')}</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(`Assim que ${nome.split(' ')[0]} aprovar, o sonho aparece no seu Sonhário, em Compartilhados.`)}</p>
        <Link className="btn btn-preto btn-grande" to="/app">Abrir o meu Sonhário</Link>
      </>
    );
  } else if (convite === undefined || (usuario && convite && !erro)) {
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
        <h1 className="titulo-m">{semViuvas(`${nome} quer te mostrar um sonho`)}</h1>
        {convite.sonho_trecho?.trim() && (
          <figure className="trecho-convite" aria-label="Começo do sonho">
            {convite.sonho_titulo?.trim() && <strong>{semViuvas(convite.sonho_titulo)}</strong>}
            <p>{semViuvas(convite.sonho_trecho)}</p>
            <span className="trecho-veu" aria-hidden="true" />
          </figure>
        )}
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(convite.aprovar === false
          ? 'Entre com a sua conta Google para ver este sonho, e só ele. É de graça. Na primeira vez, você cria uma frase-senha: o sonho vem trancado e só abre com ela.'
          : `Entre com a sua conta Google para pedir acesso. Quando ${nome.split(' ')[0]} aprovar, você vê este sonho, e só ele. É de graça. Na primeira vez, você cria uma frase-senha: o sonho vem trancado e só abre com ela.`)}</p>
        <button type="button" className="btn btn-preto btn-grande" onClick={() => { convitePendente.guardar(token); entrar(); }}>Entrar com Google</button>
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
