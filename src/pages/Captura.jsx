// A tela que abre primeiro: escrever ou gravar o sonho logo ao acordar.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { novoSonho, dataLonga, duracao, tituloSugerido } from '../lib/sonhos.js';
import { iniciarGravacao, suportaGravacao, suportaTranscricao } from '../lib/gravador.js';
import { Mic, Parar, Ok } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

const RASCUNHO = 'sonhario:rascunho';

export default function Captura() {
  const { salvar, salvarAudio, avisar } = useEstado();
  const navegar = useNavigate();
  const [texto, setTexto] = useState(() => localStorage.getItem(RASCUNHO) || '');
  const [parcial, setParcial] = useState('');
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [niveis, setNiveis] = useState(() => Array(32).fill(0.1));
  const [audio, setAudio] = useState(null); // { blob, duracao, url }
  const [salvando, setSalvando] = useState(false);
  const sessao = useRef(null);
  const base = useRef('');
  const agora = useRef(new Date().toISOString());

  useEffect(() => { localStorage.setItem(RASCUNHO, texto); }, [texto]);
  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - sessao.current.inicio) / 1000)), 250);
    return () => clearInterval(t);
  }, [gravando]);

  async function alternar() {
    if (gravando) {
      const r = await sessao.current.parar();
      setGravando(false);
      setParcial('');
      setAudio({ ...r, url: URL.createObjectURL(r.blob) });
      return;
    }
    if (!suportaGravacao()) { avisar('Este navegador não grava áudio. Dá para escrever o sonho.'); return; }
    try {
      base.current = texto ? texto.trim() + ' ' : '';
      sessao.current = await iniciarGravacao({
        aoTranscrever: (finais, p) => { setTexto((base.current + finais).trimStart()); setParcial(p); },
        aoNivel: (n) => setNiveis((v) => [...v.slice(1), Math.max(0.08, n)]),
      });
      setSegundos(0);
      setGravando(true);
    } catch {
      avisar('Não deu para usar o microfone. Confira a permissão do navegador.');
    }
  }

  async function guardar() {
    if (gravando) await alternar();
    if (!texto.trim() && !audio) { avisar('Escreva ou grave alguma coisa antes de guardar.'); return; }
    setSalvando(true);
    const sonho = novoSonho({ texto: texto.trim(), titulo: '', sonhado_em: agora.current });
    try {
      if (audio) sonho.audio = { ref: await salvarAudio(sonho.id, audio.blob), duracao: audio.duracao };
    } catch (e) { avisar('O áudio não foi salvo: ' + e.message); }
    await salvar(sonho);
    localStorage.removeItem(RASCUNHO);
    setSalvando(false);
    navegar('/app/sonho/' + sonho.id + '?novo=1');
  }

  return (
    <div style={{ flex: 1, width: '100%', maxWidth: 640, margin: '0 auto', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="rotulo">{dataLonga(agora.current)}</span>
        <h1 className="titulo-m">O que você sonhou?</h1>
      </div>

      <label htmlFor="sonho" className="sr">Texto do sonho</label>
      <textarea id="sonho" value={texto + (parcial ? (texto ? ' ' : '') + parcial : '')} onChange={(e) => { setTexto(e.target.value); setParcial(''); }}
        placeholder={"Escreva do jeito que vier. Frase solta também\u00a0vale."} readOnly={gravando}
        style={{ flex: 1, minHeight: 200, resize: 'none', padding: 16, border: '1px solid var(--line-strong)', borderRadius: 12, fontFamily: 'var(--serif)', fontSize: 16.5, lineHeight: 1.7, background: '#fff' }} />

      <section aria-label="Gravador" className="painel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" className={'gravar' + (gravando ? ' ativo' : '')} onClick={alternar} aria-label={gravando ? 'Parar gravação' : 'Começar a gravar'}>
          {gravando ? <Parar /> : <Mic size={30} w={2.2} />}
        </button>
        {gravando ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ponto" style={{ background: '#DC2626' }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>gravando</span>
              <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{duracao(segundos)}</span>
            </div>
            <div className="onda" aria-hidden="true">{niveis.map((n, i) => <span key={i} style={{ height: 4 + n * 24 }} />)}</div>
          </div>
        ) : audio ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>Áudio de {duracao(audio.duracao)} pronto</span>
            <audio src={audio.url} controls style={{ width: '100%', height: 36 }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Toque e fale</span>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
              {semViuvas(suportaTranscricao() ? 'O áudio fica guardado e vira texto enquanto você fala.' : 'O áudio fica guardado junto do sonho. Dá para gravar e escrever no mesmo sonho.')}
            </span>
          </div>
        )}
      </section>

      <button className="btn btn-azul btn-grande" onClick={guardar} disabled={salvando}>
        <Ok size={18} /> {salvando ? 'Guardando…' : 'Guardar no sonhário'}
      </button>
      <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
        Fica como <strong style={{ color: 'var(--ink)' }}>não aberto</strong>. Temas você coloca depois, com&nbsp;calma.
      </p>
      {texto && !gravando && <p className="sr" aria-live="polite">Sugestão de título: {tituloSugerido(texto)}</p>}
    </div>
  );
}
