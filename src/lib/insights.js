// Insights: padrões do acervo, com nomes da psicologia analítica.
// Nada aqui interpreta sonhos: só conta o que se repete, some e volta.
// Cada insight desbloqueia quando o acervo tem dados suficientes para ele.

const DIA = 864e5;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function tempo(ms) {
  const d = Math.round(ms / DIA);
  if (d < 45) return d + ' dias';
  const m = Math.round(d / 30);
  if (m < 18) return m + (m === 1 ? ' mês' : ' meses');
  const a = Math.round(d / 365);
  return a + (a === 1 ? ' ano' : ' anos');
}
const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);

export function calcularInsights(sonhos, agora = Date.now()) {
  const comTema = sonhos.filter((s) => s.temas?.length);
  const ts = sonhos.map((s) => +new Date(s.sonhado_em));
  const primeiro = ts.length ? Math.min(...ts) : agora;
  const diasDeAcervo = Math.max(0, Math.floor((agora - primeiro) / DIA));

  // tema -> datas em que apareceu (em ordem)
  const ocorre = new Map();
  for (const s of comTema) for (const t of s.temas) {
    if (!ocorre.has(t)) ocorre.set(t, []);
    ocorre.get(t).push(+new Date(s.sonhado_em));
  }
  for (const v of ocorre.values()) v.sort((a, b) => a - b);

  const lista = [];

  // 1. Circum-ambulação: o que está voltando agora.
  {
    const itens = [...ocorre]
      .map(([tema, d]) => ({ tema, n: d.filter((x) => agora - x <= 30 * DIA).length }))
      .filter((x) => x.n >= 3).sort((a, b) => b.n - a.n).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: plural(x.n, 'sonho', 'sonhos') + ' nos últimos 30 dias' }));
    lista.push({
      id: 'circum', nome: 'Circum-ambulação', titulo: 'O que está voltando agora',
      termo: 'Para Jung, os sonhos andam em volta de um mesmo centro, como quem dá voltas num lugar até ele se mostrar.',
      liberado: comTema.length >= 10, atual: comTema.length, meta: 10, falta: 'sonhos com tema',
      itens, vazio: 'Nenhum tema apareceu 3 vezes nos últimos 30 dias.',
    });
  }

  // 2. Constelação: tema antigo que voltou depois de muito tempo.
  {
    const itens = [...ocorre]
      .filter(([, d]) => d.length >= 2 && agora - d[d.length - 1] <= 30 * DIA)
      .map(([tema, d]) => ({ tema, gap: d[d.length - 1] - d[d.length - 2] }))
      .filter((x) => x.gap >= 90 * DIA).sort((a, b) => b.gap - a.gap).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: 'voltou depois de ' + tempo(x.gap) + ' sem aparecer' }));
    lista.push({
      id: 'constelacao', nome: 'Constelação', titulo: 'Um tema antigo que voltou',
      termo: 'Jung dizia que um complexo “se constela” quando é ativado de novo pela vida. Um tema que reaparece depois de muito tempo pode estar nesse ponto.',
      liberado: diasDeAcervo >= 120, atual: diasDeAcervo, meta: 120, falta: 'dias de acervo',
      itens, vazio: 'Nenhum tema voltou depois de mais de 3 meses neste último mês.',
    });
  }

  // 3. Latência: temas frequentes que estão em silêncio.
  {
    const itens = [...ocorre]
      .filter(([, d]) => d.length >= 3 && agora - d[d.length - 1] >= 60 * DIA)
      .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
      .map(([tema, d]) => ({ tema, texto: plural(d.length, 'sonho', 'sonhos') + ' · o último há ' + tempo(agora - d[d.length - 1]) }));
    lista.push({
      id: 'latencia', nome: 'Latência', titulo: 'O que está em silêncio',
      termo: 'O que não aparece não desapareceu: fica latente no inconsciente. São temas que já foram frequentes e não voltam há mais de dois meses.',
      liberado: diasDeAcervo >= 90 && comTema.length >= 15, atual: Math.min(diasDeAcervo, 90), meta: 90, falta: 'dias de acervo (e 15 sonhos com tema)',
      itens, vazio: 'Todos os seus temas frequentes apareceram nos últimos 2 meses.',
    });
  }

  // 4. Complexo: temas que andam juntos.
  {
    const pares = new Map();
    for (const s of comTema) {
      const t = [...new Set(s.temas)].sort();
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
        const k = t[i] + '\u0000' + t[j];
        pares.set(k, (pares.get(k) || 0) + 1);
      }
    }
    const itens = [...pares].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, n]) => { const [a, b] = k.split('\u0000'); return { tema: a, par: b, texto: 'juntos em ' + plural(n, 'sonho', 'sonhos') }; });
    const multi = comTema.filter((s) => s.temas.length >= 2).length;
    lista.push({
      id: 'complexo', nome: 'Complexo', titulo: 'Temas que andam juntos',
      termo: 'Na psicologia analítica, um complexo é um núcleo de imagens e emoções que se atraem. Aqui, os temas que costumam aparecer no mesmo sonho.',
      liberado: multi >= 10, atual: multi, meta: 10, falta: 'sonhos com dois temas ou mais',
      itens, vazio: 'Nenhum par de temas apareceu junto 3 vezes ainda.',
    });
  }

  // 5. Enantiodromia: a virada entre um período e outro.
  {
    const recente = new Map(), anterior = new Map();
    for (const [tema, d] of ocorre) for (const x of d) {
      const idade = agora - x;
      if (idade <= 90 * DIA) recente.set(tema, (recente.get(tema) || 0) + 1);
      else if (idade <= 180 * DIA) anterior.set(tema, (anterior.get(tema) || 0) + 1);
    }
    const cederam = [...anterior].filter(([t, n]) => n >= 3 && (recente.get(t) || 0) <= Math.floor(n / 3)).sort((a, b) => b[1] - a[1]);
    const surgiram = [...recente].filter(([t, n]) => n >= 3 && (anterior.get(t) || 0) <= Math.floor(n / 3)).sort((a, b) => b[1] - a[1]);
    const itens = [
      ...surgiram.slice(0, 3).map(([t, n]) => ({ tema: t, texto: 'cresceu: ' + (anterior.get(t) || 0) + ' → ' + n + ' sonhos' })),
      ...cederam.slice(0, 3).map(([t, n]) => ({ tema: t, texto: 'recuou: ' + n + ' → ' + (recente.get(t) || 0) + ' sonhos' })),
    ];
    lista.push({
      id: 'enantiodromia', nome: 'Enantiodromia', titulo: 'A virada dos últimos meses',
      termo: 'Termo que Jung tomou de Heráclito: tudo, levado ao extremo, tende a virar no seu contrário. Compara os últimos 3 meses com os 3 anteriores.',
      liberado: diasDeAcervo >= 180, atual: diasDeAcervo, meta: 180, falta: 'dias de acervo',
      itens, vazio: 'Seus temas seguiram parecidos nos dois períodos.',
    });
  }

  // 6. Energia psíquica: o ritmo de lembrar.
  {
    const meses = [];
    const hoje = new Date(agora);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const n = sonhos.filter((s) => { const x = new Date(s.sonhado_em); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).length;
      meses.push({ rotulo: MESES[d.getMonth()], n });
    }
    const dias = new Map();
    for (const s of sonhos) { const k = new Date(s.sonhado_em).toDateString(); dias.set(k, (dias.get(k) || 0) + 1); }
    const varios = [...dias.values()].filter((n) => n >= 2).length;
    const ult30 = sonhos.filter((s) => agora - +new Date(s.sonhado_em) <= 30 * DIA).length;
    const itens = [
      { texto: plural(ult30, 'sonho lembrado', 'sonhos lembrados') + ' nos últimos 30 dias' },
      varios ? { texto: plural(varios, 'noite', 'noites') + ' com mais de um sonho' } : null,
    ].filter(Boolean);
    lista.push({
      id: 'energia', nome: 'Energia psíquica', titulo: 'O ritmo de lembrar',
      termo: 'Jung via a energia psíquica fluindo e refluindo, ora para fora, ora para dentro. Aqui, quantos sonhos você lembrou a cada mês.',
      liberado: diasDeAcervo >= 30 && sonhos.length >= 8, atual: Math.min(sonhos.length, 8), meta: 8, falta: 'sonhos em 30 dias de acervo',
      itens, meses, vazio: '',
    });
  }

  return { lista, total: sonhos.length, diasDeAcervo, liberados: lista.filter((i) => i.liberado).length };
}
