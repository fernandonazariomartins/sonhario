// Novidades nas Observações: o que mudou desde a última vez que a pessoa abriu a tela.
// Guarda no aparelho um retrato de cada observação (só chaves e números, nada do relato
// sai daqui) e marca como "com novidade" a que mudou, por alguns dias.

const DIA = 864e5;
export const DIAS_DE_DESTAQUE = 7;
const chave = (uid) => 'sonhario-observacoes-vistas:' + (uid || 'aparelho');

// Uma linha da observação vira uma chave estável (quem é) e um valor (o que diz).
// Tira o "há N dias/meses", que muda só com o passar do tempo.
const limpar = (t = '') => t.replace(/\s*·?\s*o último há .*$/, '').replace(/\bhá \d+ (dias?|m[eê]s(es)?|anos?)\b/g, '').trim();
export function linhas(i) {
  return (i.itens || []).map((x, k) => {
    const quem = [x.tema, x.par, x.palavra, x.sonho?.id].filter(Boolean).join('+');
    const valor = limpar(x.texto);
    // Linhas só de texto (Energia, Confronto): a chave é o texto sem os números.
    return { chave: quem || 'k' + k + ':' + valor.replace(/[\d.,]+/g, '#'), valor };
  });
}

function ler(uid) {
  try { return JSON.parse(localStorage.getItem(chave(uid))) || null; } catch { return null; }
}
export function guardar(uid, vistas) {
  try { localStorage.setItem(chave(uid), JSON.stringify(vistas)); } catch { /* sem armazenamento */ }
}

// Compara as observações de agora com o retrato guardado.
// Devolve o retrato novo e, para cada observação com novidade, { quando, nova, linhas: Set }.
export function compararNovidades(lista, uid, agora = Date.now()) {
  const antes = ler(uid);
  const primeiraVez = !antes;
  const vistas = {};
  const novidades = {};
  for (const i of lista) {
    const ls = linhas(i);
    const atual = Object.fromEntries(ls.map((l) => [l.chave, l.valor]));
    const velho = antes?.[i.id];
    let quando = velho?.quando || 0, nova = !!velho?.nova, mudaram = velho?.mudaram || [];
    if (!primeiraVez) {
      if (!velho) { quando = agora; nova = true; mudaram = ls.map((l) => l.chave); }
      else {
        const diff = ls.filter((l) => velho.linhas?.[l.chave] !== l.valor).map((l) => l.chave);
        if (diff.length) { quando = agora; nova = false; mudaram = diff; }
      }
    }
    vistas[i.id] = { linhas: atual, quando, nova, mudaram };
    if (quando && agora - quando <= DIAS_DE_DESTAQUE * DIA) novidades[i.id] = { quando, nova, linhas: new Set(mudaram) };
  }
  return { vistas, novidades };
}

export function quandoFoi(ms, agora = Date.now()) {
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0);
  if (ms >= +hoje) return 'hoje';
  const d = Math.ceil((+hoje - ms) / DIA);
  if (d <= 1) return 'ontem';
  return 'há ' + d + ' dias';
}
