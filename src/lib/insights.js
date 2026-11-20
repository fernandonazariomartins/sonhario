// Insights: padrões do acervo, com nomes da psicologia analítica.
// Nada aqui interpreta sonhos: só conta o que se repete, some e volta.
// Só aparece o insight que tem algo a mostrar no acervo de cada pessoa.
import { normalizar, singular, ehSimbolo } from './coresTema.js';
import { tr, ingles, MESES_CURTOS, DIAS_SEMANA } from './i18n.js';

const DIA = 864e5;
const MESES = MESES_CURTOS;
const SEMANA = ingles ? DIAS_SEMANA.map((d) => d + 's') : ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
const SEMANA_CURTA = ingles ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function tempo(ms) {
  const d = Math.round(ms / DIA);
  if (d < 45) return d + tr(' dias');
  const m = Math.round(d / 30);
  if (m < 18) return m + (m === 1 ? tr(" mês") : tr(' meses'));
  const a = Math.round(d / 365);
  return a + (a === 1 ? tr(' ano') : tr(' anos'));
}
const plural = (n, um, varios) => n + ' ' + tr(n === 1 ? um : varios);
const dataDe = (ms) => { const d = new Date(ms); return ingles ? MESES[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const mesAno = (ms) => { const d = new Date(ms); return MESES[d.getMonth()] + ' ' + d.getFullYear(); };
const refSonho = (s) => ({ id: s.id, titulo: s.titulo?.trim() || '' });

// Estações: hemisfério sul em português; em inglês, pelo fuso do aparelho (norte, salvo Oceania, sul da África e da América).
const FUSO = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } })();
const SUL = !ingles || /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham)|^Africa\/(Johannesburg|Maputo|Windhoek|Harare|Lusaka|Gaborone|Maseru|Mbabane)|^America\/(Sao_Paulo|Argentina|Buenos_Aires|Santiago|Montevideo|Asuncion|La_Paz|Lima|Punta_Arenas)/.test(FUSO);
const ESTACAO = (m) => { const mes = SUL ? m : (m + 6) % 12; return tr(mes === 11 || mes <= 1 ? 'verão' : mes <= 4 ? 'outono' : mes <= 7 ? 'inverno' : 'primavera'); };

// Figuras e lugares que costumam aparecer nos relatos (sem acento, no singular).
const FIGURAS = ("mae pai irma irmao avo filho filha crianca bebe menino menina homem mulher amigo amiga namorado namorada marido esposa ex chefe colega professor professora desconhecido estranho policial medico velho velha tio tia primo prima" + " mother mom father dad sister brother grandma grandpa grandmother grandfather son daughter child kid baby boy girl man woman friend boyfriend girlfriend husband wife ex boss coworker colleague teacher stranger police policeman doctor uncle aunt cousin").split(' ');
const LUGARES = ("casa apartamento quarto sala cozinha banheiro porao sotao escada elevador predio escola faculdade universidade trabalho escritorio igreja hospital rua estrada avenida cidade praia mar rio lago piscina floresta mata montanha fazenda sitio aeroporto aviao carro onibus trem metro barco shopping loja mercado festa hotel cemiterio" + " house home apartment room bedroom kitchen bathroom basement attic stairs staircase elevator building school college university work office church hospital street road avenue city beach sea river lake pool forest woods mountain farm airport plane car bus train subway boat mall store shop market party hotel cemetery").split(' ');

