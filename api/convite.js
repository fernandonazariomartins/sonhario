// /convite/:token passa por aqui antes do app.
// O WhatsApp (e afins) não roda JavaScript: só lê as meta tags do HTML.
// Então devolve o mesmo index.html do app, com título, texto e imagem do convite.
import { buscarConvite, escapar } from './_convite.js';

export const config = { runtime: 'edge' };

const DESCRICAO_PADRAO = 'Sonhário: um caderno para lembrar, organizar e voltar aos seus sonhos.';

export default async function handler(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || url.pathname.split('/').pop() || '';
  const origem = `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host') || url.host}`;

  const convite = await buscarConvite(token);
  const nome = (convite?.dono_nome || '').trim();
  const titulo = convite ? `${nome || 'Alguém'} quer compartilhar um sonho com você` : 'Sonhário';
  const descricao = convite ? 'Abra o link e entre com a sua conta Google para ver. ' + DESCRICAO_PADRAO : DESCRICAO_PADRAO;
  const imagem = convite ? `${origem}/api/og?token=${encodeURIComponent(token)}` : `${origem}/icon-512.png`;
  const endereco = `${origem}/convite/${encodeURIComponent(token)}`;

  const metas = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Sonhário'],
    ['property', 'og:title', titulo],
    ['property', 'og:description', descricao],
    ['property', 'og:url', endereco],
    ['property', 'og:image', imagem],
    ['property', 'og:image:secure_url', imagem],
    ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', convite ? '1200' : '512'],
    ['property', 'og:image:height', convite ? '630' : '512'],
    ['property', 'og:image:alt', titulo],
    ['property', 'og:locale', 'pt_BR'],
    ['name', 'twitter:card', convite ? 'summary_large_image' : 'summary'],
    ['name', 'twitter:title', titulo],
    ['name', 'twitter:description', descricao],
    ['name', 'twitter:image', imagem],
  ].map(([a, k, v]) => `<meta ${a}="${k}" content="${escapar(v)}" />`).join('\n    ');

  let html;
  try {
    const r = await fetch(origem + '/index.html');
    if (!r.ok) throw new Error(String(r.status));
    html = await r.text();
  } catch {
    // Sem o app à mão: uma página mínima que só serve para a prévia e leva ao convite.
    html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>Sonhário</title><meta name="description" content="" /></head><body><p><a href="/">Abrir o Sonhário</a></p></body></html>`;
  }

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapar(titulo)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapar(descricao)}" />`)
    .replace('</head>', `    ${metas}\n  </head>`);

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300' },
  });
}
