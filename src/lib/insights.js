// Insights: padrões do acervo, com nomes da psicologia analítica.
// Nada aqui interpreta sonhos: só conta o que se repete, some e volta.
// Só aparece o insight que tem algo a mostrar no acervo de cada pessoa.
import { normalizar, singular, ehSimbolo } from './coresTema.js';

const DIA = 864e5;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
const SEMANA_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function tempo(ms) {
  const d = Math.round(ms / DIA);
  if (d < 45) return d + ' dias';
  const m = Math.round(d / 30);
  if (m < 18) return m + (m === 1 ? ' mês' : ' meses');
  const a = Math.round(d / 365);
  return a + (a === 1 ? ' ano' : ' anos');
}
const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
const dataDe = (ms) => { const d = new Date(ms); return d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const mesAno = (ms) => { const d = new Date(ms); return MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const refSonho = (s) => ({ id: s.id, titulo: s.titulo?.trim() || '' });

// Estações no hemisfério sul.
const ESTACAO = (mes) => (mes === 11 || mes <= 1 ? 'verão' : mes <= 4 ? 'outono' : mes <= 7 ? 'inverno' : 'primavera');

// Figuras e lugares que costumam aparecer nos relatos (sem acento, no singular).
const FIGURAS = 'mae pai irma irmao avo filho filha crianca bebe menino menina homem mulher amigo amiga namorado namorada marido esposa ex chefe colega professor professora desconhecido estranho policial medico velho velha tio tia primo prima'.split(' ');
const LUGARES = 'casa apartamento quarto sala cozinha banheiro porao sotao escada elevador predio escola faculdade universidade trabalho escritorio igreja hospital rua estrada avenida cidade praia mar rio lago piscina floresta mata montanha fazenda sitio aeroporto aviao carro onibus trem metro barco shopping loja mercado festa hotel cemiterio'.split(' ');

// Nome, pergunta e explicação de cada insight. Também usados nos exemplos e nos bloqueados.
export const META = {
  primordiais: { id: 'primordiais', nome: 'Imagens primordiais', titulo: 'Os temas centrais do seu acervo',
    termo: 'Jung chamava de imagens primordiais as figuras que voltam ao longo de uma vida inteira. Aqui, os temas que mais aparecem em todos os seus sonhos.' },
  circum: { id: 'circum', nome: 'Circum-ambulação', titulo: 'O que está voltando agora',
    termo: 'Para Jung, os sonhos andam em volta de um mesmo centro, como quem dá voltas num lugar até ele se mostrar.' },
  constelacao: { id: 'constelacao', nome: 'Constelação', titulo: 'Um tema antigo que voltou',
    termo: 'Jung dizia que um complexo “se constela” quando é ativado de novo pela vida. Um tema que reaparece depois de muito tempo pode estar nesse ponto.' },
  serie: { id: 'serie', nome: 'Série', titulo: 'Temas que tomaram sonhos seguidos',
    termo: 'Jung preferia ler os sonhos em série, não um a um: o sentido aparece na sequência. Aqui, os temas que estiveram em vários sonhos em sequência.' },
  recorrente: { id: 'recorrente', nome: 'Motivo recorrente', titulo: 'O que atravessa os anos',
    termo: 'Os sonhos recorrentes eram, para Jung, sinal de uma questão que ainda pede resposta. Aqui, temas presentes em três anos diferentes ou mais.' },
  latencia: { id: 'latencia', nome: 'Latência', titulo: 'O que está em silêncio',
    termo: 'O que não aparece não desapareceu: fica latente no inconsciente. São temas que já foram frequentes e não voltam há mais de dois meses.' },
  complexo: { id: 'complexo', nome: 'Complexo', titulo: 'Temas que andam juntos',
    termo: 'Na psicologia analítica, um complexo é um núcleo de imagens e emoções que se atraem. Aqui, os temas que costumam aparecer no mesmo sonho.' },
  enantiodromia: { id: 'enantiodromia', nome: 'Enantiodromia', titulo: 'A virada dos últimos meses',
    termo: 'Termo que Jung tomou de Heráclito: tudo, levado ao extremo, tende a virar no seu contrário. Compara os últimos 3 meses com os 3 anteriores.' },
  figuras: { id: 'figuras', nome: 'Personificação', titulo: 'Quem aparece nos seus sonhos',
    termo: 'Jung notou que o inconsciente se apresenta em pessoas, conhecidas ou não. Aqui, as pessoas mais citadas nos seus relatos, pelo papel ou pelo nome, e as imagens que costumam aparecer no mesmo sonho que elas.' },
  lugares: { id: 'lugares', nome: 'Topografia', titulo: 'Os lugares onde você sonha',
    termo: 'Num sonho famoso, Jung desceu pelos andares de uma casa até o porão e viu ali uma imagem da própria psique. Aqui, os cenários que mais voltam nos relatos.' },
  associacao: { id: 'associacao', nome: 'Associação', titulo: 'Escritos, mas nunca marcados',
    termo: 'No teste de associação de Jung, o que importava era o que passava sem ser notado. Aqui, imagens frequentes nos relatos que ainda não viraram tema.' },
  grandes: { id: 'grandes', nome: 'Grande sonho', titulo: 'Os sonhos mais complexos',
    termo: 'Jung separava os sonhos pequenos, do dia a dia, dos grandes sonhos, cheios de imagens e lembrados por anos. Aqui, os relatos com mais temas, pessoas, lugares e imagens. Não diz qual sonho importa mais: mostra onde há mais material para levar à sessão.' },
  inicial: { id: 'inicial', nome: 'Sonho inicial', titulo: 'Onde o seu acervo começou',
    termo: 'Jung dava peso especial ao primeiro sonho de um processo: muitas vezes ele antecipa o caminho inteiro. Este é o primeiro do seu acervo.' },
  ciclo: { id: 'ciclo', nome: 'Ciclo', titulo: 'Nesta época, em outros anos',
    termo: 'A psique tem o seu próprio calendário: datas e estações carregadas costumam voltar. Aqui, o que você sonhou nestes mesmos dias em anos anteriores.' },
  estacoes: { id: 'estacoes', nome: 'Ritmo das estações', titulo: 'Temas que têm época',
    termo: 'Jung via a psique ligada aos ciclos da natureza. Aqui, temas que se concentram numa mesma estação do ano.' },
  confronto: { id: 'confronto', nome: 'Confronto', titulo: 'O que ainda pede elaboração',
    termo: 'Jung falava em confronto com o inconsciente: dar forma e resposta ao que o sonho trouxe. Aqui, o que você marcou e ainda está em aberto.' },
  energia: { id: 'energia', nome: 'Energia psíquica', titulo: 'O ritmo de lembrar',
    termo: 'Jung via a energia psíquica fluindo e refluindo, ora para fora, ora para dentro. Aqui, quantos sonhos você lembrou a cada mês.' },
  semana: { id: 'semana', nome: 'Ritmo semanal', titulo: 'Os dias em que você mais lembra',
    termo: 'A rotina mexe com o sono e com a lembrança. Fins de semana e dias de descanso costumam trazer mais sonhos, mas cada pessoa tem o seu ritmo.' },
};

function palavrasDe(s) {
  const bruto = ((s.titulo || '') + ' ' + (s.texto || '')).toLowerCase().match(/[\p{L}]+/gu) || [];
  const mapa = new Map(); // forma normalizada no singular -> forma original
  for (const p of bruto) {
    if (p.length < 2) continue;
    const n = singular(normalizar(p));
    if (!mapa.has(n)) mapa.set(n, p);
  }
  return mapa;
}

// Meses, dias e palavras que aparecem com maiúscula sem ser nome de alguém.
const NAO_NOMES = new Set(('janeiro fevereiro marco abril maio junho julho agosto setembro outubro novembro dezembro '
  + 'domingo segunda terca quarta quinta sexta sabado natal pascoa deus jesus brasil eu ele ela voce nos eles elas '
  + 'meu minha seu sua dele dela isso aquilo depois entao quando mas porque ai la sim nao ok tipo').split(' '));

// Nomes próprios: palavras com maiúscula no meio da frase que nunca aparecem em minúscula.
function nomesPorRelato(sonhos) {
  const minusculas = new Set();
  const porRelato = sonhos.map((s) => {
    const achados = new Map();
    const frases = ((s.texto || '')).split(/[.!?…:;\n]+|["“”«»—–-]\s*/);
    for (const f of frases) {
      const ps = f.match(/[\p{L}]+/gu) || [];
      ps.forEach((p, k) => {
        if (/^\p{Ll}/u.test(p)) { minusculas.add(normalizar(p)); return; }
        if (k === 0 || p.length < 3 || p === p.toUpperCase()) return;
        const n = normalizar(p);
        if (!NAO_NOMES.has(n) && !achados.has(n)) achados.set(n, p);
      });
    }
    return achados;
  });
  return porRelato.map((m) => new Map([...m].filter(([n]) => !minusculas.has(n))));
}

const contarPalavrasDoTexto = (s) => (((s.titulo || '') + ' ' + (s.texto || '')).match(/[\p{L}]+/gu) || []).length;

export function calcularInsights(sonhos, agora = Date.now()) {
  const ordenados = [...sonhos].sort((a, b) => +new Date(a.sonhado_em) - +new Date(b.sonhado_em));
  const comTema = ordenados.filter((s) => s.temas?.length);
  const primeiro = ordenados.length ? +new Date(ordenados[0].sonhado_em) : agora;
  const diasDeAcervo = Math.max(0, Math.floor((agora - primeiro) / DIA));

  // tema -> datas em que apareceu (em ordem)
  const ocorre = new Map();
  for (const s of comTema) for (const t of new Set(s.temas)) {
    if (!ocorre.has(t)) ocorre.set(t, []);
    ocorre.get(t).push(+new Date(s.sonhado_em));
  }
  const temasNorm = new Set([...ocorre.keys()].map((t) => singular(normalizar(t))));

  // Palavras de cada relato, calculadas uma vez só.
  const palavras = ordenados.map(palavrasDe);
  const contarPalavras = (alvo) => {
    const n = new Map(), forma = new Map();
    palavras.forEach((m) => { for (const [k, orig] of m) if (alvo(k)) { n.set(k, (n.get(k) || 0) + 1); if (!forma.has(k)) forma.set(k, orig); } });
    return [...n].map(([k, c]) => ({ k, n: c, forma: forma.get(k) })).sort((a, b) => b.n - a.n);
  };

  const lista = [];
  const add = (i) => { if ((i.itens && i.itens.length) || (i.barras && i.barras.some((b) => b.n))) lista.push(i); };

  // 1. Imagens primordiais: os temas que sustentam o acervo.
  add({
    ...META.primordiais,
    itens: [...ocorre].filter(([, d]) => d.length >= 3).sort((a, b) => b[1].length - a[1].length).slice(0, 6)
      .map(([tema, d]) => ({ tema, texto: plural(d.length, 'sonho', 'sonhos') + ' · ' + Math.round((d.length / comTema.length) * 100) + '% do acervo' })),
  });

  // 2. Circum-ambulação: o que está voltando agora.
  add({
    ...META.circum,
    itens: [...ocorre]
      .map(([tema, d]) => ({ tema, n: d.filter((x) => agora - x <= 30 * DIA).length }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: plural(x.n, 'sonho', 'sonhos') + ' nos últimos 30 dias' })),
  });

  // 3. Constelação: tema antigo que voltou depois de muito tempo.
  add({
    ...META.constelacao,
    itens: [...ocorre]
      .filter(([, d]) => d.length >= 2 && agora - d[d.length - 1] <= 60 * DIA)
      .map(([tema, d]) => ({ tema, gap: d[d.length - 1] - d[d.length - 2] }))
      .filter((x) => x.gap >= 90 * DIA).sort((a, b) => b.gap - a.gap).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: 'voltou depois de ' + tempo(x.gap) + ' sem aparecer' })),
  });

  // 4. Série: temas que ocuparam sonhos seguidos.
  {
    const melhor = new Map(); // tema -> { n, ini }
    const corrente = new Map();
    comTema.forEach((s) => {
      const aqui = new Set(s.temas);
      for (const t of corrente.keys()) if (!aqui.has(t)) corrente.delete(t);
      for (const t of aqui) {
        const c = corrente.get(t) || { n: 0, ini: +new Date(s.sonhado_em) };
        c.n++; corrente.set(t, c);
        if (!melhor.has(t) || c.n > melhor.get(t).n) melhor.set(t, { ...c });
      }
    });
    add({
      ...META.serie,
      itens: [...melhor].filter(([, m]) => m.n >= 3).sort((a, b) => b[1].n - a[1].n).slice(0, 5)
        .map(([tema, m]) => ({ tema, texto: m.n + ' sonhos seguidos · a partir de ' + mesAno(m.ini) })),
    });
  }

  // 5. Motivo recorrente: o que atravessa os anos.
  {
    const anoAtual = new Date(agora).getFullYear();
    add({
      ...META.recorrente,
      itens: [...ocorre]
        .map(([tema, d]) => ({ tema, anos: new Set(d.map((x) => new Date(x).getFullYear())), d }))
        .filter((x) => x.anos.size >= 3).sort((a, b) => b.anos.size - a.anos.size || b.d.length - a.d.length).slice(0, 5)
        .map((x) => ({ tema: x.tema, texto: 'em ' + x.anos.size + ' anos diferentes, desde ' + Math.min(...x.anos) + (x.anos.has(anoAtual) ? ' · também este ano' : '') })),
    });
  }

  // 6. Latência: temas frequentes que estão em silêncio.
  add({
    ...META.latencia,
    itens: [...ocorre]
      .filter(([, d]) => d.length >= 3 && agora - d[d.length - 1] >= 60 * DIA)
      .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
      .map(([tema, d]) => ({ tema, texto: plural(d.length, 'sonho', 'sonhos') + ' · o último há ' + tempo(agora - d[d.length - 1]) })),
  });

  // 7. Complexo: temas que andam juntos.
  {
    const pares = new Map();
    for (const s of comTema) {
      const t = [...new Set(s.temas)].sort();
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
        const k = t[i] + '\u0000' + t[j];
        pares.set(k, (pares.get(k) || 0) + 1);
      }
    }
    add({
      ...META.complexo,
      itens: [...pares].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([k, n]) => { const [a, b] = k.split('\u0000'); return { tema: a, par: b, texto: 'juntos em ' + plural(n, 'sonho', 'sonhos') }; }),
    });
  }

  // 8. Enantiodromia: a virada entre um período e outro.
  {
    const recente = new Map(), anterior = new Map();
    for (const [tema, d] of ocorre) for (const x of d) {
      const idade = agora - x;
      if (idade <= 90 * DIA) recente.set(tema, (recente.get(tema) || 0) + 1);
      else if (idade <= 180 * DIA) anterior.set(tema, (anterior.get(tema) || 0) + 1);
    }
    const cederam = [...anterior].filter(([t, n]) => n >= 3 && (recente.get(t) || 0) <= Math.floor(n / 3)).sort((a, b) => b[1] - a[1]);
    const surgiram = [...recente].filter(([t, n]) => n >= 3 && (anterior.get(t) || 0) <= Math.floor(n / 3)).sort((a, b) => b[1] - a[1]);
    add({
      ...META.enantiodromia,
      itens: [
        ...surgiram.slice(0, 3).map(([t, n]) => ({ tema: t, texto: 'cresceu: ' + (anterior.get(t) || 0) + ' → ' + n + ' sonhos' })),
        ...cederam.slice(0, 3).map(([t, n]) => ({ tema: t, texto: 'recuou: ' + n + ' → ' + (recente.get(t) || 0) + ' sonhos' })),
      ],
    });
  }

  // 9. Personificação: quem aparece nos relatos, pelo papel ou pelo nome,
  // e as imagens que mais aparecem nos mesmos sonhos.
  {
    const set = new Set(FIGURAS);
    const lugares = new Set(LUGARES);
    const nomes = nomesPorRelato(ordenados);
    // relato -> pessoas presentes (chave normalizada)
    const presentes = ordenados.map((s, i) => {
      const m = new Map();
      for (const [k, orig] of palavras[i]) if (set.has(k)) m.set(k, orig);
      for (const [k, orig] of nomes[i]) if (!m.has(k)) m.set(k, orig);
      return m;
    });
    const conta = new Map(), forma = new Map(), ehNome = new Set();
    presentes.forEach((m, i) => { for (const [k, orig] of m) { conta.set(k, (conta.get(k) || 0) + 1); if (!forma.has(k)) forma.set(k, orig); if (nomes[i].has(k) && !set.has(k)) ehNome.add(k); } });
    const pessoas = [...conta].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const ligadosDe = (k) => {
      const c = new Map(); // chave -> { n, tema?, palavra? }
      // Tema e palavra com a mesma forma contam juntos; se já foi tema, aparece como tema.
      const somar = (id, x) => { const v = c.get(id) || { n: 0 }; v.n++; if (x.tema) { v.tema = x.tema; delete v.palavra; } else if (!v.tema) v.palavra = x.palavra; c.set(id, v); };
      ordenados.forEach((s, i) => {
        if (!presentes[i].has(k)) return;
        const vistos = new Set();
        for (const t of new Set(s.temas || [])) {
          const n = singular(normalizar(t));
          if (n === k || presentes[i].has(n)) continue;
          vistos.add(n); somar(n, { tema: t });
        }
        for (const [w, orig] of palavras[i]) {
          if (w === k || vistos.has(w) || set.has(w) || !(ehSimbolo(w) || lugares.has(w)) || w.length < 3) continue;
          somar(w, { palavra: orig });
        }
      });
      // Temas valem um pouco mais que palavras soltas no desempate.
      return [...c.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n || (b.tema ? 1 : 0) - (a.tema ? 1 : 0)).slice(0, 5)
        .map((x) => (x.tema ? { tema: x.tema } : { palavra: x.palavra }));
    };
    add({
      ...META.figuras,
      itens: pessoas.map(([k, n]) => ({
        palavra: forma.get(k),
        texto: 'em ' + plural(n, 'relato', 'relatos') + (ehNome.has(k) ? ' · pelo nome' : ''),
        ligados: ligadosDe(k),
      })),
    });
  }

  // 10. A casa da psique: os cenários.
  {
    const set = new Set(LUGARES);
    add({
      ...META.lugares,
      itens: contarPalavras((k) => set.has(k)).filter((x) => x.n >= 3).slice(0, 6)
        .map((x) => ({ palavra: x.forma, texto: 'em ' + plural(x.n, 'relato', 'relatos') })),
    });
  }

  // 11. Associação: símbolos que aparecem no texto e nunca viraram tema.
  {
    const ja = new Set([...FIGURAS, ...LUGARES, 'sonho', 'visao', 'presente', 'caminho', 'energia', 'alma', 'calma', 'brilho', 'frio', 'luz', 'medo', 'cair', 'velho']);
    add({
      ...META.associacao,
      itens: contarPalavras((k) => ehSimbolo(k) && !temasNorm.has(k) && !ja.has(k) && k.length > 2).filter((x) => x.n >= 4).slice(0, 6)
        .map((x) => ({ palavra: x.forma, texto: 'em ' + plural(x.n, 'relato', 'relatos') + ', nunca como tema' })),
    });
  }

  // 11b. Grande sonho: os relatos com mais material.
  if (ordenados.length >= 10) {
    const set = new Set(FIGURAS), lugares = new Set(LUGARES);
    const nomes = nomesPorRelato(ordenados);
    const medidos = ordenados.map((s, i) => {
      const temas = new Set(s.temas || []).size;
      let pessoas = nomes[i].size, cenarios = 0, imagens = 0;
      for (const k of palavras[i].keys()) {
        if (set.has(k)) pessoas++;
        else if (lugares.has(k)) cenarios++;
        else if (ehSimbolo(k)) imagens++;
      }
      const total = contarPalavrasDoTexto(s);
      return { s, temas, pessoas, cenarios, imagens, total, nota: temas * 2 + pessoas * 2 + cenarios * 2 + imagens + total / 80 };
    }).filter((x) => x.total >= 25);
    const media = medidos.length ? medidos.reduce((t, x) => t + x.nota, 0) / medidos.length : 0;
    add({
      ...META.grandes,
      itens: medidos.filter((x) => x.nota > media).sort((a, b) => b.nota - a.nota).slice(0, 5).map((x) => ({
        sonho: refSonho(x.s),
        texto: [
          x.temas && plural(x.temas, 'tema', 'temas'),
          x.pessoas && plural(x.pessoas, 'pessoa', 'pessoas'),
          x.cenarios && plural(x.cenarios, 'lugar', 'lugares'),
          x.imagens && plural(x.imagens, 'imagem', 'imagens'),
          plural(x.total, 'palavra', 'palavras'),
        ].filter(Boolean).join(' · '),
      })),
    });
  }

  // 12. Sonho inicial: o primeiro do acervo.
  if (ordenados.length >= 10) {
    const s0 = ordenados[0];
    const t0 = +new Date(s0.sonhado_em);
    const itens = [{ sonho: refSonho(s0), texto: dataDe(t0) }];
    for (const t of new Set(s0.temas || [])) {
      const depois = (ocorre.get(t) || []).filter((x) => x > t0).length;
      if (depois) itens.push({ tema: t, texto: 'voltou em ' + plural(depois, 'sonho', 'sonhos') + ' depois' });
    }
    add({
      ...META.inicial,
      itens,
    });
  }

  // 13. Ciclo: o que você sonhou nesta época em outros anos.
  {
    const hoje = new Date(agora);
    const itens = ordenados.filter((s) => {
      const d = new Date(s.sonhado_em);
      if (d.getFullYear() >= hoje.getFullYear()) return false;
      const mesmoDia = new Date(hoje.getFullYear(), d.getMonth(), d.getDate());
      return Math.abs(mesmoDia - hoje) <= 3 * DIA;
    }).reverse().slice(0, 5).map((s) => ({ sonho: refSonho(s), texto: 'há ' + plural(hoje.getFullYear() - new Date(s.sonhado_em).getFullYear(), 'ano', 'anos') + ' · ' + dataDe(+new Date(s.sonhado_em)) }));
    add({
      ...META.ciclo,
      itens,
    });
  }

  // 14. Ritmo das estações: temas que se concentram numa estação.
  if (diasDeAcervo >= 365) {
    const itens = [...ocorre].filter(([, d]) => d.length >= 6).map(([tema, d]) => {
      const c = new Map();
      for (const x of d) { const e = ESTACAO(new Date(x).getMonth()); c.set(e, (c.get(e) || 0) + 1); }
      const [est, n] = [...c].sort((a, b) => b[1] - a[1])[0];
      return { tema, est, n, total: d.length };
    }).filter((x) => x.n / x.total >= 0.5).sort((a, b) => b.n / b.total - a.n / a.total).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: x.n + ' de ' + x.total + ' aparições no ' + x.est }));
    add({
      ...META.estacoes,
      itens,
    });
  }

  // 15. Confronto com o inconsciente: o que ainda pede elaboração.
  {
    const comConclusao = ordenados.filter((s) => s.conclusoes?.length).length;
    const atencao = ordenados.filter((s) => s.status === 'dar_atencao' && !s.conclusoes?.length);
    const sessao = ordenados.filter((s) => s.levar_sessao).length;
    const itens = [
      comConclusao ? { texto: plural(comConclusao, 'sonho já tem amplificação', 'sonhos já têm amplificação') } : null,
      sessao ? { texto: plural(sessao, 'sonho marcado', 'sonhos marcados') + ' para levar à sessão' } : null,
      ...atencao.slice(-4).reverse().map((s) => ({ sonho: refSonho(s), texto: 'pede atenção, sem amplificação' })),
    ].filter(Boolean);
    if (atencao.length || sessao) add({
      ...META.confronto,
      itens,
    });
  }

  // 16. Energia psíquica: o ritmo de lembrar.
  if (ordenados.length >= 5) {
    const hoje = new Date(agora);
    const barras = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const n = ordenados.filter((s) => { const x = new Date(s.sonhado_em); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).length;
      barras.push({ rotulo: MESES[d.getMonth()], n });
    }
    const dias = new Map();
    for (const s of ordenados) { const k = new Date(s.sonhado_em).toDateString(); dias.set(k, (dias.get(k) || 0) + 1); }
    const varios = [...dias.values()].filter((n) => n >= 2).length;
    const ult30 = ordenados.filter((s) => agora - +new Date(s.sonhado_em) <= 30 * DIA).length;
    // Maior sequência de noites seguidas com registro.
    const noites = [...dias.keys()].map((k) => +new Date(k)).sort((a, b) => a - b);
    let seq = noites.length ? 1 : 0, maior = seq, fimMaior = noites[0];
    for (let i = 1; i < noites.length; i++) {
      seq = Math.round((noites[i] - noites[i - 1]) / DIA) === 1 ? seq + 1 : 1;
      if (seq > maior) { maior = seq; fimMaior = noites[i]; }
    }
    const meses = Math.max(1, diasDeAcervo / 30.4);
    const itens = [
      { texto: plural(ult30, 'sonho lembrado', 'sonhos lembrados') + ' nos últimos 30 dias' },
      diasDeAcervo >= 60 ? { texto: 'média de ' + (ordenados.length / meses).toFixed(1).replace('.', ',') + ' sonhos por mês desde o início' } : null,
      maior >= 3 ? { texto: 'maior sequência: ' + maior + ' noites seguidas, até ' + dataDe(fimMaior) } : null,
      varios ? { texto: plural(varios, 'noite', 'noites') + ' com mais de um sonho' } : null,
    ].filter(Boolean);
    add({
      ...META.energia,
      itens, barras,
    });

    // 17. Os dias da semana em que você mais lembra.
    if (ordenados.length >= 20) {
      const sem = Array(7).fill(0);
      for (const s of ordenados) sem[new Date(s.sonhado_em).getDay()]++;
      const ordem = [1, 2, 3, 4, 5, 6, 0];
      const top = sem.indexOf(Math.max(...sem));
      const baixo = sem.indexOf(Math.min(...sem));
      add({
        ...META.semana,
        barras: ordem.map((i) => ({ rotulo: SEMANA_CURTA[i], n: sem[i], destaque: i === top })),
        itens: [
          { texto: 'mais sonhos nas ' + SEMANA[top] + ' (' + sem[top] + ')' },
          top !== baixo ? { texto: 'menos nas ' + SEMANA[baixo] + ' (' + sem[baixo] + ')' } : null,
        ].filter(Boolean),
      });
    }
  }

  return { lista, total: sonhos.length, diasDeAcervo };
}
