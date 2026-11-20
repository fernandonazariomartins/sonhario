import { useState } from 'react';
import Janela from './Janela.jsx';
import { useEstado } from '../lib/estado.jsx';
import { lembreteDisponivel, lembreteSalvo, ativarLembrete, desativarLembrete, ehIphone, instalado } from '../lib/lembrete.js';
import { semViuvas } from '../lib/tipografia.js';
import { Sino } from './Icones.jsx';
import { tr } from '../lib/i18n.js';

export default function Lembrete({ aoFechar }) {
  const { usuario, entrar, avisar } = useEstado();
  const salvo = lembreteSalvo();
  const [hora, setHora] = useState(salvo.hora);
  const [ativo, setAtivo] = useState(salvo.ativo);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function ligar() {
    setOcupado(true); setErro('');
    try { await ativarLembrete(hora); setAtivo(true); avisar(tr("Lembrete marcado para ") + hora); aoFechar(); }
    catch (e) { setErro(e.message); }
    setOcupado(false);
  }
  async function desligar() {
    setOcupado(true);
    try { await desativarLembrete(); setAtivo(false); avisar(tr("Lembrete desligado")); } catch (e) { setErro(e.message); }
    setOcupado(false);
  }

  const exemplo = (
    <div style={{ background: 'var(--cinza)', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--azul)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Sino size={18} /></span>
      <span style={{ fontSize: 14, lineHeight: 1.4 }}><strong>{tr("Sonhou? Registre.")}</strong><br /><span style={{ color: 'var(--muted)' }}>{tr("Toque e fale antes que a imagem vá embora.")}</span></span>
    </div>
  );

  let corpo;
  if (!lembreteDisponivel()) {
    corpo = <div className="aviso">{semViuvas(tr("O lembrete funciona no Sonhário instalado no celular. Enquanto isso, crie um alarme no relógio do celular com o nome “Sonhou? Registre”."))}</div>;
  } else if (ehIphone() && !instalado()) {
    corpo = <div className="aviso">{semViuvas(tr("No iPhone, as notificações só funcionam com o Sonhário na tela inicial. No Safari, toque em Compartilhar › Adicionar à Tela de Início e abra por lá."))}</div>;
  } else if (!usuario) {
    corpo = (
      <>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas(tr("Para o lembrete chegar todo dia, entre com a sua conta Google."))}</p>
        <button type="button" className="btn btn-azul btn-grande" onClick={entrar}>{tr("Entrar com Google")}</button>
      </>
    );
  } else {
    corpo = (
      <>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 15, fontWeight: 700 }}>
          {tr("Que horas você acorda?")}
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ height: 48, padding: '0 12px', border: '1px solid var(--line-strong)', borderRadius: 10, fontSize: 18, fontWeight: 700 }} />
        </label>
        {erro && <div className="aviso">{erro}</div>}
        <button type="button" className="btn btn-azul btn-grande" onClick={ligar} disabled={ocupado}>{ativo ? tr("Mudar o horário") : tr("Ligar o lembrete")}</button>
        {ativo && <button type="button" className="btn btn-linha" onClick={desligar} disabled={ocupado}>{tr("Desligar o lembrete")}</button>}
      </>
    );
  }

  return (
    <Janela titulo={tr("Lembrete da manhã")} aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas(tr("Uma notificação na hora em que você acorda, todos os dias. Tocou, abriu: o app já está pronto para gravar."))}</p>
      {exemplo}
      {corpo}
    </Janela>
  );
}
