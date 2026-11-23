// Vista "Amplificações" do acervo: um mural em que a amplificação vem na frente e o sonho
// fica como origem, embaixo. Junto delas, as amplificações sobre o processo como um todo,
// que não pertencem a nenhum sonho (guardadas em notasTema.js com o tema PROCESSO).
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { CORES, dataCurta } from '../lib/sonhos.js';
import { casar } from '../lib/busca.js';
import { semViuvas } from '../lib/tipografia.js';
import { useNotasTema, ehProcesso, amplificarProcesso, editarNotaTema, apagarNotaTema } from '../lib/notasTema.js';
import { MuralEmLinhas } from '../pages/Acervo.jsx';
import Realce from './Realce.jsx';
import { Cadeado, Mais } from './Icones.jsx';

const POR_VEZ = 60;
const link = { border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 12, padding: 0, textDecoration: 'underline', cursor: 'pointer' };

// sonhos: já com os filtros do acervo (tema, favoritos…), mas sem a busca, que aqui vale para cada amplificação.
// comProcesso: falso quando há filtro de sonho (tema, favoritos…), que não se aplica às gerais.
export default function PainelAmplificacoes({ sonhos, consulta, comProcesso }) {
  const { podeLer } = useEstado();
  const { notas, carregado, semTabela } = useNotasTema();
  const [params, setParams] = useSearchParams();
  const tipo = ['sonhos', 'processo'].includes(params.get('a')) ? params.get('a') : 'todas';
  const escolher = (t) => { const novo = new URLSearchParams(params); if (t === 'todas') novo.delete('a'); else novo.set('a', t); setParams(novo, { replace: true }); setLimite(POR_VEZ); };
  const [limite, setLimite] = useState(POR_VEZ);
  const podeProcesso = podeLer && !semTabela;

  const { doSonho, doProcesso } = useMemo(() => {
    const doSonho = [];
    for (const s of sonhos) for (const c of s.conclusoes || []) {
      if (!c.texto?.trim()) continue;
      const a = consulta.vazia ? {} : casar({ titulo: s.titulo, texto: c.texto, temas: s.temas }, consulta);
      if (a) doSonho.push({ tipo: 'sonho', chave: s.id + ':' + c.id, em: c.em || s.sonhado_em, texto: c.texto, s });
    }
    const doProcesso = !comProcesso ? [] : notas.filter(ehProcesso)
      .filter((n) => consulta.vazia || (!n._trancado && casar({ texto: n.texto }, consulta)))
      .map((n) => ({ tipo: 'processo', chave: n.id, em: n.criado_em, texto: n.texto, n }));
    return { doSonho, doProcesso };
  }, [sonhos, notas, consulta, comProcesso]);

  const itens = useMemo(() => [...(tipo !== 'processo' ? doSonho : []), ...(tipo !== 'sonhos' ? doProcesso : [])]
    .sort((a, b) => String(b.em).localeCompare(String(a.em))), [doSonho, doProcesso, tipo]);
  const visiveis = itens.slice(0, limite);
  const termos = consulta.termos;

  const pilula = (t, nome, n) => (
    <button type="button" className={'amp-tipo' + (tipo === t ? ' ativa' : '')} aria-pressed={tipo === t} onClick={() => escolher(t)}>
      {nome} <span>{n}</span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {podeProcesso && carregado && comProcesso && tipo !== 'sonhos' && <NovaGeral />}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <div className="amp-tipos" role="group" aria-label="Quais amplificações">
          {pilula('todas', 'Todas', doSonho.length + doProcesso.length)}
          {pilula('sonhos', 'Dos sonhos', doSonho.length)}
          {comProcesso && podeProcesso && pilula('processo', 'Sobre o processo', doProcesso.length)}
        </div>
        {!comProcesso && podeProcesso && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{semViuvas('Com filtro de sonho, as amplificações sobre o processo ficam de fora.')}</span>}
      </div>

      {itens.length === 0
        ? <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 560, lineHeight: 1.6 }}>
          {semViuvas(!consulta.vazia ? 'Nenhuma amplificação com essa busca.'
            : tipo === 'processo' ? 'Nenhuma amplificação sobre o processo ainda. Use a caixa acima para escrever o que você vem percebendo no conjunto dos sonhos.'
            : 'Nenhuma amplificação aqui ainda. Elas nascem dentro de cada sonho, no painel Amplificações, ou na caixa acima, sobre o processo como um todo.')}
        </p>
        : <MuralEmLinhas largura={290}>
          {visiveis.map((it) => it.tipo === 'sonho'
            ? <CartaoSonho key={it.chave} it={it} termos={termos} />
            : <CartaoProcesso key={it.chave} n={it.n} termos={termos} />)}
        </MuralEmLinhas>}

      {itens.length > limite && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 0 8px' }}>
          <button type="button" className="btn btn-linha" onClick={() => setLimite((n) => n + POR_VEZ)}>Mostrar mais {Math.min(POR_VEZ, itens.length - limite)}</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{limite} de {itens.length}</span>
        </div>
      )}
    </div>
  );
}

