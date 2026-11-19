/* global Buffer */
// Imagem da prévia do link de convite: foto de quem convidou, a frase e a marca do Sonhário.
// GET /api/og?token=… → PNG 1200×630. Com &tipo=terapeuta, é a prévia dos convites para o app
// (de terapeuta, de paciente ou de amigo), com a frase de cada um.
// Roda no Node, não no edge: no edge a função dava erro na Vercel e a prévia saía sem imagem.
import { readFile } from 'node:fs/promises';
import { ImageResponse } from '@vercel/og';
import { buscarConvite, fotoGrande, LOGO_SVG } from './_convite.js';

const fonte = (arq) => readFile(new URL('./_fontes/' + arq, import.meta.url));

// Monta os elementos sem JSX (este arquivo não passa pelo Vite).
const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

async function comoDataUrl(url) {
  if (!url) return '';
  try {
    const r = await fetch(url);
    if (!r.ok) return '';
    const tipo = r.headers.get('content-type') || 'image/jpeg';
    return `data:${tipo};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch {
    return '';
  }
}

// Se algo der errado, a prévia ainda mostra o ícone do Sonhário em vez de nada.
export async function GET(req) {
  try {
    const resposta = await desenhar(req);
    await resposta.clone().arrayBuffer(); // força o desenho aqui, para pegar erro
    return resposta;
  } catch (e) {
    console.error('og:', e);
    return Response.redirect(new URL('/icon-512.png', req.url), 302);
  }
}

async function desenhar(req) {
  const params = new URL(req.url).searchParams;
  const token = params.get('token') || '';
  const doApp = params.get('tipo') === 'terapeuta';
  const [convite, manrope400, manrope800, literataItalico] = await Promise.all([
    buscarConvite(token, doApp ? 'ver_convite_terapeuta' : 'ver_convite'),
    fonte('manrope-latin-400-normal.woff'),
    fonte('manrope-latin-800-normal.woff'),
    fonte('literata-latin-400-italic.woff'),
  ]);

  const nome = (convite?.dono_nome || '').trim() || 'Alguém';
  const foto = await comoDataUrl(fotoGrande(convite?.dono_foto));
  const logo = 'data:image/svg+xml;base64,' + Buffer.from(LOGO_SVG).toString('base64');
  const story = new URL(req.url).searchParams.get('formato') === 'story';
  const frase = FRASES[doApp ? (convite?.tipo || 'terapeuta') : 'sonho'] || FRASES.sonho;
  const arte = story ? cardStory(nome, foto, logo, frase) : cardLink(nome, foto, logo, frase);

  return new ImageResponse(arte, {
    width: story ? 1080 : 1200,
    height: story ? 1920 : 630,
    fonts: [
      { name: 'Manrope', data: manrope400, weight: 400, style: 'normal' },
      { name: 'Manrope', data: manrope800, weight: 800, style: 'normal' },
      { name: 'Literata', data: literataItalico, weight: 400, style: 'italic' },
    ],
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  });
}

// O que vem depois do nome, em duas linhas, e o convite para tocar no link.
const FRASES = {
  sonho: { linhas: ['quer compartilhar', 'um sonho com você'], pe: 'Entre com a sua conta Google para ver.', story: 'Toque no link para ver' },
  terapeuta: { linhas: ['convidou você para', 'registrar seus sonhos'], pe: 'Você escolhe, um por vez, o que mostrar.', story: 'Toque no link para começar' },
  paciente: { linhas: ['quer levar sonhos', 'para as sessões'], pe: 'Entre com a sua conta Google para acompanhar.', story: 'Toque no link para acompanhar' },
  amigo: { linhas: ['convidou você para', 'registrar seus sonhos'], pe: 'Cada um escolhe o que mostrar.', story: 'Toque no link para começar' },
};

const rostoDe = (nome, foto, tam, borda, fundo) => (foto
  ? img(foto, { width: tam, height: tam, borderRadius: 999, objectFit: 'cover', border: borda })
  : h('div', { width: tam, height: tam, borderRadius: 999, background: fundo, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(tam * 0.44), fontWeight: 800, border: borda }, nome.charAt(0).toUpperCase()));

// Prévia do link (WhatsApp etc.): 1200×630, fundo branco.
function cardLink(nome, foto, logo, frase) {
  const tamNome = nome.length > 26 ? 52 : nome.length > 20 ? 60 : 68;
  return h('div', { width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 72, padding: '0 90px', background: '#FFFFFF', fontFamily: 'Manrope', color: '#1F2328' },
    rostoDe(nome, foto, 340, '10px solid #DCE6F1', '#1A1A1A'),
    h('div', { display: 'flex', flexDirection: 'column', flex: 1 },
      h('div', { display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 800, color: '#1F2328', marginBottom: 44 },
        img(logo, { width: 48, height: 48, borderRadius: 12 }),
        'Sonhário'),
      h('div', { fontSize: tamNome, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 }, nome),
      h('div', { display: 'flex', flexDirection: 'column', fontFamily: 'Literata', fontStyle: 'italic', fontSize: 56, lineHeight: 1.12, color: '#0257AA', marginTop: 10 },
        h('span', {}, frase.linhas[0]),
        h('span', {}, frase.linhas[1])),
      h('div', { fontSize: 26, color: '#5B6570', marginTop: 40 }, frase.pe)));
}

// Story do Instagram: 1080×1920, fundo azul. O topo e o pé ficam livres para a interface
// do Instagram, e embaixo sobra lugar para a figurinha de link.
function cardStory(nome, foto, logo, frase) {
  const tamNome = nome.length > 26 ? 64 : nome.length > 18 ? 76 : 88;
  const seta = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#DCE6F1" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M5 13l7 7 7-7"/></svg>').toString('base64');
  return h('div', { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '250px 90px 0', background: '#0257AA', fontFamily: 'Manrope', color: '#FFFFFF', textAlign: 'center' },
    h('div', { display: 'flex', alignItems: 'center', gap: 18, fontSize: 44, fontWeight: 800 },
      img(logo, { width: 68, height: 68, borderRadius: 16 }),
      'Sonhário'),
    h('div', { display: 'flex', marginTop: 110 }, rostoDe(nome, foto, 500, '14px solid #FFFFFF', '#1A1A1A')),
    h('div', { display: 'flex', justifyContent: 'center', fontSize: tamNome, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, marginTop: 72 }, nome),
    h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Literata', fontStyle: 'italic', fontSize: 80, lineHeight: 1.12, color: '#DCE6F1', marginTop: 18 },
      h('span', {}, frase.linhas[0]),
      h('span', {}, frase.linhas[1])),
    h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: 96, fontSize: 36, color: '#DCE6F1' },
      frase.story,
      img(seta, { width: 56, height: 56 })));
}
