// Sonhos e insights de exemplo para quem está começando.
// Nada daqui é salvo: os exemplos vivem só na tela e saem um a um,
// a cada sonho de verdade que a pessoa registra.
import { META } from './insights.js';
import { tr, ingles, MESES_CURTOS, dataCurta } from './i18n.js';

const DIA = 864e5;
const MESES = MESES_CURTOS;
const SEMANA_CURTA = ingles ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

// Data de N dias atrás, numa hora de quem acabou de acordar.
function diasAtras(n, h, m) {
  const d = new Date(Date.now() - n * DIA);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const BASE = [
  {
    id: 'exemplo-porao', dias: 1, h: 6, m: 42, cor: 'azul', status: 'dar_atencao',
    titulo: tr("O porão alagado"), temas: [tr('casa'), tr("água")],
    texto: tr("Eu estava na casa da minha avó, mas ela tinha um porão que nunca existiu. Desci a escada e a água batia nos joelhos. Não era fria. Boiavam cadernos da escola, todos com a minha letra. Acordei antes de chegar ao fundo."),
    conclusoes: [{ origem: 'sozinho', texto: tr("O porão lembra a casa que Jung sonhou, descendo andar por andar. Os cadernos me levam à época do colégio, quando eu escrevia todos os dias.") }],
  },
  {
    id: 'exemplo-onibus', dias: 3, h: 7, m: 5, cor: 'amarelo', status: 'aberto',
    titulo: tr("Ônibus sem ponto final"), temas: [tr('viagem'), tr('trabalho')],
    texto: tr("Peguei o ônibus para o trabalho, mas ele seguia por ruas que eu não conhecia. Perguntei ao motorista onde era o ponto final e ele respondeu que eu sabia. Fiquei olhando pela janela, calmo, sem pressa de descer."),
    conclusoes: [{ origem: 'sessao', texto: tr("Na sessão, falamos da troca de emprego: seguir sem saber onde termina, e a calma que apareceu no sonho e ainda não aparece acordado.") }],
  },
  {
    id: 'exemplo-chave', dias: 4, h: 5, m: 58, cor: 'branco', status: 'nao_aberto',
    titulo: '', temas: [tr("mãe"), tr('chave')],
    texto: tr("Minha mãe me entregava uma chave pequena, de metal escuro, e pedia para eu não perder. Não lembro do resto."),
    conclusoes: [],
  },
  {
    id: 'exemplo-prova', dias: 6, h: 6, m: 20, cor: 'lilas', status: 'aberto',
    titulo: tr("Prova de uma matéria que eu nunca cursei"), temas: [tr('escola'), tr('casa')],
    texto: tr("Era dia de prova na faculdade, numa sala que ficava dentro da casa onde cresci. Eu não tinha assistido a nenhuma aula daquela matéria. Os colegas escreviam rápido. Virei a folha e as perguntas eram sobre a minha própria vida."),
    conclusoes: [],
  },
  {
    id: 'exemplo-irmao', dias: 9, h: 7, m: 31, cor: 'verde', status: 'dar_atencao',
    titulo: tr("O irmão que eu não tenho"), temas: [tr("família"), tr('desconhecido')],
    texto: tr("Um homem da minha idade sentava à mesa do almoço de domingo e todos o tratavam como meu irmão. Ninguém achava estranho, só eu. Ele me olhava como quem espera que eu diga alguma coisa."),
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
      { tema: tr('casa'), texto: tr("14 sonhos · 22% do acervo") },
      { tema: tr("água"), texto: tr("11 sonhos · 17% do acervo") },
      { tema: tr("mãe"), texto: tr("9 sonhos · 14% do acervo") },
      { tema: tr('escola'), texto: tr("6 sonhos · 9% do acervo") },
    ] };
    case 'circum': return { itens: [
      { tema: tr("água"), texto: tr("4 sonhos nos últimos 30 dias") },
      { tema: tr('viagem'), texto: tr("2 sonhos nos últimos 30 dias") },
    ] };
    case 'constelacao': return { itens: [{ tema: tr('escola'), texto: tr("voltou depois de 8 meses sem aparecer") }] };
    case 'serie': return { itens: [{ tema: tr('casa'), texto: tr("4 sonhos seguidos · a partir de mar ") + ano }] };
    case 'recorrente': return { itens: [{ tema: tr('casa'), texto: tr("em 4 anos diferentes, desde ") + (ano - 3) + tr(" · também este ano") }] };
    case 'latencia': return { itens: [{ tema: tr("avião"), texto: tr("6 sonhos · o último há 3 meses") }] };
    case 'complexo': return { itens: [
      { tema: tr('casa'), par: tr("mãe"), texto: tr("juntos em 5 sonhos") },
      { tema: tr("água"), par: tr('viagem'), texto: tr("juntos em 3 sonhos") },
    ] };
    case 'enantiodromia': return { itens: [
      { tema: tr("água"), texto: tr("cresceu: 1 → 6 sonhos") },
      { tema: tr('trabalho'), texto: tr("recuou: 7 → 1 sonhos") },
    ] };
    case 'figuras': return { itens: [
      { palavra: tr("mãe"), texto: tr("em 9 relatos") },
      { palavra: tr("Tomás"), texto: tr("em 5 relatos · pelo nome") },
      { palavra: tr('desconhecido'), texto: tr("em 4 relatos") },
    ] };
    case 'grandes': return { itens: [
      { sonho: sonhoEx(tr("A casa com um andar a mais")), texto: tr("5 temas · 3 pessoas · 4 lugares · 9 imagens · 640 palavras") },
      { sonho: sonhoEx(tr("O porão alagado")), texto: tr("4 temas · 2 pessoas · 3 lugares · 6 imagens · 410 palavras") },
    ] };
    case 'lugares': return { itens: [
      { palavra: tr('casa'), texto: tr("em 14 relatos") },
      { palavra: tr('escola'), texto: tr("em 6 relatos") },
      { palavra: tr('estrada'), texto: tr("em 5 relatos") },
    ] };
    case 'associacao': return { itens: [
      { palavra: tr('chave'), texto: tr("em 5 relatos, nunca como tema") },
      { palavra: tr('ponte'), texto: tr("em 4 relatos, nunca como tema") },
    ] };
    case 'inicial': return { itens: [
      { sonho: sonhoEx(tr("A casa com um andar a mais")), texto: dataCurta(new Date(ano - 3, 2, 3)) },
      { tema: tr('casa'), texto: tr("voltou em 13 sonhos depois") },
    ] };
    case 'ciclo': return { itens: [{ sonho: sonhoEx(tr("O trem que não parava")), texto: tr("há 1 ano · ") + dataCurta(new Date(ano - 1, new Date().getMonth(), new Date().getDate())) }] };
    case 'estacoes': return { itens: [{ tema: tr("água"), texto: tr("7 de 11 aparições no verão") }] };
    case 'confronto': return { itens: [
      { texto: tr("3 sonhos marcados para levar à sessão") },
      { sonho: sonhoEx(tr("O porão alagado")), texto: tr("pede atenção, sem amplificação") },
    ] };
    case 'energia': return {
      barras: mesesAteAgora([3, 5, 4, 2, 6, 8, 5, 7, 9, 6, 10, 8]),
      itens: [
        { texto: tr("8 sonhos lembrados nos últimos 30 dias") },
        { texto: tr("maior sequência: 6 noites seguidas") },
      ],
    };
    case 'semana': return {
      barras: [6, 4, 5, 3, 4, 9, 11].map((n, k) => ({ rotulo: SEMANA_CURTA[k], n, destaque: k === 6 })),
      itens: [{ texto: tr("mais sonhos nos domingos (11)") }, { texto: tr("menos nas quintas (3)") }],
    };
    default: return { itens: [] };
  }
}

