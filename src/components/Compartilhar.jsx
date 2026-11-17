// Compartilhar é sempre de um sonho por vez, nunca do caderno inteiro.
import { useEffect, useState } from 'react';
import Janela from './Janela.jsx';
import Avatar from './Avatar.jsx';
import { useEstado } from '../lib/estado.jsx';
import { PAPEIS, convidar, mudarCompartilhamento, desfazer, textoConvite, perfilPorEmail, pessoa, criarLink, mandarLink, aprovarPedido } from '../lib/compartilhar.js';
import { tituloDe } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { Copiar, Lixo, Mais, Ok, Link as IconeLink } from './Icones.jsx';

function Opcoes({ valor, opcoes, aoMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="abas" style={{ flexWrap: 'wrap', alignSelf: 'flex-start' }}>
      {Object.entries(opcoes).map(([k, r]) => (
        <button key={k} type="button" role="radio" aria-checked={valor === k} className={'aba' + (valor === k ? ' ativa' : '')} onClick={() => aoMudar(k)}>{r}</button>
      ))}
    </div>
  );
}
const QUEM = { terapeuta: 'Meu terapeuta', amigo: 'Amigo ou amiga' };

async function enviarConvite(c, sonho, avisar) {
  const texto = textoConvite(c, sonho);
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

// O aviso que deixa claro o que vai: só este sonho.
function SoEsteSonho({ s }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Ok size={14} /></span>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>
        <strong>{semViuvas('Só este sonho será compartilhado:')}</strong> {semViuvas('“' + tituloDe(s) + '”.')}<br />
        <span style={{ color: 'var(--muted)' }}>{semViuvas('Seus outros sonhos continuam só seus.')}</span>
      </span>
    </div>
  );
}