// Nome, pergunta e explicação de cada insight. Também usados nos exemplos e nos bloqueados.
export const META = {
  primordiais: { id: 'primordiais', nome: tr("Imagens primordiais"), titulo: tr("Os temas centrais do seu acervo"),
    termo: tr("Jung chamava de imagens primordiais as figuras que voltam ao longo de uma vida inteira. Aqui, os temas que mais aparecem em todos os seus sonhos.") },
  circum: { id: 'circum', nome: tr("Circum-ambulação"), titulo: tr("O que está voltando agora"),
    termo: tr("Para Jung, os sonhos andam em volta de um mesmo centro, como quem dá voltas num lugar até ele se mostrar.") },
  constelacao: { id: 'constelacao', nome: tr("Constelação"), titulo: tr("Um tema antigo que voltou"),
    termo: tr("Jung dizia que um complexo “se constela” quando é ativado de novo pela vida. Um tema que reaparece depois de muito tempo pode estar nesse ponto.") },
  serie: { id: 'serie', nome: tr("Série"), titulo: tr("Temas que tomaram sonhos seguidos"),
    termo: tr("Jung preferia ler os sonhos em série, não um a um: o sentido aparece na sequência. Aqui, os temas que estiveram em vários sonhos em sequência.") },
  recorrente: { id: 'recorrente', nome: tr("Motivo recorrente"), titulo: tr("O que atravessa os anos"),
    termo: tr("Os sonhos recorrentes eram, para Jung, sinal de uma questão que ainda pede resposta. Aqui, temas presentes em três anos diferentes ou mais.") },
  latencia: { id: 'latencia', nome: tr("Latência"), titulo: tr("O que está em silêncio"),
    termo: tr("O que não aparece não desapareceu: fica latente no inconsciente. São temas que já foram frequentes e não voltam há mais de dois meses.") },
  complexo: { id: 'complexo', nome: tr("Complexo"), titulo: tr("Temas que andam juntos"),
    termo: tr("Na psicologia analítica, um complexo é um núcleo de imagens e emoções que se atraem. Aqui, os temas que costumam aparecer no mesmo sonho.") },
  enantiodromia: { id: 'enantiodromia', nome: tr("Enantiodromia"), titulo: tr("A virada dos últimos meses"),
    termo: tr("Termo que Jung tomou de Heráclito: tudo, levado ao extremo, tende a virar no seu contrário. Compara os últimos 3 meses com os 3 anteriores.") },
  figuras: { id: 'figuras', nome: tr("Personificação"), titulo: tr("Quem aparece nos seus sonhos"),
    termo: tr("Jung notou que o inconsciente se apresenta em pessoas, conhecidas ou não. Aqui, as pessoas mais citadas nos seus relatos, pelo papel ou pelo nome, mesmo quando não viraram tema.") },
  lugares: { id: 'lugares', nome: tr("Topografia"), titulo: tr("Os lugares onde você sonha"),
    termo: tr("Num sonho famoso, Jung desceu pelos andares de uma casa até o porão e viu ali uma imagem da própria psique. Aqui, os cenários que mais voltam nos relatos.") },
  associacao: { id: 'associacao', nome: tr("Associação"), titulo: tr("Escritos, mas nunca marcados"),
    termo: tr("No teste de associação de Jung, o que importava era o que passava sem ser notado. Aqui, imagens frequentes nos relatos que ainda não viraram tema.") },
  grandes: { id: 'grandes', nome: tr("Grande sonho"), titulo: tr("Os sonhos mais complexos"),
    termo: tr("Jung separava os sonhos pequenos, do dia a dia, dos grandes sonhos, cheios de imagens e lembrados por anos. Aqui, os relatos com mais temas, pessoas, lugares e imagens. Não diz qual sonho importa mais: mostra onde há mais material para levar à sessão.") },
  inicial: { id: 'inicial', nome: tr("Sonho inicial"), titulo: tr("Onde o seu acervo começou"),
    termo: tr("Jung dava peso especial ao primeiro sonho de um processo: muitas vezes ele antecipa o caminho inteiro. Este é o primeiro do seu acervo.") },
  ciclo: { id: 'ciclo', nome: tr("Ciclo"), titulo: tr("Nesta época, em outros anos"),
    termo: tr("A psique tem o seu próprio calendário: datas e estações carregadas costumam voltar. Aqui, o que você sonhou nestes mesmos dias em anos anteriores.") },
  estacoes: { id: 'estacoes', nome: tr("Ritmo das estações"), titulo: tr("Temas que têm época"),
    termo: tr("Jung via a psique ligada aos ciclos da natureza. Aqui, temas que se concentram numa mesma estação do ano.") },
  confronto: { id: 'confronto', nome: tr("Confronto"), titulo: tr("O que ainda pede elaboração"),
    termo: tr("Jung falava em confronto com o inconsciente: dar forma e resposta ao que o sonho trouxe. Aqui, o que você marcou e ainda está em aberto.") },
  energia: { id: 'energia', nome: tr("Energia psíquica"), titulo: tr("O ritmo de lembrar"),
    termo: tr("Jung via a energia psíquica fluindo e refluindo, ora para fora, ora para dentro. Aqui, quantos sonhos você lembrou a cada mês.") },
  semana: { id: 'semana', nome: tr("Ritmo semanal"), titulo: tr("Os dias em que você mais lembra"),
    termo: tr("A rotina mexe com o sono e com a lembrança. Fins de semana e dias de descanso costumam trazer mais sonhos, mas cada pessoa tem o seu ritmo.") },
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

// Palavras que nomeiam a mesma imagem: "barco" e "navio" não são uma relação, são o mesmo barco.
const SINONIMOS = [
  "barco navio canoa bote lancha jangada embarcacao veleiro", "cao cachorro cachorra cadela cachorrinho dog", "gato gata gatinho gatinha felino",
  "casa lar residencia moradia", "mar oceano", "carro automovel veiculo", "mae mamae", "pai papai", "avo vovo vovozinha", "filho filha filhote",
  "crianca menino menina garoto garota guri guria", "agua aguaceiro", "rio riacho corrego", "chuva chuvarada temporal", "morte morrer morto morta morreu",
  "cobra serpente", "aviao aeronave", "onibus busao", "escola colegio", "medo assustado assustada", "cair queda caindo caiu",
  "voar voando voo", "dente dentes", "bebe nenem", "igreja templo capela", "cemiterio tumulo", "fogo incendio chama",
  // inglês
  "boat ship canoe raft yacht sailboat", "dog puppy doggy", "cat kitten kitty", "house home residence", "sea ocean", "car automobile vehicle",
  "mother mom mommy mum", "father dad daddy", "grandma grandmother granny", "grandpa grandfather", "child kid boy girl", "river stream creek",
  "rain storm downpour", "death die dead died dying", "snake serpent", "plane airplane aircraft", "school college", "fear afraid scared",
  "fall falling fell", "fly flying flight", "tooth teeth", "baby infant", "church temple chapel", "cemetery grave tomb", "fire flame blaze",
].map((g) => g.split(' '));
const GRUPO = new Map(SINONIMOS.flatMap((g, i) => g.map((w) => [w, i])));

// Campos: palavras que já moram no mesmo ambiente. Juntar duas delas não é descoberta
// (escola e colega, caminho e trilha, casa e escada). Uma palavra pode estar em mais de um campo.
const CAMPOS = [
  "escola colegio faculdade universidade aula sala professor professora colega turma prova recreio caderno quadro carteira estudar estudo livro aluno aluna diretor diretora uniforme",
  "trabalho emprego escritorio empresa chefe colega reuniao cliente salario computador mesa patrao funcionario",
  "casa apartamento quarto sala cozinha banheiro porao sotao escada porta janela telhado parede corredor quintal varanda garagem sofa cama mesa",
  "caminho trilha estrada rua avenida rota percurso calcada ponte esquina atalho",
  "mar praia onda areia mare oceano barco navio ilha porto marinheiro peixe tubarao",
  "agua rio lago lagoa piscina chuva molhado nadar afogar enchente cachoeira",
  "viagem mala aeroporto aviao hotel passaporte voo turista estrangeiro onibus trem estacao",
  "carro dirigir volante estrada transito motorista pneu garagem",
  "cidade rua predio avenida bairro centro praca transito loja shopping",
  "floresta mata arvore trilha bicho natureza folha galho montanha",
  "ceu nuvem estrela lua sol voar aviao passaro",
  "noite escuro lua sono dormir cama pesadelo",
  "hospital medico medica enfermeira doenca remedio cirurgia doente maca",
  "igreja padre missa altar reza oracao santo deus capela",
  "festa musica danca bebida cerveja aniversario bolo convidado casamento noiva noivo",
  "comida comer cozinha mesa almoco jantar fome prato",
  "familia mae pai irmao irma avo tio tia primo prima filho filha",
  "animal cachorro gato bicho cavalo passaro",
  "morte morrer enterro velorio cemiterio caixao luto",
  "fogo incendio fumaca queimar bombeiro",
  "dinheiro banco pagar conta compra loja",
  "celular telefone mensagem ligacao",
  // inglês
  "school college university class classroom teacher classmate exam test homework student principal uniform book study",
  "work job office company boss coworker colleague meeting client salary computer desk employee",
  "house home apartment room bedroom kitchen bathroom basement attic stairs door window roof wall hallway yard porch garage couch bed table",
  "path trail road street avenue route sidewalk bridge corner shortcut",
  "sea beach wave sand tide ocean boat ship island port sailor fish shark",
  "water river lake pond pool rain wet swim drown flood waterfall",
  "travel trip suitcase airport plane hotel passport flight tourist foreigner bus train station",
  "car drive driving wheel road traffic driver tire garage",
  "city street building avenue neighborhood downtown square traffic store mall",
  "forest woods tree trail animal nature leaf branch mountain",
  "sky cloud star moon sun fly plane bird",
  "night dark moon sleep bed nightmare",
  "hospital doctor nurse illness disease medicine surgery sick",
  "church priest mass altar prayer pray saint god chapel",
  "party music dance drink beer birthday cake guest wedding bride groom",
  "food eat kitchen table lunch dinner hungry plate",
  "family mother father brother sister grandmother grandfather uncle aunt cousin son daughter",
  "animal dog cat horse bird",
  "death die funeral wake cemetery coffin mourning",
  "fire smoke burn firefighter",
  "money bank pay bill buy store",
  "phone cellphone message call",
].map((g) => g.split(' '));
const CAMPO = new Map();
CAMPOS.forEach((g, i) => g.forEach((w) => { if (!CAMPO.has(w)) CAMPO.set(w, new Set()); CAMPO.get(w).add(i); }));
const camposDe = (texto) => {
  const r = new Set();
  for (const w of normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean)) for (const f of [w, singular(w)]) for (const c of CAMPO.get(f) || []) r.add(c);
  return r;
};
// Mesma imagem ou mesmo ambiente: a relação é óbvia demais para ser observação.
export function obvio(a, b) {
  if (mesmaImagem(a, b)) return true;
  const ca = camposDe(a);
  for (const c of camposDe(b)) if (ca.has(c)) return true;
  return false;
}
const raiz = (w) => singular(normalizar(w)).replace(/(inho|inha|zinho|zinha|ao|a|o|e)$/, '');
// a e b falam da mesma imagem? (mesma raiz, sinônimo, ou uma é parte do nome da outra: "tia" e "Tia Marília")
export function mesmaImagem(a, b) {
  const pa = normalizar(a).split(/[^a-z0-9]+/).filter(Boolean).map(singular);
  const pb = normalizar(b).split(/[^a-z0-9]+/).filter(Boolean).map(singular);
  for (const x of pa) for (const y of pb) {
    if (x === y) return true;
    const rx = raiz(x), ry = raiz(y);
    if (rx.length >= 3 && rx === ry) return true;
    if (GRUPO.has(x) && GRUPO.get(x) === GRUPO.get(y)) return true;
  }
  return false;
}

