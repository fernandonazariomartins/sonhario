import { useState } from 'react';
import Janela from './Janela.jsx';
import { useEstado } from '../lib/estado.jsx';
import { PAPEIS, ESCOPOS, convidar, mudarCompartilhamento, desfazer, textoConvite } from '../lib/compartilhar.js';
import { semViuvas } from '../lib/tipografia.js';
import { Copiar, Lixo, Mais } from './Icones.jsx';

function Opcoes({ valor, opcoes, aoMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="abas" style={{ flexWrap: 'wrap' }}>
      {Object.entries(opcoes).map(([k, r]) => (
        <button key={k} type="button" role="radio" aria-checked={valor === k} className={'aba' + (valor === k ? ' ativa' : '')} onClick={() => aoMudar(k)}>{r}</button>
      ))}
    </div>
  );
}

async function enviarConvite(c, avisar) {
  const texto = textoConvite(c);
  try {
    if (navigator.share) { await navigator.share({ text: texto }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(texto); avisar('Convite copiado. Cole no WhatsApp ou no e-mail.'); }
  catch { prompt('Copie o convite:', texto); }
}

export default function Compartilhar({ aoFechar }) {
  const { usuario, entrar, avisar, compartilhamentos, recarregarCompartilhamentos } = useEstado();
  const [form, setForm] = useState({ email: '', nome: '', papel: 'terapeuta', escopo: 'escolhidos', ver_amplificacoes: false });
  const [abrindo, setAbrindo] = useState(compartilhamentos.meus.length === 0);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const campo = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (!usuario) {
    return (
      <Janela titulo="Compartilhar sonhos" aoFechar={aoFechar}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Para mostrar seus sonhos ao seu terapeuta ou a amigos, entre com a sua conta Google. Sem conta, os sonhos ficam só neste aparelho.')}</p>
        <button type="button" className="btn btn-azul btn-grande" onClick={entrar}>Entrar com Google</button>
      </Janela>
    );
  }

  async function enviar(e) {
    e.preventDefault();
    setOcupado(true); setErro('');
    try {
      const c = await convidar(usuario, form);
      await recarregarCompartilhamentos();
      setForm({ email: '', nome: '', papel: 'terapeuta', escopo: 'escolhidos', ver_amplificacoes: false });
      setAbrindo(false);
      avisar('Acesso liberado para ' + (c.convidado_nome || c.convidado_email));
      enviarConvite(c, avisar);
    } catch (e2) { setErro(e2.message); }
    setOcupado(false);
  }
  async function mudar(c, parcial) {
    try { await mudarCompartilhamento(c.id, parcial); await recarregarCompartilhamentos(); } catch (e) { avisar('Não deu para mudar: ' + e.message); }
  }
  async function tirar(c) {
    if (!confirm(`Tirar o acesso de ${c.convidado_nome || c.convidado_email}? A pessoa deixa de ver seus sonhos na hora.`)) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); avisar('Acesso retirado'); } catch (e) { avisar('Não deu para tirar: ' + e.message); }
  }

  return (
    <Janela titulo="Compartilhar sonhos" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('A pessoa entra no Sonhário com a conta Google dela e encontra seus sonhos numa aba própria. Ela só lê: não edita, não apaga.')}</p>

      {compartilhamentos.meus.map((c) => (
        <div key={c.id} className="painel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ marginRight: 'auto', minWidth: 0 }}>
              <strong style={{ fontSize: 15 }}>{c.convidado_nome || c.convidado_email}</strong>
              <div style={{ fontSize: 13, color: 'var(--muted)', overflowWrap: 'anywhere' }}>{PAPEIS[c.papel].rotulo}{c.convidado_nome ? ' · ' + c.convidado_email : ''}</div>
            </div>
            <button type="button" className="btn-icone" style={{ width: 36, height: 36 }} onClick={() => enviarConvite(c, avisar)} aria-label={'Mandar o convite de novo para ' + c.convidado_email} title="Mandar o convite"><Copiar size={16} /></button>
            <button type="button" className="btn-icone" style={{ width: 36, height: 36, color: 'var(--danger)' }} onClick={() => tirar(c)} aria-label={'Tirar o acesso de ' + c.convidado_email} title="Tirar o acesso"><Lixo size={16} /></button>
          </div>
          <Opcoes rotulo="O que pode ver" valor={c.escopo} opcoes={ESCOPOS} aoMudar={(v) => mudar(c, { escopo: v })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={c.ver_amplificacoes} onChange={(e) => mudar(c, { ver_amplificacoes: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
            Mostrar as amplificações
          </label>
        </div>
      ))}

      {abrindo ? (
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: compartilhamentos.meus.length ? '1px solid var(--line)' : 0, paddingTop: compartilhamentos.meus.length ? 14 : 0 }}>
          <span className="rotulo">Quem é</span>
          <Opcoes rotulo="Quem é" valor={form.papel} opcoes={{ terapeuta: 'Meu terapeuta', amigo: 'Amigo ou amiga' }} aoMudar={campo('papel')} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
            E-mail da conta Google
            <input className="campo" type="email" required value={form.email} onChange={(e) => campo('email')(e.target.value)} placeholder="nome@gmail.com" autoComplete="off" style={{ fontWeight: 400, fontSize: 16 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
            Nome <span style={{ fontWeight: 400, color: 'var(--muted)', marginTop: -4 }}>opcional, só para você reconhecer</span>
            <input className="campo" value={form.nome} onChange={(e) => campo('nome')(e.target.value)} placeholder={form.papel === 'terapeuta' ? 'Ex.: Dra. Ana' : 'Ex.: Júlia'} style={{ fontWeight: 400, fontSize: 16 }} />
          </label>
          <span className="rotulo">O que pode ver</span>
          <Opcoes rotulo="O que pode ver" valor={form.escopo} opcoes={ESCOPOS} aoMudar={campo('escopo')} />
          {form.escopo === 'escolhidos' && <p style={{ margin: '-4px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas('Em cada sonho aparece a opção “Compartilhar este sonho”.')}</p>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.ver_amplificacoes} onChange={(e) => campo('ver_amplificacoes')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
            Mostrar também as amplificações
          </label>
          {erro && <div className="aviso">{erro}</div>}
          <button type="submit" className="btn btn-azul btn-grande" disabled={ocupado}>{ocupado ? 'Liberando…' : 'Liberar acesso e mandar convite'}</button>
        </form>
      ) : (
        <button type="button" className="btn btn-tracejado" onClick={() => setAbrindo(true)}><Mais size={16} /> Compartilhar com mais alguém</button>
      )}
    </Janela>
  );
}
