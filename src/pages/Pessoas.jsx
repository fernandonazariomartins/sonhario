// Pessoas com acesso: quem vê os seus sonhos e o resumo do que cada pessoa vê.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { mudarCompartilhamento, desfazer, pessoa, temMarcaTerapeuta, marcarTerapeuta, terapeutaDe } from '../lib/compartilhar.js';
import { BotaoConvite } from '../components/Convidar.jsx';
import { dataCurta, tituloDe } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { LinhaPessoa, Pedidos } from '../components/Compartilhar.jsx';
import { Lixo, Fechar } from '../components/Icones.jsx';
import { tr } from '../lib/i18n.js';

const plural = (n, um, varios) => (n === 1 ? '1 ' + tr(um) : n + ' ' + tr(varios));
const VISIVEIS = 3;

function Etiqueta({ children }) {
  return <span style={{ height: 24, padding: '0 10px', borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{children}</span>;
}

// O resumo do que uma pessoa vê: números e a lista dos sonhos, do mais novo ao mais antigo.
function SonhosDaPessoa({ c, nome, sonhos }) {
  const { salvar } = useEstado();
  const [todos, setTodos] = useState(false);
  const lista = sonhos
    .filter((s) => s.compartilhado_com?.includes(c.convidado_email))
    .sort((a, b) => (b.sonhado_em || '').localeCompare(a.sonhado_em || ''));
  if (!lista.length) return <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{semViuvas(tr("Ainda não vê nenhum sonho. Para mostrar um, use o botão Compartilhar dentro do sonho."))}</p>;

  const sessao = lista.filter((s) => s.levar_sessao).length;
  const comAmp = c.ver_amplificacoes ? lista.filter((s) => s.conclusoes?.length).length : 0;
  const resumo = [plural(lista.length, 'sonho', 'sonhos'), sessao && plural(sessao, tr("para a próxima sessão"), tr("para a próxima sessão")), comAmp && plural(comAmp, tr("com amplificações"), tr("com amplificações"))].filter(Boolean);
  const mostrados = todos ? lista : lista.slice(0, VISIVEIS);

  function tirarDeste(s) {
    salvar({ ...s, compartilhado_com: s.compartilhado_com.filter((x) => x !== c.convidado_email) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="rotulo">{resumo.map((t) => t.replace(/ /g, '\u00a0')).join(' ·\u00a0')}</span>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        {mostrados.map((s, i) => (
          <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px 10px 14px', borderTop: i ? '1px solid var(--line)' : 0 }}>
            <Link to={'/app/sonho/' + s.id} style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                <strong style={{ fontSize: 15, color: s.titulo?.trim() ? 'var(--ink)' : 'var(--muted)' }}>{tituloDe(s)}</strong>
                {s.levar_sessao && <Etiqueta>{tr("Próxima sessão")}</Etiqueta>}
              </span>
              {s.texto && <span style={{ display: 'block', fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.texto}</span>}
              <span className="rotulo" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>{tr("sonhado ")}{dataCurta(s.sonhado_em)}</span>
            </Link>
            <button type="button" className="btn-icone" style={{ width: 36, height: 36, flex: 'none' }} onClick={() => tirarDeste(s)}
              aria-label={tr("Deixar de mostrar “") + tituloDe(s) + tr("” para ") + nome} title={tr("Deixar de mostrar este sonho")}><Fechar size={16} /></button>
          </li>
        ))}
      </ul>
      {lista.length > VISIVEIS && (
        <button type="button" className="btn btn-linha" style={{ alignSelf: 'flex-start', minHeight: 36 }} onClick={() => setTodos(!todos)}>
          {todos ? tr("Mostrar menos") : tr("Ver os ") + lista.length + tr(' sonhos')}
        </button>
      )}
    </div>
  );
}

export default function Pessoas() {
  const { usuario, avisar, sonhos, compartilhamentos, recarregarCompartilhamentos, entrar } = useEstado();
  const { meus, pedidos, perfis } = compartilhamentos;
  const marcaTerapeuta = temMarcaTerapeuta(meus);

  async function mudar(c, parcial) {
    try { await mudarCompartilhamento(c.id, parcial); await recarregarCompartilhamentos(); } catch (e) { avisar(tr("Não deu para mudar: ") + e.message); }
  }
  async function terapeuta(c, ligar, nome) {
    try { await marcarTerapeuta(meus, c, ligar); await recarregarCompartilhamentos(); avisar(ligar ? nome + tr(" agora é terapeuta. Os sonhos para a próxima sessão já vão para essa pessoa.") : tr("Marcação de terapeuta retirada")); }
    catch (e) { avisar(tr("Não deu para mudar: ") + e.message); }
  }
  async function tirar(c, nome) {
    if (!confirm(tr("Tirar o acesso de {0}? A pessoa deixa de ver todos os sonhos que você mostrou para ela.", [nome]))) return;
    try { await desfazer(c.id); await recarregarCompartilhamentos(); avisar(tr("Acesso retirado")); } catch (e) { avisar(tr("Não deu para tirar: ") + e.message); }
  }

  return (
    <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 className="titulo-m">{tr("Pessoas com acesso")}</h1>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 560 }}>{semViuvas(tr("Você compartilha um sonho por vez, pelo botão Compartilhar dentro do sonho. Cada pessoa vê só os sonhos que você mostrou para ela."))}</p>

      {!usuario ? (
        <div className="painel" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(tr("Para mostrar sonhos a outras pessoas, entre com a sua conta Google."))}</p>
          <button type="button" className="btn btn-azul" onClick={entrar}>{tr("Entrar com Google")}</button>
        </div>
      ) : (
        <>
          {/* Convites para o app: ligam as pessoas sem mostrar nenhum sonho. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {!terapeutaDe(meus) && <BotaoConvite tipo="paciente" />}
            <BotaoConvite tipo="amigo" />
          </div>
          <Pedidos pedidos={pedidos} perfis={perfis} />
          {!meus.length && !pedidos.length && (
            <div className="painel" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{tr("Você ainda não compartilhou nenhum sonho.")}</p>
              <Link className="btn btn-linha" to="/app/acervo">{tr("Ir para o acervo")}</Link>
            </div>
          )}
          {meus.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16, alignItems: 'start' }}>
          {[...meus].sort((a, b) => Number(!!b.eh_terapeuta) - Number(!!a.eh_terapeuta)).map((c) => {
            const p = pessoa(perfis, c.convidado_email, c.convidado_nome);
            return (
              <section key={c.id} aria-label={p.nome} className="painel" style={{ padding: '10px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LinhaPessoa p={p} sub={p.nome !== c.convidado_email ? c.convidado_email + (p.temConta ? '' : tr(" · ainda não entrou")) : (p.temConta ? '' : tr("ainda não entrou"))}>
                  {c.eh_terapeuta && <Etiqueta>{tr("Terapeuta")}</Etiqueta>}
                  <button type="button" className="btn-icone" style={{ width: 36, height: 36, color: 'var(--danger)', flex: 'none' }} onClick={() => tirar(c, p.nome)} aria-label={tr("Tirar o acesso de ") + p.nome} title={tr("Tirar o acesso")}><Lixo size={16} /></button>
                </LinhaPessoa>
                <SonhosDaPessoa c={c} nome={p.nome} sonhos={sonhos} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--muted)' }}>
                  {marcaTerapeuta && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} title={tr("Com essa marcação, “Levar para a próxima sessão” já compartilha o sonho com ") + p.nome}>
                      <input type="checkbox" checked={!!c.eh_terapeuta} onChange={(e) => terapeuta(c, e.target.checked, p.nome)} style={{ width: 14, height: 14, accentColor: 'var(--azul)' }} />
                      {tr("É terapeuta")}
                    </label>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={c.ver_amplificacoes} onChange={(e) => mudar(c, { ver_amplificacoes: e.target.checked })} style={{ width: 14, height: 14, accentColor: 'var(--azul)' }} />
                    {tr("Vê as amplificações")}
                  </label>
                </div>
              </section>
            );
          })}
          </div>}
        </>
      )}
    </div>
  );
}