// A amplificação em destaque; o sonho de onde ela veio, embaixo. O cartão inteiro abre o sonho.
function CartaoSonho({ it, termos }) {
  const estiloTema = useCorTema();
  const { s } = it;
  const c = CORES[s.cor] || CORES.branco;
  return (
    <Link to={'/app/sonho/' + s.id} className="nota nota-amp" style={{ background: c.fundo }}>
      <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(it.em)}</span>
      <p><Realce texto={it.texto} termos={termos} /></p>
      <div className="amp-origem" style={{ color: c.rotulo }}>
        <span style={{ fontSize: 11.5 }}>do sonho de {dataCurta(s.sonhado_em)}</span>
        <h3><Realce texto={s.titulo?.trim() || 'Sem título'} termos={termos} /></h3>
        {s.temas?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{s.temas.slice(0, 4).map((t) => <span key={t} className="chip" style={{ ...estiloTema(t), height: 22, fontSize: 11.5 }}>{t}</span>)}{s.temas.length > 4 && <span style={{ fontSize: 11.5, alignSelf: 'center' }}>+{s.temas.length - 4}</span>}</div>}
      </div>
    </Link>
  );
}

// Amplificação sobre o processo: não pertence a nenhum sonho; edita e apaga aqui mesmo.
function CartaoProcesso({ n, termos }) {
  const { avisar } = useEstado();
  const [editando, setEditando] = useState(false);
  async function apagar() {
    if (!confirm('Apagar esta amplificação sobre o processo?')) return;
    try { await apagarNotaTema(n.id); } catch (e) { avisar('Não deu para apagar: ' + e.message); }
  }
  return (
    <div className="nota nota-amp nota-processo">
      <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>Sobre o processo · {dataCurta(n.criado_em)}{n.editado_em && ' · editada'}</span>
      {editando
        ? <Caixa inicial={n.texto} rotulo="Salvar" aoCancelar={() => setEditando(false)} aoEnviar={async (t) => { await editarNotaTema(n, t); setEditando(false); }} />
        : <>
          <p>{n._trancado ? '(amplificação trancada)' : <Realce texto={n.texto} termos={termos} />}</p>
          {!n._trancado && <span style={{ display: 'flex', gap: 14 }}>
            <button type="button" style={link} onClick={() => setEditando(true)}>editar</button>
            <button type="button" style={link} onClick={apagar}>apagar</button>
          </span>}
        </>}
    </div>
  );
}

// Caixa no alto do mural, como a de criar nota: fechada é uma linha; ao tocar, abre.
function NovaGeral() {
  const [aberta, setAberta] = useState(false);
  if (!aberta) return (
    <button type="button" className="amp-nova fechada" onClick={() => setAberta(true)}>
      <Mais size={16} /> {semViuvas('Escrever uma amplificação sobre o seu processo')}
    </button>
  );
  return (
    <div className="amp-nova">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '2px 12px' }}>
        <span className="rotulo-forte" style={{ color: 'var(--azul)' }}>Sobre o processo</span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Cadeado size={12} /> Só você vê</span>
      </div>
      <Caixa rotulo="Guardar" vazio aoEnviar={amplificarProcesso} aoFechar={() => setAberta(false)} />
    </div>
  );
}

function Caixa({ inicial = '', rotulo, vazio, aoEnviar, aoCancelar, aoFechar }) {
  const { avisar } = useEstado();
  const [texto, setTexto] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try { await aoEnviar(texto); if (!aoCancelar) { setTexto(''); avisar('Amplificação guardada'); } } catch (err) { avisar('Não deu para salvar: ' + err.message); }
    setEnviando(false);
  }
  const sair = aoCancelar || aoFechar;
  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label className="sr" htmlFor={aoCancelar ? undefined : 'nova-amp-processo'}>{aoCancelar ? 'Editar amplificação' : 'Nova amplificação sobre o processo'}</label>
      <textarea id={aoCancelar ? undefined : 'nova-amp-processo'} value={texto} onChange={(e) => setTexto(e.target.value)} rows={aoCancelar ? 4 : 3} maxLength={5000} autoFocus
        aria-label={aoCancelar ? 'Editar amplificação' : undefined}
        placeholder={vazio ? 'O que você vem percebendo no conjunto dos sonhos? Imagens que voltam, mitos, leituras, o que muda na análise…' : ''}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar(e); if (e.key === 'Escape' && sair && !texto.trim()) sair(); }}
        className="leitura sigilo" style={{ border: '1px solid var(--line-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.6, resize: 'vertical', background: '#fff' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {vazio && <span style={{ flex: '1 1 200px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas('Fica no mural junto das amplificações dos sonhos, com a data, sem pertencer a nenhum deles.')}</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {sair && <button type="button" className="btn btn-linha" onClick={sair}>{aoCancelar ? 'Cancelar' : 'Fechar'}</button>}
          <button className="btn btn-azul" disabled={!texto.trim() || enviando}>{enviando ? 'Salvando…' : rotulo}</button>
        </span>
      </div>
    </form>
  );
}