// Meses, dias e palavras que aparecem com maiúscula sem ser nome de alguém.
const NAO_NOMES = new Set(("janeiro fevereiro marco abril maio junho julho agosto setembro outubro novembro dezembro "
  + "domingo segunda terca quarta quinta sexta sabado natal pascoa deus jesus brasil eu ele ela voce nos eles elas "
  + "meu minha seu sua dele dela isso aquilo depois entao quando mas porque ai la sim nao ok tipo "
  + "january february march april may june july august september october november december monday tuesday wednesday thursday friday saturday sunday "
  + "christmas easter god jesus i im ive id me my mine he she you we they it the a an and but then when because so yes no ok this that there here suddenly later").split(' '));

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

// Pessoas do acervo, pelo papel (mãe, chefe) ou pelo nome, com os sonhos em que aparecem
// e as imagens (temas ou palavras) que mais aparecem nos mesmos sonhos.
function pessoasDoAcervo(ordenados, palavras, limite) {
  const set = new Set(FIGURAS);
  const lugares = new Set(LUGARES);
  const nomes = nomesPorRelato(ordenados);
  const presentes = ordenados.map((s, i) => {
    const m = new Map();
    for (const [k, orig] of palavras[i]) if (set.has(k)) m.set(k, orig);
    for (const [k, orig] of nomes[i]) if (!m.has(k)) m.set(k, orig);
    return m;
  });
  const conta = new Map(), forma = new Map(), ehNome = new Set();
  presentes.forEach((m, i) => { for (const [k, orig] of m) { conta.set(k, (conta.get(k) || 0) + 1); if (!forma.has(k)) forma.set(k, orig); if (nomes[i].has(k) && !set.has(k)) ehNome.add(k); } });
  const pessoas = [...conta].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, limite);
  return pessoas.map(([k, n]) => {
    const c = new Map(); // forma normalizada -> { n, tema?, palavra? }
    // Tema e palavra com a mesma forma contam juntos; se já foi tema, aparece como tema.
    const somar = (id, x) => { const v = c.get(id) || { n: 0 }; v.n++; if (x.tema) { v.tema = x.tema; delete v.palavra; } else if (!v.tema) v.palavra = x.palavra; c.set(id, v); };
    const sonhos = [];
    const outras = new Map();
    ordenados.forEach((s, i) => {
      if (!presentes[i].has(k)) return;
      sonhos.push({ id: s.id, titulo: s.titulo?.trim() || '', em: +new Date(s.sonhado_em) });
      for (const o of presentes[i].keys()) if (o !== k && conta.get(o) >= 3) outras.set(o, (outras.get(o) || 0) + 1);
      const vistos = new Set();
      for (const t of new Set(s.temas || [])) {
        const tn = singular(normalizar(t));
        if (tn === k || presentes[i].has(tn) || obvio(t, forma.get(k))) continue;
        vistos.add(tn); somar(tn, { tema: t });
      }
      for (const [w, orig] of palavras[i]) {
        if (w === k || vistos.has(w) || set.has(w) || !(ehSimbolo(w) || lugares.has(w)) || w.length < 3 || obvio(w, forma.get(k))) continue;
        somar(w, { palavra: orig });
      }
    });
    const ligados = [...c.entries()].filter(([, x]) => x.n >= 2)
      .sort((a, b) => b[1].n - a[1].n || (b[1].tema ? 1 : 0) - (a[1].tema ? 1 : 0)).slice(0, 8)
      .map(([chave, x]) => ({ chave, n: x.n, ...(x.tema ? { tema: x.tema } : { palavra: x.palavra }) }));
    return {
      chave: k, nome: forma.get(k), n, peloNome: ehNome.has(k), sonhos, ligados,
      junto: [...outras].filter(([, m]) => m >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([o, m]) => ({ nome: forma.get(o), n: m })),
    };
  });
}

