// Imagem da prévia do link de convite: foto de quem convidou, a frase e a marca do Sonhário.
// GET /api/og?token=… → PNG 1200×630.
import { ImageResponse } from '@vercel/og';
import { buscarConvite, fotoGrande, LOGO_SVG } from './_convite.js';

export const config = { runtime: 'edge' };

const fonte = (arq) => fetch(new URL('./_fontes/' + arq, import.meta.url)).then((r) => r.arrayBuffer());

// Monta os elementos sem JSX (este arquivo não passa pelo Vite).
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

async function comoDataUrl(url) {
  if (!url) return '';
  try {
    const r = await fetch(url);
    if (!r.ok) return '';
    const tipo = r.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(await r.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${tipo};base64,${btoa(bin)}`;
  } catch {
    return '';
  }
}

export default async function handler(req) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const [convite, manrope400, manrope800, literataItalico] = await Promise.all([
    buscarConvite(token),
    fonte('manrope-latin-400-normal.woff'),
    fonte('manrope-latin-800-normal.woff'),
    fonte('literata-latin-400-italic.woff'),
  ]);

  const nome = (convite?.dono_nome || '').trim() || 'Alguém';
  const foto = await comoDataUrl(fotoGrande(convite?.dono_foto));
  const logo = 'data:image/svg+xml;base64,' + btoa(LOGO_SVG);
  const tamNome = nome.length > 26 ? 52 : nome.length > 20 ? 60 : 68;

  const rosto = foto
    ? img(foto, { width: 340, height: 340, borderRadius: 999, objectFit: 'cover', border: '10px solid #DCE6F1' })
    : h('div', { width: 340, height: 340, borderRadius: 999, background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 150, fontWeight: 800 }, nome.charAt(0).toUpperCase());

  const arte = h('div', { width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 72, padding: '0 90px', background: '#FFFFFF', fontFamily: 'Manrope', color: '#1F2328' },
    rosto,
    h('div', { display: 'flex', flexDirection: 'column', flex: 1 },
      h('div', { display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 800, color: '#1F2328', marginBottom: 44 },
        img(logo, { width: 48, height: 48, borderRadius: 12 }),
        'Sonhário'),
      h('div', { fontSize: tamNome, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 }, nome),
      h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Literata', fontStyle: 'italic', fontSize: 56, lineHeight: 1.12, color: '#0257AA', marginTop: 10 },
        h('span', {}, 'quer compartilhar'),
        h('span', {}, 'um sonho com você')),
      h('div', { fontSize: 26, color: '#5B6570', marginTop: 40 }, 'Entre com a sua conta Google para ver.')));

  return new ImageResponse(arte, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Manrope', data: manrope400, weight: 400, style: 'normal' },
      { name: 'Manrope', data: manrope800, weight: 800, style: 'normal' },
      { name: 'Literata', data: literataItalico, weight: 400, style: 'italic' },
    ],
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}
