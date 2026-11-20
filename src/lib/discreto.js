// Modo discreto: embaça títulos, relatos, temas e imagens dos sonhos em todo o app,
// mantendo a estrutura (mural, lista, calendário, Observações e a quantidade de sonhos).
// Para quando há alguém perto ou para mostrar o app sem mostrar os sonhos.
// Fica ligado ao trocar de tela e ao recarregar, até a pessoa desligar.
import { useSyncExternalStore } from 'react';

const CHAVE = 'sonhario:discreto';
const ouvintes = new Set();

function ler() {
  try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
}
let ligado = ler();

export function mudarDiscreto(v) {
  ligado = !!v;
  try { v ? localStorage.setItem(CHAVE, '1') : localStorage.removeItem(CHAVE); } catch { /* sem armazenamento: vale só nesta aba */ }
  ouvintes.forEach((f) => f());
}

function assinar(f) {
  ouvintes.add(f);
  // Outra aba ligou ou desligou.
  const deFora = (e) => { if (e.key === CHAVE) { ligado = ler(); f(); } };
  window.addEventListener('storage', deFora);
  return () => { ouvintes.delete(f); window.removeEventListener('storage', deFora); };
}

export function useDiscreto() {
  return useSyncExternalStore(assinar, () => ligado, () => false);
}
