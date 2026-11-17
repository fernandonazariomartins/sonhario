// Imagens de um sonho: miniaturas, adicionar (arquivo, câmera ou colar), tirar e ver grande.
import { useEffect, useState } from 'react';
import { Fechar, Imagem, Voltar, Avancar } from './Icones.jsx';
import { reduzirImagem, MAX_POR_SONHO } from '../lib/imagens.js';
import { novoId } from '../lib/sonhos.js';

export function useUrlImagem(ref, resolver) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let vivo = true;
    setUrl(null);
    if (ref) resolver(ref).then((u) => vivo && setUrl(u)).catch(() => {});
    return () => { vivo = false; };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
  return url;
}

export function Miniatura({ img, resolver, alt = '', style, ...resto }) {
  const url = useUrlImagem(img.ref, resolver);
  const proporcao = img.largura && img.altura ? img.largura + ' / ' + img.altura : '4 / 3';
  return url
    ? <img src={url} alt={alt} loading="lazy" decoding="async" style={{ display: 'block', width: '100%', aspectRatio: proporcao, objectFit: 'cover', background: 'var(--cinza)', ...style }} {...resto} />
    : <span aria-hidden="true" style={{ display: 'block', width: '100%', aspectRatio: proporcao, background: 'var(--cinza)', ...style }} />;
}

// Visualizador em tela cheia, com setas entre as imagens do sonho.
function Ver({ imagens, i, setI, resolver }) {
  const img = imagens[i];
  const url = useUrlImagem(img?.ref, resolver);
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'Escape') setI(null);
      if (e.key === 'ArrowRight' && i < imagens.length - 1) setI(i + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [i, imagens.length, setI]);
  if (!img) return null;
  const seta = { width: 48, height: 48, borderRadius: 999, border: 0, background: 'rgba(255,255,255,.14)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div role="dialog" aria-modal="true" aria-label={'Imagem ' + (i + 1) + ' de ' + imagens.length} onClick={(e) => e.target === e.currentTarget && setI(null)}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,17,20,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }}>
      <button type="button" onClick={() => setI(null)} aria-label="Fechar" style={{ ...seta, position: 'absolute', top: 16, right: 16 }}><Fechar size={18} /></button>
      {i > 0 && <button type="button" onClick={() => setI(i - 1)} aria-label="Imagem anterior" style={seta}><Voltar size={22} /></button>}
      {url ? <img src={url} alt="" style={{ maxWidth: 'min(1400px, 100%)', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
        : <span style={{ color: '#fff', fontSize: 14 }}>Carregando…</span>}
      {i < imagens.length - 1 && <button type="button" onClick={() => setI(i + 1)} aria-label="Próxima imagem" style={seta}><Avancar size={22} /></button>}
      {imagens.length > 1 && <span style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700 }}>{i + 1} de {imagens.length}</span>}
    </div>
  );
}

// Lê os arquivos, reduz e envia. Devolve as imagens prontas para entrar no sonho.
export async function prepararImagens(arquivos, sonhoId, salvarImagem, aoAndar) {
  const prontas = [];
  const erros = [];
  let n = 0;
  for (const f of arquivos) {
    try {
      const { blob, largura, altura } = await reduzirImagem(f);
      const ref = await salvarImagem(sonhoId, blob);
      prontas.push({ id: novoId(), ref, largura, altura, bytes: blob.size, em: new Date().toISOString() });
    } catch (e) { erros.push(e.message); }
    aoAndar?.(++n);
  }
  return { prontas, erros };
}

// Bloco editável na página do sonho (ou só leitura, sem "mudar").
export function ImagensDoSonho({ s, mudar, salvarImagem, apagarImagens, resolver, avisar }) {
  const [vendo, setVendo] = useState(null);
  const [enviando, setEnviando] = useState(0);
  const imagens = s.imagens || [];
  const editavel = !!mudar;
  const cabem = MAX_POR_SONHO - imagens.length;

  async function adicionar(lista) {
    const arquivos = [...lista].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!arquivos.length) return;
    if (cabem <= 0) { avisar(`Cada sonho guarda até ${MAX_POR_SONHO} imagens.`); return; }
    const escolhidos = arquivos.slice(0, cabem);
    setEnviando(escolhidos.length);
    const { prontas, erros } = await prepararImagens(escolhidos, s.id, salvarImagem);
    setEnviando(0);
    if (prontas.length) mudar({ imagens: [...imagens, ...prontas] }, true);
    if (erros.length) avisar(erros[0]);
    else if (arquivos.length > escolhidos.length) avisar(`Entraram ${escolhidos.length}. Cada sonho guarda até ${MAX_POR_SONHO} imagens.`);
  }

  // Colar uma imagem (Ctrl+V / Cmd+V) em qualquer lugar da página do sonho.
  useEffect(() => {
    if (!editavel) return;
    const colar = (e) => {
      const arquivos = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
      if (!arquivos.length) return;
      e.preventDefault();
      adicionar(arquivos);
    };
    document.addEventListener('paste', colar);
    return () => document.removeEventListener('paste', colar);
  });

  function tirar(img) {
    if (!confirm('Tirar esta imagem do sonho?')) return;
    mudar({ imagens: imagens.filter((x) => x.id !== img.id) }, true);
    apagarImagens([img.ref]).catch(() => {});
  }

  if (!editavel && !imagens.length) return null;
  return (
    <section aria-labelledby="t-imagens" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 id="t-imagens" className="sr">Imagens</h2>
      {imagens.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: imagens.length === 1 ? 'minmax(0, 520px)' : 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {imagens.map((img, k) => (
            <li key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <button type="button" onClick={() => setVendo(k)} aria-label={'Ver a imagem ' + (k + 1)} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}>
                <Miniatura img={img} resolver={resolver} style={imagens.length === 1 ? { aspectRatio: 'auto', maxHeight: 420, objectFit: 'contain' } : { aspectRatio: '1 / 1' }} />
              </button>
              {editavel && (
                <button type="button" onClick={() => tirar(img)} aria-label={'Tirar a imagem ' + (k + 1)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: 999, border: 0, background: 'rgba(26,26,26,.72)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fechar size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editavel && cabem > 0 && (
        <label className="btn btn-tracejado" style={{ alignSelf: 'flex-start', minHeight: 38, fontSize: 13, cursor: enviando ? 'progress' : 'pointer' }} aria-disabled={!!enviando}>
          <Imagem size={16} /> {enviando ? (enviando === 1 ? 'Enviando a imagem…' : `Enviando ${enviando} imagens…`) : imagens.length ? 'Mais imagens' : 'Adicionar imagem'}
          <input type="file" accept="image/*,.heic,.heif" multiple className="sr" disabled={!!enviando} onChange={(e) => { adicionar(e.target.files); e.target.value = ''; }} />
        </label>
      )}
      {vendo !== null && <Ver imagens={imagens} i={vendo} setI={setVendo} resolver={resolver} />}
    </section>
  );
}
