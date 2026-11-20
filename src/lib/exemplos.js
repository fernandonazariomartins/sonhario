// Sonhos e insights de exemplo para quem está começando.
// Nada daqui é salvo: os exemplos vivem só na tela e saem um a um,
// a cada sonho de verdade que a pessoa registra.
import { META } from './insights.js';

const DIA = 864e5;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA_CURTA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

// Data de N dias atrás, numa hora de quem acabou de acordar.
function diasAtras(n, h, m) {
  const d = new Date(Date.now() - n * DIA);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const BASE = [
  {
    id: 'exemplo-porao', dias: 1, h: 6, m: 42, cor: 'azul', status: 'dar_atencao',
    titulo: 'O porão alagado', temas: ['casa', 'água'],
    texto: 'Eu estava na casa da minha avó, mas ela tinha um porão que nunca existiu. Desci a escada e a água batia nos joelhos. Não era fria. Boiavam cadernos da escola, todos com a minha letra. Acordei antes de chegar ao fundo.',
    conclusoes: [{ origem: 'sozinho', texto: 'O porão lembra a casa que Jung sonhou, descendo andar por andar. Os cadernos me levam à época do colégio, quando eu escrevia todos os dias.' }],
  },
  {
    id: 'exemplo-onibus', dias: 3, h: 7, m: 5, cor: 'amarelo', status: 'aberto',
    titulo: 'Ônibus sem ponto final', temas: ['viagem', 'trabalho'],
    texto: 'Peguei o ônibus para o trabalho, mas ele seguia por ruas que eu não conhecia. Perguntei ao motorista onde era o ponto final e ele respondeu que eu sabia. Fiquei olhando pela janela, calmo, sem pressa de descer.',
    conclusoes: [{ origem: 'sessao', texto: 'Na sessão, falamos da troca de emprego: seguir sem saber onde termina, e a calma que apareceu no sonho e ainda não aparece acordado.' }],
  },
  {
    id: 'exemplo-chave', dias: 4, h: 5, m: 58, cor: 'branco', status: 'nao_aberto',
    titulo: '', temas: ['mãe', 'chave'],
    texto: 'Minha mãe me entregava uma chave pequena, de metal escuro, e pedia para eu não perder. Não lembro do resto.',
    conclusoes: [],
  },
  {
    id: 'exemplo-prova', dias: 6, h: 6, m: 20, cor: 'lilas', status: 'aberto',
    titulo: 'Prova de uma matéria que eu nunca cursei', temas: ['escola', 'casa'],
    texto: 'Era dia de prova na faculdade, numa sala que ficava dentro da casa onde cresci. Eu não tinha assistido a nenhuma aula daquela matéria. Os colegas escreviam rápido. Virei a folha e as perguntas eram sobre a minha própria vida.',
    conclusoes: [],
  },
  {
    id: 'exemplo-irmao', dias: 9, h: 7, m: 31, cor: 'verde', status: 'dar_atencao',
    titulo: 'O irmão que eu não tenho', temas: ['família', 'desconhecido'],
    texto: 'Um homem da minha idade sentava à mesa do almoço de domingo e todos o tratavam como meu irmão. Ninguém achava estranho, só eu. Ele me olhava como quem espera que eu diga alguma coisa.',
    conclusoes: [],
  },
];

export const TOTAL_EXEMPLOS = BASE.length;

// Os exemplos que ainda aparecem: um sai a cada sonho registrado.
export function sonhosDeExemplo(quantosReais) {
  const n = Math.max(0, BASE.length - quantosReais);
  return BASE.slice(0, n).map(({ dias, h, m, conclusoes, ...s }) => {
    const sonhado_em = diasAtras(dias, h, m);
    return {
      ...s, exemplo: true, sonhado_em, criado_em: sonhado_em, atualizado_em: sonhado_em,
      levar_sessao: false, audio: null,
      conclusoes: conclusoes.map((c, i) => ({ id: s.id + '-c' + i, em: diasAtras(dias - 0.3, 21, 10), ...c })),
    };
  });
}

// ——— Insights ———

// Os insights que aparecem abertos como exemplo (os outros ficam embaçados).
export const INSIGHTS_EXEMPLO = ['primordiais', 'complexo', 'energia'];

const sonhoEx = (titulo) => ({ id: null, titulo });

function mesesAteAgora(valores) {
  const hoje = new Date();
  return valores.map((n, k) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (valores.length - 1 - k), 1);
    return { rotulo: MESES[d.getMonth()], n };
  });
}

