// Instalação do app pelo site (sem loja).
// No Android/Chrome e no computador, o navegador oferece o evento "beforeinstallprompt":
// guardamos esse evento e o botão "Instalar" chama a janela nativa de instalação.
// No iPhone (Safari) não existe esse evento: mostramos o passo a passo.
import { useEffect, useState } from 'react';
import { instalado, ehIphone } from './lembrete.js';

let pedido = null; // evento guardado
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f());
const CHAVE_RECEM = 'sonhario:recem-instalado';

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pedido = e;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    pedido = null;
    try { localStorage.setItem(CHAVE_RECEM, '1'); } catch { /* sem armazenamento */ }
    avisar();
  });
}

export const ehAndroid = () => /Android/i.test(navigator.userAgent);
export const ehCelular = () => ehIphone() || ehAndroid();

// Primeira abertura do app instalado: devolve true uma única vez.
export function primeiraVezInstalado() {
  if (!instalado()) return false;
  try {
    if (localStorage.getItem('sonhario:boas-vindas-app')) return false;
    localStorage.setItem('sonhario:boas-vindas-app', '1');
    localStorage.removeItem(CHAVE_RECEM);
    return true;
  } catch { return false; }
}

export function useInstalar() {
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((x) => x + 1);
    ouvintes.add(f);
    return () => ouvintes.delete(f);
  }, []);
  let jaInstalou = false;
  try { jaInstalou = localStorage.getItem(CHAVE_RECEM) === '1'; } catch { /* nada */ }
  return {
    instalado: instalado(),
    acabouDeInstalar: jaInstalou && !instalado(),
    podeInstalar: !!pedido,
    async instalar() {
      if (!pedido) return 'sem-pedido';
      const e = pedido;
      pedido = null;
      e.prompt();
      const { outcome } = await e.userChoice;
      avisar();
      return outcome; // 'accepted' | 'dismissed'
    },
  };
}
