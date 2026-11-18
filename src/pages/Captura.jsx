// A tela que abre primeiro: um toque e já grava. Feita para quem acabou de acordar.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { novoSonho, dataLonga, duracao, paraCampoData, deCampoData } from '../lib/sonhos.js';
import { iniciarGravacao, suportaGravacao, suportaTranscricao } from '../lib/gravador.js';
import { iaLigada } from '../lib/ia.js';
import { transcricaoNoServidor, transcreverAudio } from '../lib/transcrever.js';
import { Mic, Parar, Ok, Calendario, Mural, Mais, Caneta, Cadeado } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

const RASCUNHO = 'sonhario:rascunho';
const SILENCIO_MS = 10000;

const MOTIVOS = {
  manual: 'Ficou no seu acervo como não aberto.',
  silencio: 'Guardado sozinho depois de 10 segundos de silêncio.',
  tela: 'Guardado sozinho quando a tela bloqueou.',
};

export default function Captura() {
  const { salvar, salvarAudio, atualizar, avisar, usuario } = useEstado();
  const [texto, setTexto] = useState(() => localStorage.getItem(RASCUNHO) || '');
  const [titulo, setTitulo] = useState('');
  const [quando, setQuando] = useState(() => new Date().toISOString());
  const [dataMexida, setDataMexida] = useState(false);
  const [editandoData, setEditandoData] = useState(false);
  const [parcial, setParcial] = useState('');
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [niveis, setNiveis] = useState(() => Array(36).fill(0.1));
  const [salvando, setSalvando] = useState(false);
  const [guardado, setGuardado] = useState(null); // { sonho, motivo, transcrevendo }

  const sessao = useRef(null);
  const base = useRef('');
  const finalizando = useRef(false);
  // Refs para o "guardar sozinho" sempre enxergar o estado mais novo.
  const r = useRef({});
  r.current = { texto, parcial, titulo, quando, dataMexida, gravando };

  useEffect(() => { localStorage.setItem(RASCUNHO, texto); }, [texto]);
  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - sessao.current.inicio) / 1000)), 250);
    return () => clearInterval(t);
  }, [gravando]);
  // A data acompanha o relógio até a pessoa mudá-la.
  useEffect(() => {
    if (dataMexida) return;
    const t = setInterval(() => setQuando(new Date().toISOString()), 30000);
    return () => clearInterval(t);
  }, [dataMexida]);
  // Bloqueou a tela ou trocou de app no meio da gravação: guarda o que tem.
  useEffect(() => {
    const sair = () => { if (document.hidden && r.current.gravando) finalizar('tela'); };
    document.addEventListener('visibilitychange', sair);
    window.addEventListener('pagehide', sair);
    return () => { document.removeEventListener('visibilitychange', sair); window.removeEventListener('pagehide', sair); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function gravar() {
    if (!suportaGravacao()) { avisar('Este navegador não grava áudio. Dá para escrever o sonho.'); return; }
    try {
      base.current = r.current.texto ? r.current.texto.trim() + ' ' : '';
      sessao.current = await iniciarGravacao({
        aoTranscrever: (finais, p) => { setTexto((base.current + finais).trimStart()); setParcial(p); },
        aoNivel: (n) => setNiveis((v) => [...v.slice(1), Math.max(0.08, n)]),
        silencioMs: SILENCIO_MS,
        aoSilencio: ({ falou }) => finalizar(falou ? 'silencio' : 'vazio'),
      });
      setSegundos(0);
      setGravando(true);
    } catch {
      avisar('Não deu para usar o microfone. Confira a permissão do navegador.');
    }
  }

  // Para a gravação (se houver) e guarda o sonho.
  async function finalizar(motivo = 'manual') {
    if (finalizando.current) return;
    finalizando.current = true;
    try {
      let audio = null;
      if (sessao.current) {
        audio = await sessao.current.parar();
        sessao.current = null;
        setGravando(false);
      }
      const { texto: t, parcial: p, titulo: tit, quando: q, dataMexida: mexida } = r.current;
      const relato = (t + (p ? ' ' + p : '')).trim();
      setParcial('');

      // Gravou 10 segundos sem ninguém falar e sem texto: não guarda um áudio vazio.
      if (motivo === 'vazio' && !relato) { avisar('Não ouvi nada. Toque de novo quando quiser falar.'); return; }
      if (motivo === 'vazio') motivo = 'silencio';
      if (!relato && !audio) { avisar('Escreva ou grave alguma coisa antes de guardar.'); return; }

      setSalvando(true);
      const sonho = novoSonho({ texto: relato, titulo: tit.trim(), sonhado_em: mexida ? q : new Date().toISOString() });
      if (audio) {
        try { sonho.audio = { ref: await salvarAudio(sonho.id, audio.blob), duracao: audio.duracao }; }
        catch (e) { avisar('O áudio não foi salvo: ' + e.message); }
      }
      const salvo = await salvar(sonho);
      localStorage.removeItem(RASCUNHO);
      setTexto(''); setTitulo(''); setDataMexida(false); setEditandoData(false); setQuando(new Date().toISOString());

      // Sem transcrição ao vivo (iPhone, por exemplo): transcreve no servidor depois de guardar.
      const transcrever = audio && sonho.audio && !audio.transcreveu && transcricaoNoServidor && !!usuario && iaLigada();
      setGuardado({ sonho: salvo, motivo, transcrevendo: transcrever });
      if (transcrever) {
        transcreverAudio(audio.blob)
          .then((txt) => txt && atualizar(salvo.id, { texto: [relato, txt].filter(Boolean).join('\n\n') }))
          .catch(() => avisar('Não deu para transcrever agora. O áudio está guardado.'))
          .finally(() => setGuardado((g) => g && { ...g, transcrevendo: false }));
      }
    } finally {
      setSalvando(false);
      finalizando.current = false;
    }
  }

  if (guardado) return <Guardado {...guardado} outro={() => setGuardado(null)} />;

  const temTexto = !!(texto.trim() || parcial);
  return (
    <div className="captura">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {editandoData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="quando" className="rotulo">Quando sonhou</label>
            <input id="quando" type="datetime-local" value={paraCampoData(quando)} max={paraCampoData(new Date().toISOString())}
              onChange={(e) => { const iso = deCampoData(e.target.value); if (iso) { setQuando(iso); setDataMexida(true); } }}
              style={{ height: 40, padding: '0 10px', border: '1px solid var(--line-strong)', borderRadius: 10, fontSize: 15 }} />
            <button type="button" className="btn btn-linha" style={{ minHeight: 40 }} onClick={() => setEditandoData(false)}><Ok size={16} /> ok</button>
          </div>
        ) : (
          <button type="button" className="data-editavel" onClick={() => setEditandoData(true)} aria-label={'Data do sonho: ' + dataLonga(quando) + '. Mudar a data'}>
            <Calendario size={14} /> {dataLonga(quando)} <span className="data-mudar">mudar</span>
          </button>
        )}
        <h1 className="titulo-m">O que você sonhou?</h1>
      </div>

      <label htmlFor="titulo-novo" className="sr">Título (opcional)</label>
      <input id="titulo-novo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (opcional, dá para pôr depois)" className="campo-titulo" />

      <label htmlFor="sonho" className="sr">Texto do sonho</label>
      <textarea id="sonho" value={texto + (parcial ? (texto ? ' ' : '') + parcial : '')} onChange={(e) => { setTexto(e.target.value); setParcial(''); }}
        placeholder={'Escreva do jeito que vier. Frase solta também vale.'} readOnly={gravando} className="campo-sonho" />

      <button type="button" className={'gravador' + (gravando ? ' ativo' : '')} onClick={() => (gravando ? finalizar('manual') : gravar())} disabled={salvando}
        aria-label={gravando ? 'Parar e guardar o sonho' : 'Gravar o sonho'}>
        <span className="gravador-bola" aria-hidden="true">{gravando ? <Parar size={40} /> : <Mic size={46} w={2.1} />}</span>
        {gravando ? (
          <span className="gravador-texto">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ponto" style={{ background: '#FF6B5E' }} />
              <span style={{ fontSize: 15, fontWeight: 800 }}>gravando</span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{duracao(segundos)}</span>
            </span>
            <span className="onda">{niveis.map((n, i) => <span key={i} style={{ height: 4 + n * 26 }} />)}</span>
            <span className="gravador-dica">{semViuvas('Toque para parar e guardar. Se ficar em silêncio, guarda sozinho.')}</span>
          </span>
        ) : (
          <span className="gravador-texto">
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{salvando ? 'Guardando…' : 'Toque e fale'}</span>
            <span className="gravador-dica">{semViuvas(suportaTranscricao() ? 'Um toque já começa a gravar. Vira texto enquanto você fala.' : 'Um toque já começa a gravar. O áudio fica guardado no sonho.')}</span>
          </span>
        )}
      </button>

      {temTexto && !gravando && (
        <button className="btn btn-preto btn-grande" onClick={() => finalizar('manual')} disabled={salvando}>
          <Ok size={18} /> {salvando ? 'Guardando…' : 'Guardar o texto'}
        </button>
      )}
      <p className="aviso-privado"><Cadeado size={14} /> {semViuvas('Seus sonhos são privados. Só vê quem você escolher, um sonho por vez.')}</p>
    </div>
  );
}

function Guardado({ sonho, motivo, transcrevendo, outro }) {
  return (
    <div className="captura" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }} role="status">
      <span className="selo-ok" aria-hidden="true"><Ok size={44} /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <h1 className="titulo-m">Sonho guardado</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: 'var(--muted)', maxWidth: 360 }}>{semViuvas(MOTIVOS[motivo] || MOTIVOS.manual)}</p>
        <span className="rotulo">{dataLonga(sonho.sonhado_em)}</span>
        {transcrevendo && <p style={{ margin: 0, fontSize: 14, color: 'var(--azul)', fontWeight: 700 }}>Transformando o áudio em texto…</p>}
      </div>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Link className="btn btn-azul btn-grande" to="/app/acervo"><Mural size={18} /> Ir para o acervo</Link>
        <button type="button" className="btn btn-linha btn-grande" onClick={outro}><Mais size={18} /> Registrar outro sonho</button>
        <Link className="btn btn-grande" style={{ color: 'var(--muted)' }} to={'/app/sonho/' + sonho.id}><Caneta size={16} /> Dar título e temas</Link>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--subtle)' }}>{semViuvas('Pode fechar o app e voltar a dormir. O sonho fica privado, só seu.')}</p>
    </div>
  );
}