// Conteúdo inventado, só para mostrar o formato de cada insight.
function conteudo(id) {
  const ano = new Date().getFullYear();
  switch (id) {
    case 'primordiais': return { itens: [
      { tema: 'casa', texto: '14 sonhos · 22% do acervo' },
      { tema: 'água', texto: '11 sonhos · 17% do acervo' },
      { tema: 'mãe', texto: '9 sonhos · 14% do acervo' },
      { tema: 'escola', texto: '6 sonhos · 9% do acervo' },
    ] };
    case 'circum': return { itens: [
      { tema: 'água', texto: '4 sonhos nos últimos 30 dias' },
      { tema: 'viagem', texto: '2 sonhos nos últimos 30 dias' },
    ] };
    case 'constelacao': return { itens: [{ tema: 'escola', texto: 'voltou depois de 8 meses sem aparecer' }] };
    case 'serie': return { itens: [{ tema: 'casa', texto: '4 sonhos seguidos · a partir de mar ' + ano }] };
    case 'recorrente': return { itens: [{ tema: 'casa', texto: 'em 4 anos diferentes, desde ' + (ano - 3) + ' · também este ano' }] };
    case 'latencia': return { itens: [{ tema: 'avião', texto: '6 sonhos · o último há 3 meses' }] };
    case 'complexo': return { itens: [
      { tema: 'casa', par: 'mãe', texto: 'juntos em 5 sonhos' },
      { tema: 'água', par: 'viagem', texto: 'juntos em 3 sonhos' },
    ] };
    case 'enantiodromia': return { itens: [
      { tema: 'água', texto: 'cresceu: 1 → 6 sonhos' },
      { tema: 'trabalho', texto: 'recuou: 7 → 1 sonhos' },
    ] };
    case 'figuras': return { itens: [
      { palavra: 'mãe', texto: 'em 9 relatos' },
      { palavra: 'Tomás', texto: 'em 5 relatos · pelo nome' },
      { palavra: 'desconhecido', texto: 'em 4 relatos' },
    ] };
    case 'grandes': return { itens: [
      { sonho: sonhoEx('A casa com um andar a mais'), texto: '5 temas · 3 pessoas · 4 lugares · 9 imagens · 640 palavras' },
      { sonho: sonhoEx('O porão alagado'), texto: '4 temas · 2 pessoas · 3 lugares · 6 imagens · 410 palavras' },
    ] };
    case 'lugares': return { itens: [
      { palavra: 'casa', texto: 'em 14 relatos' },
      { palavra: 'escola', texto: 'em 6 relatos' },
      { palavra: 'estrada', texto: 'em 5 relatos' },
    ] };
    case 'associacao': return { itens: [
      { palavra: 'chave', texto: 'em 5 relatos, nunca como tema' },
      { palavra: 'ponte', texto: 'em 4 relatos, nunca como tema' },
    ] };
    case 'inicial': return { itens: [
      { sonho: sonhoEx('A casa com um andar a mais'), texto: '3 mar ' + (ano - 3) },
      { tema: 'casa', texto: 'voltou em 13 sonhos depois' },
    ] };
    case 'ciclo': return { itens: [{ sonho: sonhoEx('O trem que não parava'), texto: 'há 1 ano · ' + new Date().getDate() + ' ' + MESES[new Date().getMonth()] + ' ' + (ano - 1) }] };
    case 'estacoes': return { itens: [{ tema: 'água', texto: '7 de 11 aparições no verão' }] };
    case 'confronto': return { itens: [
      { texto: '3 sonhos marcados para levar à sessão' },
      { sonho: sonhoEx('O porão alagado'), texto: 'pede atenção, sem amplificação' },
    ] };
    case 'energia': return {
      barras: mesesAteAgora([3, 5, 4, 2, 6, 8, 5, 7, 9, 6, 10, 8]),
      itens: [
        { texto: '8 sonhos lembrados nos últimos 30 dias' },
        { texto: 'maior sequência: 6 noites seguidas' },
      ],
    };
    case 'semana': return {
      barras: [6, 4, 5, 3, 4, 9, 11].map((n, k) => ({ rotulo: SEMANA_CURTA[k], n, destaque: k === 6 })),
      itens: [{ texto: 'mais sonhos nos domingos (11)' }, { texto: 'menos nas quintas (3)' }],
    };
    default: return { itens: [] };
  }
}

export function insightDeExemplo(id) {
  return { ...META[id], ...conteudo(id) };
}

const falta = (n, alvo) => {
  const f = Math.max(1, alvo - n);
  return 'Aparece com ' + alvo + ' sonhos · ' + (f === 1 ? 'falta 1' : 'faltam ' + f);
};

// O que destrava cada insight, em linguagem simples.
export function requisito(id, { total, diasDeAcervo }) {
  switch (id) {
    case 'primordiais': return 'Aparece quando um tema estiver em 3 sonhos';
    case 'circum': return 'Aparece quando um tema voltar 2 vezes no mesmo mês';
    case 'constelacao': return 'Aparece quando um tema voltar depois de 3 meses sumido';
    case 'serie': return 'Aparece quando um tema estiver em 3 sonhos seguidos';
    case 'recorrente': return 'Aparece quando um tema atravessar 3 anos diferentes';
    case 'latencia': return 'Aparece quando um tema frequente ficar 2 meses em silêncio';
    case 'complexo': return 'Aparece quando dois temas estiverem juntos em 3 sonhos';
    case 'enantiodromia': return diasDeAcervo < 120 ? 'Aparece com uns 6 meses de registros' : 'Aparece quando um tema crescer ou recuar entre um trimestre e outro';
    case 'figuras': return 'Aparece quando uma pessoa estiver em 3 relatos';
    case 'lugares': return 'Aparece quando um lugar estiver em 3 relatos';
    case 'associacao': return 'Aparece quando uma imagem estiver em 4 relatos sem virar tema';
    case 'grandes': return total < 10 ? falta(total, 10) : 'Aparece quando houver relatos mais longos que a média';
    case 'inicial': return total < 10 ? falta(total, 10) : 'Aparece com 10 sonhos';
    case 'ciclo': return diasDeAcervo < 365 ? 'Aparece quando o seu acervo fizer um ano' : 'Aparece quando houver sonho nestes dias em outro ano';
    case 'estacoes': return diasDeAcervo < 365 ? 'Aparece quando o seu acervo fizer um ano' : 'Aparece quando um tema se concentrar numa estação';
    case 'confronto': return 'Aparece quando você marcar um sonho para dar atenção ou levar à sessão';
    case 'energia': return falta(total, 5);
    case 'semana': return total < 20 ? falta(total, 20) : 'Aparece com 20 sonhos';
    default: return 'Aparece com mais sonhos registrados';
  }
}
