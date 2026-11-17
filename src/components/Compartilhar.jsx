import { useEffect, useState } from 'react';
import Janela from './Janela.jsx';
import Avatar from './Avatar.jsx';
import { useEstado } from '../lib/estado.jsx';
import { PAPEIS, ESCOPOS, convidar, mudarCompartilhamento, desfazer, textoConvite, perfilPorEmail, pessoa } from '../lib/compartilhar.js';
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

// Linha de uma pessoa: foto, nome e o papel (ou o e-mail).
export function LinhaPessoa({ p, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <Avatar nome={p.nome} foto={p.foto} size={40} />
      <div style={{ marginRight: 'auto', minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 15, overflowWrap: 'anywhere' }}>{p.nome}</strong>
        <span style={{ fontSize: 13, color: 'var(--muted)', overflowWrap: 'anywhere' }}>{sub}</span>
      </div>
      {children}
    </div>
  );
}

// Formulário de convite. Ao digitar o e-mail de quem já usa o Sonhário, aparecem o nome e a foto.
export function FormConvite({ escopoInicial = 'escolhidos', aoConvidar }) {
  const { usuario, avisar, recarregarCompartilhamentos } = useEstado();
  const [form, setForm] = useState({ email: '', nome: '', papel: 'terapeuta', escopo: escopoInicial, ver_amplificacoes: false });
  const [achado, setAchado] = useState(undefined); // undefined: nada digitado; null: não usa; objeto: perfil
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const campo = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let vivo = true;
    setAchado(undefined);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return;
    const t = setTimeout(() => perfilPorEmail(form.email).then((p) => vivo && setAchado(p)).catch(() => vivo && setAchado(null)), 400);
    return () => { vivo = false; clearTimeout(t); };
  }, [form.email]);

  async function enviar(e) {
    e.preventDefault();
    setOcupado(true); setErro('');
    try {
      const c = await convidar(usuario, { ...form, nome: achado?.nome ? '' : form.nome });
      await recarregarCompartilhamentos();
      await aoConvidar?.(c);
      avisar('Acesso liberado para ' + (achado?.nome || c.convidado_nome || c.convidado_email));
      if (!achado) enviarConvite(c, avisar);
    } catch (e2) { setErro(e2.message); }
    setOcupado(false);
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
        E-mail da conta Google
        <input className="campo" type="email" required value={form.email} onChange={(e) => campo('email')(e.target.value)} placeholder="nome@gmail.com" autoComplete="off" autoFocus style={{ fontWeight: 400, fontSize: 16 }} />
      </label>
      {achado && (
        <div style={{ background: 'var(--cinza)', borderRadius: 12, padding: '6px 12px' }}>
          <LinhaPessoa p={{ nome: achado.nome || achado.email, foto: achado.foto }} sub="já usa o Sonhário" />
        </div>
      )}
      {achado === null && (
        <>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas('Essa pessoa ainda não usa o Sonhário. Ela recebe um convite e, ao entrar com esse e-mail, já encontra os sonhos.')}</p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
            Nome (opcional)
            <input className="campo" value={form.nome} onChange={(e) => campo('nome')(e.target.value)} placeholder={form.papel === 'terapeuta' ? 'Ex.: Dra. Ana' : 'Ex.: Júlia'} style={{ fontWeight: 400, fontSize: 16 }} />
          </label>
        </>
      )}
      <span className="rotulo">Quem é</span>
      <Opcoes rotulo="Quem é" valor={form.papel} opcoes={{ terapeuta: 'Meu terapeuta', amigo: 'Amigo ou amiga' }} aoMudar={campo('papel')} />
      <span className="rotulo">O que pode ver</span>
      <Opcoes rotulo="O que pode ver" valor={form.escopo} opcoes={ESCOPOS} aoMudar={campo('escopo')} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.ver_amplificacoes} onChange={(e) => campo('ver_amplificacoes')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
        Mostrar também as amplificações
      </label>
      {erro && <div className="aviso">{erro}</div>}
      <button type="submit" className="btn btn-azul btn-grande" disabled={ocupado}>{ocupado ? 'Liberando…' : achado ? 'Compartilhar' : 'Compartilhar e mandar convite'}</button>
    </form>
  );
}

function PedirLogin({ aoFechar, titulo }) {
  const { entrar } = useEstado();
  return (
    <Janela titulo={titulo} aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Para mostrar seus sonhos ao seu terapeuta ou a amigos, entre com a sua conta Google. Sem conta, os sonhos ficam só neste aparelho.')}</p>
      <button type="button" className="btn btn-azul btn-grande" onClick={entrar}>Entrar com Google</button>
    </Janela>
  );
}

