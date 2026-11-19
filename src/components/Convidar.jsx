// Botões de convite para o Sonhário. Nenhum deles mostra sonhos: só liga as pessoas.
// tipo "terapeuta": quem atende convida pacientes (link fixo para todos).
// tipo "paciente": quem registra convida o próprio terapeuta (vale uma vez).
// tipo "amigo": convida um amigo (link fixo, pode ir para várias pessoas).
import { useEffect, useState } from 'react';
import { useEstado } from '../lib/estado.jsx';
import { meuLinkConvite, linkConviteExiste, mandarConvite, erroConvite } from '../lib/compartilhar.js';
import { semViuvas } from '../lib/tipografia.js';
import { Copiar, Link as IconeLink, Pessoas } from './Icones.jsx';

export const ROTULOS_CONVITE = {
  terapeuta: 'Convidar meu paciente para o Sonhário',
  paciente: 'Convidar meu terapeuta para o Sonhário',
  amigo: 'Convidar um amigo para o Sonhário',
};

// Um botão: cria o link (ou usa o que já existe) e abre o compartilhar do celular.
export function BotaoConvite({ tipo, className = 'btn btn-linha', style, children }) {
  const { usuario, avisar } = useEstado();
  const [ocupado, setOcupado] = useState(false);
  if (!usuario) return null;
  async function convidar() {
    setOcupado(true);
    try { await mandarConvite(await meuLinkConvite(usuario, tipo), tipo, avisar); } catch (e) { avisar(erroConvite(e)); }
    setOcupado(false);
  }
  return (
    <button type="button" className={className} style={style} onClick={convidar} disabled={ocupado}>
      {children || <><Pessoas size={16} /> {ROTULOS_CONVITE[tipo]}</>}
    </button>
  );
}

// Aba Pacientes: o link fixo, com copiar e trocar.
export function ConvidarPacientes() {
  const { usuario, avisar } = useEstado();
  const [url, setUrl] = useState(undefined); // undefined: carregando; '': ainda não criou
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let vivo = true;
    linkConviteExiste(usuario, 'terapeuta').then((u) => vivo && setUrl(u)).catch(() => vivo && setUrl(''));
    return () => { vivo = false; };
  }, [usuario]);

  async function gerar(trocar = false) {
    if (trocar && !confirm('Trocar o link? O link atual para de funcionar. Quem já entrou por ele continua com você.')) return;
    setOcupado(true);
    try {
      const u = await meuLinkConvite(usuario, 'terapeuta', { trocar });
      setUrl(u);
      if (trocar) avisar('Link trocado. O antigo não funciona mais.');
      else mandarConvite(u, 'terapeuta', avisar);
    } catch (e) { avisar(erroConvite(e)); }
    setOcupado(false);
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(url); avisar('Link copiado'); } catch { prompt('Copie o link:', url); }
  }

  return (
    <section aria-label="Convidar pacientes" className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <strong style={{ fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconeLink size={18} /> {ROTULOS_CONVITE.terapeuta}</strong>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.55, maxWidth: 620 }}>{semViuvas('Um link só, para mandar a todos os pacientes. Quem entra por ele com a conta Google aparece aqui. Você não vê nenhum sonho até a pessoa escolher mostrar, um por vez. Antes de entrar, o paciente pode ver os recursos do app com sonhos de exemplo.')}</p>
      {url === undefined ? <span style={{ fontSize: 14, color: 'var(--muted)' }}>Carregando…</span>
        : url ? (
          <>
            <div style={{ display: 'flex', gap: 8, maxWidth: 620 }}>
              <input className="campo" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Link de convite para pacientes" style={{ fontSize: 13 }} />
              <button type="button" className="btn btn-linha" onClick={copiar}><Copiar size={16} /> Copiar</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <button type="button" className="btn btn-azul" onClick={() => mandarConvite(url, 'terapeuta', avisar)}>Mandar</button>
              <button type="button" onClick={() => gerar(true)} disabled={ocupado} style={{ border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: '8px 4px' }}>Trocar o link</button>
            </div>
          </>
        ) : <button type="button" className="btn btn-azul" style={{ alignSelf: 'flex-start' }} onClick={() => gerar(false)} disabled={ocupado}><IconeLink size={16} /> {ocupado ? 'Criando…' : ROTULOS_CONVITE.terapeuta}</button>}
    </section>
  );
}