// Tags que são nome de pessoa: palavras que nos relatos só aparecem com maiúscula (Natália),
// com ou sem parentesco junto (Tia Marília). Só o papel (mãe, pai, criança) não conta.
function tagsDePessoa(ordenados) {
  const minusculas = new Set(), maiusculas = new Set();
  for (const s of ordenados) for (const p of ((s.titulo || '') + ' ' + (s.texto || '')).match(/[\p{L}]+/gu) || []) {
    (/^\p{Lu}/u.test(p) ? maiusculas : minusculas).add(normalizar(p));
  }
  const figuras = new Set(FIGURAS);
  // Só nomes próprios: "mãe", "pai" e "criança" não contam; "Tia Marília" conta pelo Marília.
  const comum = (w) => figuras.has(w) || figuras.has(singular(w)) || ehSimbolo(w) || ehSimbolo(singular(w))
    || CAMPO.has(w) || LUGARES.includes(w) || NAO_NOMES.has(w) || minusculas.has(w);
  const pessoa = (t) => {
    const ws = normalizar(t).split(/[^a-z]+/).filter((w) => w.length > 1);
    const resto = ws.filter((w) => !figuras.has(w) && !figuras.has(singular(w)));
    if (!resto.length || resto.some(comum)) return false;
    // Com parentesco na frente (Tia Marília), basta não ser palavra comum; sozinho, o nome precisa
    // aparecer com maiúscula em algum relato, para "Ansiedade" não virar pessoa.
    return resto.length < ws.length || resto.some((w) => maiusculas.has(w));
  };
  return pessoa;
}