// Pedidos de quem abriu um link: aprovar ou recusar.
function Pedidos({ pedidos, perfis, sonhoId }) {
  const { avisar, recarregarCompartilhamentos } = useEstado();
  const lista = sonhoId ? pedidos.filter((c) => c.sonhos_pedidos?.includes(sonhoId)) : pedidos;
  if (!lista.length) return null;
  async function aprovar(c, nome) {
    try { await aprovarPedido(c.id); await recarregarCompartilhamentos(); avisar(nome + ' agora vê ' + (sonhoId ? 'este sonho' : 'o sonho')); } catch (e) { avisar('Não deu para aprovar: ' + e.message); }
  }
  async function recusar(c) {
    try { await desfazer(c.id); await recarregarCompartilhamentos(); avisar('Pedido recusado'); } catch (e) { avisar('Não deu: ' + e.message); }
  }
  return (
    <section aria-label="Pedidos para ver" style={{ background: 'var(--warn-bg)', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <strong style={{ fontSize: 14, color: 'var(--warn-ink)' }}>{lista.length === 1 ? '1 pessoa abriu o link e quer ver' : lista.length + ' pessoas abriram o link e querem ver'}</strong>
      {lista.map((c) => {
        const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
        const n = c.sonhos_pedidos?.length || 0;
        return (
          <LinhaPessoa key={c.id} p={p} sub={p.nome !== c.convidado_email ? c.convidado_email : (sonhoId ? PAPEIS[c.papel].rotulo : n === 1 ? '1 sonho' : n + ' sonhos')}>
            <button type="button" className="btn btn-linha" style={{ minHeight: 36, padding: '0 12px' }} onClick={() => recusar(c)}>Recusar</button>
            <button type="button" className="btn btn-azul" style={{ minHeight: 36, padding: '0 12px' }} onClick={() => aprovar(c, p.nome)}>Aprovar</button>
          </LinhaPessoa>
        );
      })}
    </section>
  );
}

// Link deste sonho: pode ir para várias pessoas, e cada uma vira um pedido para aprovar.
function LinkConvite({ s }) {
  const { usuario, avisar } = useEstado();
  const [papel, setPapel] = useState('amigo');
  const [amp, setAmp] = useState(false);
  const [url, setUrl] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function gerar() {
    setOcupado(true);
    try { const u = await criarLink(usuario, { sonhoId: s.id, papel, ver_amplificacoes: amp }); setUrl(u); mandarLink(u, avisar); }
    catch (e) { avisar('Não deu para criar o link: ' + e.message); }
    setOcupado(false);
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(url); avisar('Link copiado'); } catch { prompt('Copie o link:', url); }
  }

  return (
    <section aria-label="Mandar por link" style={{ background: 'var(--cinza)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <strong style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconeLink size={16} /> Mandar por link</strong>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas('Quem abrir o link entra com a conta Google e pede para ver este sonho. Você aprova cada pessoa.')}</p>
      {url ? (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="campo" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Link deste sonho" style={{ fontSize: 13 }} />
            <button type="button" className="btn btn-linha" onClick={copiar}><Copiar size={16} /> Copiar</button>
          </div>
          <button type="button" className="btn btn-azul" style={{ alignSelf: 'flex-start' }} onClick={() => mandarLink(url, avisar)}>Mandar</button>
        </>
      ) : (
        <>
          <div role="radiogroup" aria-label="Para quem" className="abas" style={{ background: '#fff', alignSelf: 'flex-start' }}>
            {Object.entries(QUEM).map(([k, r]) => (
              <button key={k} type="button" role="radio" aria-checked={papel === k} className={'aba' + (papel === k ? ' ativa' : '')} style={papel === k ? { background: 'var(--cinza)' } : undefined} onClick={() => setPapel(k)}>{r}</button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={amp} onChange={(e) => setAmp(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
            Mostrar também as amplificações
          </label>
          <button type="button" className="btn btn-azul" style={{ alignSelf: 'flex-start' }} onClick={gerar} disabled={ocupado}><IconeLink size={16} /> {ocupado ? 'Criando…' : 'Criar link deste sonho'}</button>
        </>
      )}
    </section>
  );
}

// Convite pelo e-mail, para este sonho. Ao digitar o e-mail de quem já usa o Sonhário, aparecem nome e foto.
function FormConvite({ s, aoConvidar }) {
  const { usuario, avisar, recarregarCompartilhamentos } = useEstado();
  const [form, setForm] = useState({ email: '', nome: '', papel: 'terapeuta', ver_amplificacoes: false });
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
      await aoConvidar(c);
      avisar('Este sonho foi compartilhado com ' + (achado?.nome || c.convidado_nome || c.convidado_email));
      if (!achado) enviarConvite(c, s, avisar);
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
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{semViuvas('Essa pessoa ainda não usa o Sonhário. Ela recebe um convite e, ao entrar com esse e-mail, já encontra este sonho.')}</p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 700 }}>
            Nome (opcional)
            <input className="campo" value={form.nome} onChange={(e) => campo('nome')(e.target.value)} placeholder={form.papel === 'terapeuta' ? 'Ex.: Dra. Ana' : 'Ex.: Júlia'} style={{ fontWeight: 400, fontSize: 16 }} />
          </label>
        </>
      )}
      <span className="rotulo">Quem é</span>
      <Opcoes rotulo="Quem é" valor={form.papel} opcoes={QUEM} aoMudar={campo('papel')} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.ver_amplificacoes} onChange={(e) => campo('ver_amplificacoes')(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
        Mostrar também as amplificações
      </label>
      {erro && <div className="aviso">{erro}</div>}
      <button type="submit" className="btn btn-azul btn-grande" disabled={ocupado}>{ocupado ? 'Compartilhando…' : 'Compartilhar este sonho'}</button>
    </form>
  );
}

function PedirLogin({ aoFechar, titulo }) {
  const { entrar } = useEstado();
  return (
    <Janela titulo={titulo} aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Para mostrar um sonho ao seu terapeuta ou a um amigo, entre com a sua conta Google. Sem conta, os sonhos ficam só neste aparelho.')}</p>
      <button type="button" className="btn btn-azul btn-grande" onClick={entrar}>Entrar com Google</button>
    </Janela>
  );
}

// Botão "Compartilhar" de um sonho: só este sonho, com quem você escolher.
export function CompartilharSonho({ s, mudar, aoFechar }) {
  const { usuario, compartilhamentos } = useEstado();
  const { meus, pedidos, perfis } = compartilhamentos;
  const [convidando, setConvidando] = useState(false);
  if (!usuario) return <PedirLogin aoFechar={aoFechar} titulo="Compartilhar este sonho" />;

  const com = s.compartilhado_com || [];
  const alternar = (email, ligar) => mudar({ compartilhado_com: ligar ? [...new Set([...com, email])] : com.filter((x) => x !== email) }, true);

  return (
    <Janela titulo="Compartilhar este sonho" aoFechar={aoFechar}>
      <SoEsteSonho s={s} />
      <Pedidos pedidos={pedidos} perfis={perfis} sonhoId={s.id} />
      {meus.length > 0 && (
        <div role="group" aria-label="Com quem" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="rotulo" style={{ marginBottom: 2 }}>Com quem</span>
          {meus.map((c) => {
            const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
            const marcado = com.includes(c.convidado_email);
            return (
              <label key={c.id} style={{ cursor: 'pointer', borderBottom: '1px solid var(--line)', padding: '4px 0' }}>
                <LinhaPessoa p={p} sub={PAPEIS[c.papel].rotulo + (marcado ? ' · vê este sonho' : '')}>
                  <input type="checkbox" checked={marcado} onChange={(e) => alternar(c.convidado_email, e.target.checked)}
                    aria-label={(marcado ? 'Deixar de mostrar este sonho para ' : 'Mostrar este sonho para ') + p.nome} style={{ width: 22, height: 22, accentColor: 'var(--azul)' }} />
                </LinhaPessoa>
              </label>
            );
          })}
        </div>
      )}
      {convidando
        ? <FormConvite s={s} aoConvidar={(c) => { alternar(c.convidado_email, true); setConvidando(false); }} />
        : <button type="button" className="btn btn-tracejado" onClick={() => setConvidando(true)}><Mais size={16} /> {meus.length ? 'Outra pessoa, pelo e-mail' : 'Convidar pelo e-mail'}</button>}
      {!convidando && <LinkConvite s={s} />}
      {meus.length > 0 && !convidando && <button type="button" className="btn btn-azul btn-grande" onClick={aoFechar}>Pronto</button>}
    </Janela>
  );
}

// Menu ⋯: quem vê seus sonhos e os pedidos. Compartilhar mesmo é sempre pelo botão do sonho.
export default function Compartilhar({ aoFechar }) {
  const { usuario, avisar, sonhos, compartilhamentos, recarregarCompartilhamentos } = useEstado();
  const { meus, pedidos, perfis } = compartilhamentos;
  if (!usuario) return <PedirLogin aoFechar={aoFechar} titulo="Pessoas com acesso" />;

  async function mudar(c, parcial) {
    try { await mudarCompartilhamento(c.id, parcial); await recarregarCompartilhamentos(); } catch (e) { avisar('Não deu para mudar: ' + e.message); }
  }
  async function tirar(c, nome) {
    if (!confirm(`Tirar o acesso de ${nome}? A pessoa deixa de ver todos os sonhos que você mostrou para ela.`)) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); avisar('Acesso retirado'); } catch (e) { avisar('Não deu para tirar: ' + e.message); }
  }

  return (
    <Janela titulo="Pessoas com acesso" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Você compartilha um sonho por vez, pelo botão Compartilhar dentro do sonho. Cada pessoa vê só os sonhos que você mostrou para ela.')}</p>
      <Pedidos pedidos={pedidos} perfis={perfis} />
      {!meus.length && !pedidos.length && <div className="painel" style={{ padding: 16, fontSize: 14, color: 'var(--muted)' }}>Você ainda não compartilhou nenhum sonho.</div>}
      {meus.map((c) => {
        const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
        const n = sonhos.filter((x) => x.compartilhado_com?.includes(c.convidado_email)).length;
        return (
          <div key={c.id} className="painel" style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <LinhaPessoa p={p} sub={PAPEIS[c.papel].rotulo + ' · ' + (n === 1 ? 'vê 1 sonho' : n ? 'vê ' + n + ' sonhos' : 'não vê nenhum sonho') + (p.temConta ? '' : ' · ainda não entrou')}>
              <button type="button" className="btn-icone" style={{ width: 36, height: 36, color: 'var(--danger)' }} onClick={() => tirar(c, p.nome)} aria-label={'Tirar o acesso de ' + p.nome} title="Tirar o acesso"><Lixo size={16} /></button>
            </LinhaPessoa>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={c.ver_amplificacoes} onChange={(e) => mudar(c, { ver_amplificacoes: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--azul)' }} />
              Mostrar as amplificações
            </label>
          </div>
        );
      })}
    </Janela>
  );
}
