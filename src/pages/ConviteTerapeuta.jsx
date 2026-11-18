// Convites para o Sonhário, todos em /terapeuta/:token e todos sem mostrar nenhum sonho:
// - tipo "terapeuta": quem atende convida pacientes; quem entra fica com essa pessoa como terapeuta.
// - tipo "paciente": quem registra convida o próprio terapeuta; quem entra passa a ser o terapeuta.
// - tipo "amigo": quem entra e quem convidou passam a aparecer um para o outro em Pessoas com acesso.
// Antes de entrar, dá para ver os recursos num tour com sonhos de exemplo.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { verConviteTerapeuta, aceitarConviteTerapeuta, convitePendente } from '../lib/compartilhar.js';
import Logo from '../components/Logo.jsx';
import Avatar from '../components/Avatar.jsx';
import Assinatura from '../components/Assinatura.jsx';
import Tour from '../components/Tour.jsx';
import { semViuvas } from '../lib/tipografia.js';

const texto = { margin: 0, color: 'var(--muted)', lineHeight: 1.6 };

// O que cada convite diz. n: nome de quem convidou; p: primeiro nome.
const TEXTOS = {
  terapeuta: {
    quem: 'paciente',
    rotulo: 'Convite de terapeuta',
    titulo: (n) => `${n} convidou você para registrar seus sonhos no Sonhário`,
    corpo: (p) => `Entre com a sua conta Google. ${p} passa a aparecer como terapeuta no seu Sonhário, mas não vê nenhum sonho: você escolhe, um por vez, o que mostrar. É de graça.`,
    pronto: (p, ja) => ja ? `${p} já está no seu Sonhário` : `Pronto: ${p} está no seu Sonhário como terapeuta`,
    depois: (p) => `Nenhum sonho foi compartilhado. ${p} só vê o que você escolher mostrar, um sonho por vez: pelo botão Compartilhar dentro do sonho, ou marcando “Levar para a próxima sessão”.`,
    desfazer: 'Para desfazer a ligação, é só ir em ⋯ › Pessoas com acesso.',
    abrir: 'Abrir o meu Sonhário',
  },
  paciente: {
    quem: 'terapeuta',
    rotulo: 'Convite de paciente',
    titulo: (n) => `${n} convidou você para acompanhar os sonhos no Sonhário`,
    corpo: (p) => `Entre com a sua conta Google. Você passa a aparecer como terapeuta de ${p}, e os sonhos que ${p} escolher mostrar aparecem na sua aba Pacientes. Você também pode registrar os seus. É de graça.`,
    pronto: (p, ja) => ja ? `Você já é terapeuta de ${p} no Sonhário` : `Pronto: você é terapeuta de ${p} no Sonhário`,
    depois: (p) => `${p} ainda escolhe, um por vez, os sonhos que quer mostrar. Quando marcar um para a próxima sessão, ele aparece na aba Pacientes.`,
    desfazer: 'Para convidar outros pacientes, use o link da aba Pacientes.',
    abrir: 'Abrir a aba Pacientes',
    destino: '/app/compartilhados',
  },
  amigo: {
    quem: 'amigo',
    rotulo: 'Convite',
    titulo: (n) => `${n} convidou você para registrar seus sonhos no Sonhário`,
    corpo: (p) => `Entre com a sua conta Google. Você e ${p} passam a aparecer um para o outro na hora de compartilhar, mas ninguém vê nenhum sonho: cada um escolhe, um por vez, o que mostrar. É de graça.`,
    pronto: (p, ja) => ja ? `Você e ${p} já estão ligados no Sonhário` : `Pronto: você e ${p} estão ligados no Sonhário`,
    depois: () => 'Nenhum sonho foi compartilhado. Para mostrar um, use o botão Compartilhar dentro do sonho.',
    desfazer: 'Para desfazer a ligação, é só ir em ⋯ › Pessoas com acesso.',
    abrir: 'Abrir o meu Sonhário',
  },
};

export default function ConviteTerapeuta() {
  const { token } = useParams();
  const { pronto, usuario, temLogin, entrar, recarregarCompartilhamentos, recarregarModo } = useEstado();
  const [convite, setConvite] = useState(undefined); // undefined: carregando; null: não existe
  const [aceito, setAceito] = useState(null);
  const [erro, setErro] = useState('');
  const [tour, setTour] = useState(false);

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

  const t = TEXTOS[convite?.tipo] || TEXTOS.terapeuta;
  const nome = convite?.dono_nome || 'Alguém';
  const primeiro = nome.split(' ')[0];
  const entrarAgora = () => { convitePendente.guardar('/terapeuta/' + token); entrar(); };

  let corpo;
  if (aceito) {
    corpo = (
      <>
        <Avatar nome={nome} foto={convite.dono_foto} size={72} />
        <h1 className="titulo-m">{semViuvas(t.pronto(primeiro, aceito.ja_estava))}</h1>
        <p style={texto}>{semViuvas(t.depois(primeiro))}</p>
        <Link className="btn btn-preto btn-grande" to={t.destino || '/app'}>{t.abrir}</Link>
        <p style={{ ...texto, fontSize: 13 }}>{semViuvas(t.desfazer)}</p>
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
        <span className="rotulo">{t.rotulo}</span>
        <h1 className="titulo-m">{semViuvas(t.titulo(nome))}</h1>
        <p style={texto}>{semViuvas(t.corpo(primeiro))}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="btn btn-preto btn-grande" onClick={entrarAgora}>Entrar com Google</button>
          <button type="button" className="btn btn-linha btn-grande" onClick={() => setTour(true)}>Ver os recursos</button>
        </div>
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
      {tour && <Tour quem={t.quem} aoFechar={() => setTour(false)} aoEntrar={entrarAgora} />}
    </div>
  );
}
