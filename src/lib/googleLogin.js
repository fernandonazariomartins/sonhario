// Login com o botão do próprio Google (Google Identity Services).
// O fluxo acontece aqui no site: a tela do Google mostra o nome do app/o nosso domínio,
// e não o endereço do Supabase. O token volta para cá e é entregue ao Supabase.
import { supabase } from './supabase.js';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// iPhone com o app instalado na tela inicial: a janelinha do Google não volta bem para o app,
// então ali continua o login antigo, por redirecionamento.
const iosInstalado = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  (navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches);

export const usaBotaoGoogle = () => !!(supabase && GOOGLE_CLIENT_ID) && !iosInstalado();

let carregando = null;
export function carregarGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (carregando) return carregando;
  carregando = new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok(window.google);
    s.onerror = () => { carregando = null; falha(new Error('Não deu para carregar o login do Google.')); };
    document.head.appendChild(s);
  });
  return carregando;
}

async function sha256(texto) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Desenha o botão oficial do Google dentro de `el`. Chama aoEntrar/aoErro no fim.
export async function desenharBotaoGoogle(el, { aoEntrar, aoErro }) {
  const google = await carregarGoogle();
  const nonce = crypto.randomUUID() + crypto.randomUUID();
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: await sha256(nonce), // o Google recebe o hash; o Supabase confere com o original
    use_fedcm_for_button: true,
    callback: async ({ credential }) => {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce });
      if (error) aoErro?.(error); else aoEntrar?.();
    },
  });
  el.innerHTML = '';
  google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    logo_alignment: 'left',
    locale: 'pt-BR',
    width: Math.min(el.clientWidth || 320, 400),
  });
}
