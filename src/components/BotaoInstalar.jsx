import { useState } from 'react';
import Janela from './Janela.jsx';
import { Celular, Ok } from './Icones.jsx';
import { useInstalar, ehAndroid, ehCelular } from '../lib/instalar.js';
import { ehIphone } from '../lib/lembrete.js';
import { semViuvas as n } from '../lib/tipografia.js';
import { tr } from '../lib/i18n.js';

// Navegador embutido de Instagram, Facebook, TikTok etc.: dali não dá para instalar.
const navegadorDeApp = () => /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Twitter/i.test(navigator.userAgent);

function Passos() {
  if (navegadorDeApp()) {
    return (
      <>
        <p className="instalar-p">{n(tr("Você abriu o link dentro de outro app (Instagram, por exemplo), e por ali não dá para instalar."))}</p>
        <ol className="instalar-passos">
          <li>{n(tr("Toque nos três pontinhos no canto da tela."))}</li>
          <li>{n(ehIphone() ? tr("Escolha “Abrir no navegador externo” (ou no Safari).") : tr("Escolha “Abrir no Chrome” (ou no navegador)."))}</li>
          <li>{n(tr("Lá, toque de novo em “Instalar no celular”."))}</li>
        </ol>
      </>
    );
  }
  if (ehIphone()) {
    return (
      <ol className="instalar-passos">
        <li>{n(tr("Abra este site no Safari."))}</li>
        <li>{n(tr("Toque no botão de compartilhar (o quadrado com a seta para cima)."))}</li>
        <li>{n(tr("Escolha “Adicionar à Tela de Início” e toque em Adicionar."))}</li>
      </ol>
    );
  }
  if (ehAndroid()) {
    return (
      <ol className="instalar-passos">
        <li>{n(tr("Toque nos três pontinhos no canto de cima do Chrome."))}</li>
        <li>{n(tr("Escolha “Instalar app” ou “Adicionar à tela inicial”."))}</li>
        <li>{n(tr("Confirme. O ícone do Sonhário aparece junto dos outros apps."))}</li>
      </ol>
    );
  }
  return (
    <>
      <p className="instalar-p">{n(tr("No computador, use o Chrome ou o Edge: clique no ícone de instalar, no fim da barra de endereço."))}</p>
      <p className="instalar-p">{n(tr("Para o celular, abra sonhario-flame.vercel.app no navegador do celular e toque em “Instalar no celular”."))}</p>
    </>
  );
}

export default function BotaoInstalar({ className = 'btn btn-azul', style, size = 16, children = tr("Instalar no celular") }) {
  const { instalado, acabouDeInstalar, podeInstalar, instalar } = useInstalar();
  const [janela, setJanela] = useState(''); // 'passos' | 'pronto'
  if (instalado) return null;

  async function clicar() {
    if (acabouDeInstalar) { setJanela('pronto'); return; }
    if (podeInstalar) {
      const r = await instalar();
      if (r === 'accepted') setJanela('pronto');
      return;
    }
    setJanela('passos');
  }

  return (
    <>
      <button type="button" className={className} style={style} onClick={clicar}>
        {acabouDeInstalar ? <><Ok size={size} />{tr(" App instalado")}</> : <><Celular size={size} /> {children}</>}
      </button>
      {janela === 'passos' && (
        <Janela titulo={ehCelular() || navegadorDeApp() ? tr("Instalar no celular") : tr("Instalar o Sonhário")} aoFechar={() => setJanela('')}>
          <Passos />
          <p className="instalar-p" style={{ color: 'var(--muted)', fontSize: 14 }}>{n(tr("Não precisa registrar nenhum sonho para instalar. Depois, é só abrir pelo ícone."))}</p>
        </Janela>
      )}
      {janela === 'pronto' && (
        <Janela titulo={tr("Pronto, instalado")} aoFechar={() => setJanela('')}>
          <p className="instalar-p">{n(tr("O ícone do Sonhário está na tela inicial do seu celular. Abra por ele: o app já abre no gravador, pronto para quando você acordar."))}</p>
          <p className="instalar-p" style={{ color: 'var(--muted)', fontSize: 14 }}>{n(tr("Pode fechar esta página."))}</p>
        </Janela>
      )}
    </>
  );
}
