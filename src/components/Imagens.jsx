// As imagens de um sonho: miniaturas que abrem grandes num toque.
// Com "aoAdicionar" e "aoTirar", a pessoa também põe e tira imagens (no próprio sonho).
import { useEffect, useState } from 'react';
import Janela from './Janela.jsx';
import { Fechar, Imagem } from './Icones.jsx';

export default function Imagens({ imagens = [], urlDe, aoAdicionar, aoTirar }) {
  const [urls, setUrls] = useState({});
  const [aberta, setAberta] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const chave = imagens.map((i) => i.ref).join('|');

  useEffect(() => {
    let vivo = true;
    Promise.all(imagens.map(async (i) => [i.ref, await urlDe(i.ref).catch(() => null)]))
      .then((pares) => vivo && setUrls(Object.fromEntries(pares)));
    return () => { vivo = false; };
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!imagens.length && !aoAdicionar) return null;

  async function escolher(e) {
    const arquivos = [...e.target.files];
    e.target.value = '';
    if (!arquivos.length) return;
    setEnviando(true);
    try { await aoAdicionar(arquivos); } finally { setEnviando(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {imagens.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, maxWidth: 680 }}>
          {imagens.map((im, k) => (
            <div key={im.ref} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#F2F4F7' }}>
              <button type="button" onClick={() => setAberta(im)} aria-label={'Abrir a imagem ' + (k + 1)}
                style={{ border: 0, padding: 0, width: '100%', height: '100%', background: 'transparent', cursor: 'zoom-in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {urls[im.ref]
                  ? <img src={urls[im.ref]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span style={{ color: 'var(--muted)', display: 'inline-flex' }}><Imagem size={22} /></span>}
              </button>
              {aoTirar && (
                <button type="button" onClick={() => aoTirar(im)} aria-label={'Tirar a imagem ' + (k + 1)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: 999, border: 0, background: 'rgba(17,24,39,.65)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fechar size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {aoAdicionar && (
        <label className="btn btn-tracejado" style={{ alignSelf: 'flex-start' }}>
          <Imagem size={16} /> {enviando ? 'Guardando a imagem…' : imagens.length ? 'Adicionar outra imagem' : 'Adicionar imagem'}
          <input type="file" accept="image/*" multiple onChange={escolher} className="sr" disabled={enviando} />
        </label>
      )}
      {aberta && (
        <Janela titulo="Imagem do sonho" aoFechar={() => setAberta(null)}>
          {urls[aberta.ref]
            ? <img src={urls[aberta.ref]} alt="" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8, alignSelf: 'center' }} />
            : <p style={{ margin: 0, color: 'var(--muted)' }}>Este navegador não abre esse formato de imagem.</p>}
        </Janela>
      )}
    </div>
  );
}