// Menu ⋯ › Compartilhar: quem tem acesso e o que cada um vê.
export default function Compartilhar({ aoFechar }) {
  const { usuario, avisar, compartilhamentos, recarregarCompartilhamentos } = useEstado();
  const { meus, perfis } = compartilhamentos;
  const [abrindo, setAbrindo] = useState(meus.length === 0);
  if (!usuario) return <PedirLogin aoFechar={aoFechar} titulo="Compartilhar sonhos" />;

  async function mudar(c, parcial) {
    try { await mudarCompartilhamento(c.id, parcial); await recarregarCompartilhamentos(); } catch (e) { avisar('Não deu para mudar: ' + e.message); }
  }
  async function tirar(c, nome) {
    if (!confirm(`Tirar o acesso de ${nome}? A pessoa deixa de ver seus sonhos na hora.`)) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); avisar('Acesso retirado'); } catch (e) { avisar('Não deu para tirar: ' + e.message); }
  }

  return (
    <Janela titulo="Compartilhar sonhos" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('A pessoa entra no Sonhário com a conta Google dela e encontra seus sonhos numa aba própria. Ela só lê: não edita, não apaga.')}</p>

      {meus.map((c) => {
        const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
        return (
          <div key={c.id} className="painel" style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LinhaPessoa p={p} sub={PAPEIS[c.papel].rotulo + (p.temConta ? '' : ' · ainda não entrou')}>
              {!p.temConta && <button type="button" className="btn-icone" style={{ width: 36, height: 36 }} onClick={() => enviarConvite(c, avisar)} aria-label={'Mandar o convite de novo para ' + p.nome} title="Mandar o convite"><Copiar size={16} /></button>}
              <button type="button" className="btn-icone" style={{ width: 36, height: 36, color: 'var(--danger)' }} onClick={() => tirar(c, p.nome)} aria-label={'Tirar o acesso de ' + p.nome} title="Tirar o acesso"><Lixo size={16} /></button>
            </LinhaPessoa>
            <Opcoes rotulo="O que pode ver" valor={c.escopo} opcoes={ESCOPOS} aoMudar={(v) => mudar(c, { escopo: v })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={c.ver_amplificacoes} onChange={(e) => mudar(c, { ver_amplificacoes: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
              Mostrar as amplificações
            </label>
          </div>
        );
      })}

      {abrindo
        ? <div style={{ borderTop: meus.length ? '1px solid var(--line)' : 0, paddingTop: meus.length ? 14 : 0 }}><FormConvite aoConvidar={() => setAbrindo(false)} /></div>
        : <button type="button" className="btn btn-tracejado" onClick={() => setAbrindo(true)}><Mais size={16} /> Compartilhar com mais alguém</button>}
    </Janela>
  );
}

// Botão "Compartilhar" de um sonho: escolher a pessoa (foto e nome) e pronto.
export function CompartilharSonho({ s, mudar, aoFechar }) {
  const { usuario, compartilhamentos } = useEstado();
  const { meus, perfis } = compartilhamentos;
  const [convidando, setConvidando] = useState(meus.length === 0);
  if (!usuario) return <PedirLogin aoFechar={aoFechar} titulo="Compartilhar este sonho" />;

  const com = s.compartilhado_com || [];
  const alternar = (email, ligar) => mudar({ compartilhado_com: ligar ? [...new Set([...com, email])] : com.filter((x) => x !== email) }, true);

  return (
    <Janela titulo="Compartilhar este sonho" aoFechar={aoFechar}>
      {meus.length > 0 && (
        <div role="group" aria-label="Com quem" style={{ display: 'flex', flexDirection: 'column' }}>
          {meus.map((c) => {
            const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
            const todos = c.escopo === 'todos';
            const marcado = todos || com.includes(c.convidado_email);
            return (
              <label key={c.id} style={{ cursor: todos ? 'default' : 'pointer', borderBottom: '1px solid var(--line)', padding: '4px 0' }}>
                <LinhaPessoa p={p} sub={todos ? PAPEIS[c.papel].rotulo + ' · já vê todos os sonhos' : PAPEIS[c.papel].rotulo}>
                  <input type="checkbox" checked={marcado} disabled={todos} onChange={(e) => alternar(c.convidado_email, e.target.checked)}
                    aria-label={(marcado ? 'Deixar de compartilhar com ' : 'Compartilhar com ') + p.nome} style={{ width: 22, height: 22, accentColor: 'var(--azul)' }} />
                </LinhaPessoa>
              </label>
            );
          })}
        </div>
      )}
      {convidando
        ? <FormConvite aoConvidar={(c) => { if (c.escopo === 'escolhidos') alternar(c.convidado_email, true); setConvidando(false); }} />
        : <button type="button" className="btn btn-tracejado" onClick={() => setConvidando(true)}><Mais size={16} /> Outra pessoa</button>}
      {meus.length > 0 && !convidando && <button type="button" className="btn btn-azul btn-grande" onClick={aoFechar}>Pronto</button>}
    </Janela>
  );
}