function pessoasPorTag(ordenados) {
  const ehPessoa = tagsDePessoa(ordenados);
  const N = ordenados.length;
  const freq = new Map();
  for (const s of ordenados) for (const t of new Set(s.temas || [])) freq.set(t, (freq.get(t) || 0) + 1);
  const pessoas = [...freq].filter(([t, n]) => n >= 3 && ehPessoa(t)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  const ehDePessoa = new Set(pessoas);
  return pessoas.map((nome) => {
    const sonhos = [], com = new Map(), outras = new Map();
    ordenados.forEach((s) => {
      const ts = new Set(s.temas || []);
      if (!ts.has(nome)) return;
      sonhos.push({ id: s.id, titulo: s.titulo?.trim() || '', em: +new Date(s.sonhado_em) });
      for (const t of ts) {
        if (t === nome) continue;
        const papel = normalizar(t).split(/[^a-z]+/).some((w) => FIGURAS.includes(w) || FIGURAS.includes(singular(w)));
        if (ehDePessoa.has(t) || ehPessoa(t) || papel) outras.set(t, (outras.get(t) || 0) + 1);
        else if (!obvio(t, nome)) com.set(t, (com.get(t) || 0) + 1);
      }
    });
    const n = sonhos.length;
    // Ordena pelo que vem junto mais vezes, pesando o quanto aquela tag é rara no resto do acervo.
    const ligados = [...com].filter(([, m]) => m >= 2).map(([t, m]) => {
      const fora = (freq.get(t) - m) / Math.max(1, N - n);
      return { chave: 'tag:' + t, tema: t, n: m, nota: m * Math.min(3, (m / n) / Math.max(0.02, fora)) };
    }).sort((a, b) => b.nota - a.nota || b.n - a.n).slice(0, 8).map(({ nota, ...x }) => x); // eslint-disable-line no-unused-vars
    return {
      chave: 'tag:' + nome, nome, n, peloNome: false, ehTag: true, sonhos, ligados,
      junto: [...outras].filter(([, m]) => m >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([o, m]) => ({ nome: o, n: m })),
    };
  });
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
      .map(([tema, d]) => ({ tema, texto: plural(d.length, 'sonho', 'sonhos') + ' · ' + Math.round((d.length / comTema.length) * 100) + tr("% do acervo") })),
  });

  // 2. Circum-ambulação: o que está voltando agora.
  add({
    ...META.circum,
    itens: [...ocorre]
      .map(([tema, d]) => ({ tema, n: d.filter((x) => agora - x <= 30 * DIA).length }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: plural(x.n, 'sonho', 'sonhos') + tr(" nos últimos 30 dias") })),
  });

  // 3. Constelação: tema antigo que voltou depois de muito tempo.
  add({
    ...META.constelacao,
    itens: [...ocorre]
      .filter(([, d]) => d.length >= 2 && agora - d[d.length - 1] <= 60 * DIA)
      .map(([tema, d]) => ({ tema, gap: d[d.length - 1] - d[d.length - 2] }))
      .filter((x) => x.gap >= 90 * DIA).sort((a, b) => b.gap - a.gap).slice(0, 5)
      .map((x) => ({ tema: x.tema, texto: tr("voltou depois de ") + tempo(x.gap) + tr(" sem aparecer") })),
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
        .map(([tema, m]) => ({ tema, texto: m.n + tr(" sonhos seguidos · a partir de ") + mesAno(m.ini) })),
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
        .map((x) => ({ tema: x.tema, texto: tr('em {0} anos diferentes, desde ', [x.anos.size]) + '' + Math.min(...x.anos) + (x.anos.has(anoAtual) ? tr(" · também este ano") : '') })),
    });
  }

  // 6. Latência: temas frequentes que estão em silêncio.
  add({
    ...META.latencia,
    itens: [...ocorre]
      .filter(([, d]) => d.length >= 3 && agora - d[d.length - 1] >= 60 * DIA)
      .sort((a, b) => b[1].length - a[1].length).slice(0, 5)
      .map(([tema, d]) => ({ tema, texto: plural(d.length, 'sonho', 'sonhos') + tr(' · o último há {0}', [tempo(agora - d[d.length - 1])]) })),
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
        .map(([k, n]) => { const [a, b] = k.split('\u0000'); return { tema: a, par: b, texto: tr("juntos em ") + plural(n, 'sonho', 'sonhos') }; }),
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
        ...surgiram.slice(0, 3).map(([t, n]) => ({ tema: t, texto: tr("cresceu: ") + (anterior.get(t) || 0) + ' → ' + n + tr(' sonhos') })),
        ...cederam.slice(0, 3).map(([t, n]) => ({ tema: t, texto: tr("recuou: ") + n + ' → ' + (recente.get(t) || 0) + tr(' sonhos') })),
      ],
    });
  }

  // 9. Personificação: quem aparece nos relatos, pelo papel ou pelo nome.
  // (As imagens ligadas a cada pessoa ficam no Laboratório onírico.)
  add({
    ...META.figuras,
    itens: pessoasDoAcervo(ordenados, palavras, 6).map((p) => ({
      palavra: p.nome,
      texto: tr('em ') + plural(p.n, 'relato', 'relatos') + (p.peloNome ? tr(" · pelo nome") : ''),
    })),
  });

  // 10. A casa da psique: os cenários.
  {
    const set = new Set(LUGARES);
    add({
      ...META.lugares,
      itens: contarPalavras((k) => set.has(k)).filter((x) => x.n >= 3).slice(0, 6)
        .map((x) => ({ palavra: x.forma, texto: tr('em ') + plural(x.n, 'relato', 'relatos') })),
    });
  }

  // 11. Associação: símbolos que aparecem no texto e nunca viraram tema.
  {
    const ja = new Set([...FIGURAS, ...LUGARES, 'sonho', 'visao', 'presente', 'caminho', 'energia', 'alma', 'calma', 'brilho', 'frio', 'luz', 'medo', 'cair', 'velho', 'dream', 'vision', 'present', 'path', 'energy', 'soul', 'calm', 'shine', 'cold', 'light', 'fear', 'fall', 'old']);
    add({
      ...META.associacao,
      itens: contarPalavras((k) => ehSimbolo(k) && !temasNorm.has(k) && !ja.has(k) && k.length > 2).filter((x) => x.n >= 4).slice(0, 6)
        .map((x) => ({ palavra: x.forma, texto: tr('em ') + plural(x.n, 'relato', 'relatos') + tr(", nunca como tema") })),
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
      if (depois) itens.push({ tema: t, texto: tr("voltou em ") + plural(depois, 'sonho', 'sonhos') + tr(' depois') });
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
    }).reverse().slice(0, 5).map((s) => ({ sonho: refSonho(s), texto: tr('há {0}', [plural(hoje.getFullYear() - new Date(s.sonhado_em).getFullYear(), 'ano', 'anos')]) + ' · ' + dataDe(+new Date(s.sonhado_em)) }));
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
      .map((x) => ({ tema: x.tema, texto: tr('{0} de {1} aparições no {2}', [x.n, x.total, x.est]) }));
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
      comConclusao ? { texto: plural(comConclusao, tr("sonho já tem amplificação"), tr("sonhos já têm amplificação")) } : null,
      sessao ? { texto: plural(sessao, tr("sonho marcado"), tr("sonhos marcados")) + tr(" para levar à sessão") } : null,
      ...atencao.slice(-4).reverse().map((s) => ({ sonho: refSonho(s), texto: tr("pede atenção, sem amplificação") })),
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
      { texto: plural(ult30, tr("sonho lembrado"), tr("sonhos lembrados")) + tr(" nos últimos 30 dias") },
      diasDeAcervo >= 60 ? { texto: tr("média de ") + (ordenados.length / meses).toFixed(1).replace('.', tr(',')) + tr(" sonhos por mês desde o início") } : null,
      maior >= 3 ? { texto: tr("maior sequência: ") + maior + tr(" noites seguidas, até ") + dataDe(fimMaior) } : null,
      varios ? { texto: plural(varios, 'noite', 'noites') + tr(" com mais de um sonho") } : null,
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
          { texto: tr("mais sonhos nas ") + SEMANA[top] + ' (' + sem[top] + ')' },
          top !== baixo ? { texto: tr("menos nas ") + SEMANA[baixo] + ' (' + sem[baixo] + ')' } : null,
        ].filter(Boolean),
      });
    }
  }

  return { lista, total: sonhos.length, diasDeAcervo };
}

