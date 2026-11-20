// Versão nova no ar: o app instalado (ou uma aba aberta há tempo) continua rodando o código antigo
// até recarregar. Ao voltar para o app, confere se o site tem outra versão; se tiver,
// recarrega na próxima troca de tela, quando ninguém está no meio de um registro.
let nova = false;
const atual = () => document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src') || '';

async function conferir() {
  if (nova || !atual()) return;
  try {
    const html = await fetch('/', { cache: 'no-store' }).then((r) => r.text());
    const noSite = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
    if (noSite && !atual().endsWith(noSite)) nova = true;
  } catch { /* sem internet: fica como está */ }
}

export function vigiarVersao() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') conferir(); });
  setInterval(conferir, 30 * 60 * 1000);
  conferir();
}

// Chamado a cada troca de tela.
export function trocouDeTela() {
  if (nova) window.location.reload();
}