export function insightDeExemplo(id) {
  return { ...META[id], ...conteudo(id) };
}

const falta = (n, alvo) => {
  const f = Math.max(1, alvo - n);
  return tr("Aparece com ") + alvo + tr(" sonhos · ") + (f === 1 ? tr("falta 1") : tr('faltam {0}', [f]));
};

// O que destrava cada insight, em linguagem simples.
export function requisito(id, { total, diasDeAcervo }) {
  switch (id) {
    case 'primordiais': return tr("Aparece quando um tema estiver em 3 sonhos");
    case 'circum': return tr("Aparece quando um tema voltar 2 vezes no mesmo mês");
    case 'constelacao': return tr("Aparece quando um tema voltar depois de 3 meses sumido");
    case 'serie': return tr("Aparece quando um tema estiver em 3 sonhos seguidos");
    case 'recorrente': return tr("Aparece quando um tema atravessar 3 anos diferentes");
    case 'latencia': return tr("Aparece quando um tema frequente ficar 2 meses em silêncio");
    case 'complexo': return tr("Aparece quando dois temas estiverem juntos em 3 sonhos");
    case 'enantiodromia': return diasDeAcervo < 120 ? tr("Aparece com uns 6 meses de registros") : tr("Aparece quando um tema crescer ou recuar entre um trimestre e outro");
    case 'figuras': return tr("Aparece quando uma pessoa estiver em 3 relatos");
    case 'lugares': return tr("Aparece quando um lugar estiver em 3 relatos");
    case 'associacao': return tr("Aparece quando uma imagem estiver em 4 relatos sem virar tema");
    case 'grandes': return total < 10 ? falta(total, 10) : tr("Aparece quando houver relatos mais longos que a média");
    case 'inicial': return total < 10 ? falta(total, 10) : tr("Aparece com 10 sonhos");
    case 'ciclo': return diasDeAcervo < 365 ? tr("Aparece quando o seu acervo fizer um ano") : tr("Aparece quando houver sonho nestes dias em outro ano");
    case 'estacoes': return diasDeAcervo < 365 ? tr("Aparece quando o seu acervo fizer um ano") : tr("Aparece quando um tema se concentrar numa estação");
    case 'confronto': return tr("Aparece quando você marcar um sonho para dar atenção ou levar à sessão");
    case 'energia': return falta(total, 5);
    case 'semana': return total < 20 ? falta(total, 20) : tr("Aparece com 20 sonhos");
    default: return tr("Aparece com mais sonhos registrados");
  }
}