// ——— Laboratório onírico ———
// Observações extras, em teste: só aparecem para quem abriu o laboratório.
// Continuam sendo contagens: mostram o que anda junto, nunca o que significa.
export const META_LAB = {
  contexto: { id: 'contexto', nome: tr("Contexto"), titulo: tr("O que rodeia cada tema"),
    termo: tr("Jung pedia para levantar o contexto de cada imagem: tudo o que vem junto com ela. Aqui, imagens que também aparecem em outros sonhos, mas se juntam a esse tema bem mais do que o acaso explicaria, e que você nunca marcou junto com ele. Sinônimos e variações do próprio tema ficam de fora.") },
  encadeamento: { id: 'encadeamento', nome: tr("Encadeamento"), titulo: tr("Um tema que costuma puxar outro"),
    termo: tr("Lidos em série, os sonhos às vezes passam um tema adiante. Aqui, temas que aparecem no sonho seguinte a outro mais vezes do que no mesmo sonho.") },
  latente: { id: 'latente', nome: tr("Complexo latente"), titulo: tr("Imagens que andam juntas sem virar tema"),
    termo: tr("Antes de ganhar nome, um complexo já junta imagens. Aqui, pares de palavras que aparecem nos mesmos relatos bem mais do que o acaso explicaria, sem nenhuma delas ser tema.") },
};

export function calcularLaboratorio(sonhos) {
  const ordenados = [...sonhos].sort((a, b) => +new Date(a.sonhado_em) - +new Date(b.sonhado_em));
  const N = ordenados.length;
  const lista = [];
  if (N < 10) return { lista, pessoas: [], nomes: [], mapaTemas: null };
  const palavras = ordenados.map(palavrasDe);
  const temasDe = ordenados.map((s) => new Set(s.temas || []));
  const todosTemasNorm = new Set(ordenados.flatMap((s) => (s.temas || []).map((t) => singular(normalizar(t)))));
  const imagem = (k) => k.length > 2 && (ehSimbolo(k) || FIGURAS.includes(k) || LUGARES.includes(k));
  const add = (i) => { if (i.itens.length) lista.push(i); };

  // Em quantos relatos aparece cada palavra-imagem.
  const total = new Map(), forma = new Map();
  palavras.forEach((m) => { for (const [k, orig] of m) if (imagem(k)) { total.set(k, (total.get(k) || 0) + 1); if (!forma.has(k)) forma.set(k, orig); } });

  // 1. Contexto: palavras muito mais presentes nos sonhos de um tema.
  {
    const porTema = new Map();
    temasDe.forEach((ts, i) => { for (const t of ts) { if (!porTema.has(t)) porTema.set(t, []); porTema.get(t).push(i); } });
    const itens = [];
    for (const [tema, idx] of porTema) {
      const n = idx.length;
      if (n < 4 || n > N - 4) continue;
      const tNorm = singular(normalizar(tema));
      const marcadosJunto = new Set(idx.flatMap((i) => [...temasDe[i]].map((t) => singular(normalizar(t)))));
      const dentro = new Map();
      for (const i of idx) for (const k of palavras[i].keys()) if (imagem(k)) dentro.set(k, (dentro.get(k) || 0) + 1);
      const fortes = [...dentro].filter(([k, d]) => d >= 3 && k !== tNorm && !marcadosJunto.has(k) && !obvio(k, tema)
          // Palavra que quase só aparece com o tema é vocabulário do próprio tema (mar e onda):
          // o que interessa é a imagem que também vive em outros sonhos e mesmo assim se junta a ele.
          && total.get(k) - d >= 2 && d / total.get(k) <= 0.75)
        .map(([k, d]) => ({ k, d, forca: (d / n) / (((total.get(k) - d) + 1) / (N - n + 1)) }))
        .filter((x) => x.forca >= 2).sort((a, b) => b.forca - a.forca || b.d - a.d).slice(0, 5);
      if (fortes.length) itens.push({ tema, texto: tr('em ') + plural(n, 'sonho', 'sonhos'), ligados: fortes.map((x) => ({ palavra: forma.get(x.k) })), peso: fortes[0].forca });
    }
    add({ ...META_LAB.contexto, itens: itens.sort((a, b) => b.peso - a.peso).slice(0, 5).map(({ peso, ...x }) => x) }); // eslint-disable-line no-unused-vars
  }

  // 2. Encadeamento: o tema de um sonho volta como outro tema no sonho seguinte (até 7 dias depois).
  {
    const depois = new Map(), juntos = new Map();
    const k2 = (a, b) => a + '\u0000' + b;
    for (let i = 0; i < N; i++) {
      const a = temasDe[i];
      for (const x of a) for (const y of a) if (x < y) juntos.set(k2(x, y), (juntos.get(k2(x, y)) || 0) + 1);
      if (i + 1 >= N || +new Date(ordenados[i + 1].sonhado_em) - +new Date(ordenados[i].sonhado_em) > 7 * 864e5) continue;
      for (const x of a) for (const y of temasDe[i + 1]) if (x !== y && !a.has(y)) depois.set(k2(x, y), (depois.get(k2(x, y)) || 0) + 1);
    }
    add({
      ...META_LAB.encadeamento,
      itens: [...depois].map(([k, n]) => { const [a, b] = k.split('\u0000'); return { a, b, n, j: juntos.get(a < b ? k2(a, b) : k2(b, a)) || 0 }; })
        .filter((x) => x.n >= 3 && x.n > x.j && !obvio(x.a, x.b)).sort((p, q) => q.n - p.n).slice(0, 5)
        .map((x) => ({ tema: x.a, par: x.b, seta: true, texto: plural(x.n, 'vez', 'vezes') + tr(" no sonho seguinte") + (x.j ? ' · ' + x.j + tr(" no mesmo") : tr(", nunca no mesmo")) })),
    });
  }

  // 3. Complexo latente: pares de imagens que se atraem nos relatos, nenhuma marcada como tema.
  {
    const cand = [...total].filter(([k, n]) => n >= 3 && n <= N * 0.5 && !todosTemasNorm.has(k)).map(([k]) => k);
    const set = new Set(cand);
    const pares = new Map();
    palavras.forEach((m) => {
      const ks = [...m.keys()].filter((k) => set.has(k)).sort();
      for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const k = ks[i] + '\u0000' + ks[j]; pares.set(k, (pares.get(k) || 0) + 1); }
    });
    add({
      ...META_LAB.latente,
      itens: [...pares].map(([k, n]) => { const [a, b] = k.split('\u0000'); return { a, b, n, forca: (n * N) / (total.get(a) * total.get(b)) }; })
        .filter((x) => x.n >= 3 && x.forca >= 2 && !obvio(x.a, x.b)).sort((p, q) => q.n - p.n || q.forca - p.forca).slice(0, 5)
        .map((x) => ({ palavra: forma.get(x.a), parPalavra: forma.get(x.b), texto: tr("juntas em ") + plural(x.n, 'relato', 'relatos') })),
    });
  }

  // Mapa das pessoas: quem aparece e o que vem junto com cada uma.
  // Quem aparece nos relatos (pelo papel ou pelo nome) e, à parte, as tags que são nome de alguém.
  const pessoas = pessoasDoAcervo(ordenados, palavras, 10);
  const nomes = pessoasPorTag(ordenados);

  // Mapa dos temas no tempo: os temas mais frequentes, mês a mês (ou por trimestre em acervos longos).
  let mapaTemas = null;
  {
    const ini = new Date(ordenados[0].sonhado_em), fim = new Date(ordenados[N - 1].sonhado_em);
    const meses = (fim.getFullYear() - ini.getFullYear()) * 12 + fim.getMonth() - ini.getMonth() + 1;
    const passo = meses > 36 ? 6 : meses > 12 ? 3 : 1; // semestre, trimestre ou mês
    // Colunas alinhadas ao começo de cada período (jan/jul, jan/abr/jul/out ou cada mês).
    const inicio = (d) => new Date(d.getFullYear(), d.getMonth() - (d.getMonth() % passo), 1);
    const a = inicio(ini), z = inicio(fim);
    const periodos = ((z.getFullYear() - a.getFullYear()) * 12 + z.getMonth() - a.getMonth()) / passo + 1;
    const colunas = Math.min(24, periodos);
    const base = new Date(z.getFullYear(), z.getMonth() - (colunas - 1) * passo, 1);
    const col = (d) => Math.floor(((d.getFullYear() - base.getFullYear()) * 12 + d.getMonth() - base.getMonth()) / passo);
    const rotulos = Array.from({ length: colunas }, (_, c) => {
      const d = new Date(base.getFullYear(), base.getMonth() + c * passo, 1);
      return { curto: passo === 1 ? MESES[d.getMonth()] : passo === 3 ? (ingles ? 'Q' + (Math.floor(d.getMonth() / 3) + 1) : (Math.floor(d.getMonth() / 3) + 1) + 'º tri') : ingles ? (d.getMonth() < 6 ? 'H1' : 'H2') : (d.getMonth() < 6 ? '1º' : '2º') + ' sem', ano: d.getFullYear() };
    });
    const ocorre = new Map();
    for (const s of ordenados) {
      const c = col(new Date(s.sonhado_em));
      if (c < 0) continue;
      for (const t of new Set(s.temas || [])) { if (!ocorre.has(t)) ocorre.set(t, Array(colunas).fill(0)); ocorre.get(t)[c]++; }
    }
    const totais = Array(colunas).fill(0);
    for (const s of ordenados) { const c = col(new Date(s.sonhado_em)); if (c >= 0) totais[c]++; }
    const linhas = [...ocorre].map(([tema, v]) => ({ tema, valores: v, total: v.reduce((a, b) => a + b, 0) }))
      .filter((l) => l.total >= 3).sort((a, b) => b.total - a.total).slice(0, 10);
    if (linhas.length >= 2) mapaTemas = { passo, rotulos, linhas, totais };
  }

  return { lista, pessoas, nomes, mapaTemas, periodo: { ini: +new Date(ordenados[0].sonhado_em), fim: Date.now() } };
}
